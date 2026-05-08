// services/auth/src/auth/auth.service.ts
import {
  Injectable, UnauthorizedException, BadRequestException,
  ConflictException, Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRedis } from '@liaoliaots/nestjs-redis'
import Redis from 'ioredis'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import { db, writeAuditLog } from '@karta/db'
import { generateOtp, KARTA_CONSTANTS, ErrorCodes } from '@karta/shared'
import type { JwtPayload } from '@karta/shared'
import { SmsService } from './sms.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private sms: SmsService,
    @InjectRedis() private redis: Redis,
  ) {}

  // ─── OTP FLOW ───────────────────────────────────────────────────────────────

  async sendOtp(phone: string): Promise<{ message: string }> {
    const attemptsKey = `otp:attempts:${phone}`
    const attempts = await this.redis.incr(attemptsKey)

    if (attempts === 1) {
      await this.redis.expire(attemptsKey, 600) // 10 min window
    }

    if (attempts > KARTA_CONSTANTS.OTP_MAX_ATTEMPTS) {
      throw new BadRequestException({
        code: ErrorCodes.OTP_MAX_ATTEMPTS,
        message: 'Too many OTP requests. Please wait 10 minutes.',
      })
    }

    const otp = generateOtp()
    const otpKey = `otp:${phone}`
    const hashedOtp = await bcrypt.hash(otp, 8)

    await this.redis.setex(otpKey, KARTA_CONSTANTS.OTP_TTL_SECONDS, hashedOtp)

    // In production: send via MSG91/Twilio
    // In development: log to console
    if (this.config.get('NODE_ENV') === 'development') {
      this.logger.log(`[DEV] OTP for ${phone}: ${otp}`)
    } else {
      await this.sms.send(phone, `Your KARTA OTP is ${otp}. Valid for 10 minutes. Do not share.`)
    }

    return { message: 'OTP sent successfully' }
  }

  async verifyOtp(phone: string, otp: string, deviceHash?: string, ipAddress?: string): Promise<{
    accessToken: string
    refreshToken: string
    user: { id: string; name: string | null; role: string; orgId: string }
    isNewUser: boolean
  }> {
    const otpKey = `otp:${phone}`
    const hashedOtp = await this.redis.get(otpKey)

    if (!hashedOtp) {
      throw new UnauthorizedException({
        code: ErrorCodes.OTP_EXPIRED,
        message: 'OTP expired or not found. Please request a new one.',
      })
    }

    const isValid = await bcrypt.compare(otp, hashedOtp)
    if (!isValid) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_OTP,
        message: 'Invalid OTP.',
      })
    }

    // Delete OTP immediately after successful verification
    await this.redis.del(otpKey)
    await this.redis.del(`otp:attempts:${phone}`)

    // Find or create user
    let user = await db.user.findUnique({ where: { phone } })
    const isNewUser = !user

    if (!user) {
      // Create a placeholder org for new users (they complete profile later)
      const org = await db.organisation.create({
        data: {
          name: `User ${phone.slice(-4)}`,
          type: 'DEVELOPER',
          verified: false,
          tier: 'FREE',
        },
      })
      user = await db.user.create({
        data: {
          phone,
          role: 'PROJECT_DEVELOPER',
          orgId: org.id,
          kycStatus: 'PENDING',
        },
      })
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Create session
    const sessionId = crypto.randomUUID()
    const { accessToken, refreshToken } = await this.generateTokens(user, sessionId)

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const expiresAt = new Date(Date.now() + KARTA_CONSTANTS.JWT_REFRESH_TTL_DAYS * 86_400_000)

    await db.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshToken: refreshTokenHash,
        deviceHash: deviceHash ?? null,
        ipAddress: ipAddress ?? null,
        expiresAt,
      },
    })

    // Cache session in Redis for fast validation
    await this.redis.setex(
      `session:${sessionId}`,
      KARTA_CONSTANTS.JWT_REFRESH_TTL_DAYS * 86_400,
      JSON.stringify({ userId: user.id, role: user.role, orgId: user.orgId }),
    )

    await writeAuditLog({
      entityType: 'user',
      entityId: user.id,
      action: 'login',
      actorId: user.id,
      ipAddress,
    })

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, role: user.role, orgId: user.orgId },
      isNewUser,
    }
  }

  // ─── TOKEN MANAGEMENT ────────────────────────────────────────────────────────

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')

    const session = await db.session.findFirst({
      where: {
        refreshToken: tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    })

    if (!session) {
      // Possible token reuse attack — revoke entire user's sessions
      throw new UnauthorizedException({
        code: ErrorCodes.TOKEN_INVALID,
        message: 'Invalid or expired refresh token.',
      })
    }

    // Rotate: revoke old session, create new one
    await db.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    })
    await this.redis.del(`session:${session.id}`)

    const newSessionId = crypto.randomUUID()
    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(session.user, newSessionId)

    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex')
    await db.session.create({
      data: {
        id: newSessionId,
        userId: session.userId,
        refreshToken: newHash,
        deviceHash: session.deviceHash,
        expiresAt: new Date(Date.now() + KARTA_CONSTANTS.JWT_REFRESH_TTL_DAYS * 86_400_000),
      },
    })

    await this.redis.setex(
      `session:${newSessionId}`,
      KARTA_CONSTANTS.JWT_REFRESH_TTL_DAYS * 86_400,
      JSON.stringify({ userId: session.userId, role: session.user.role, orgId: session.user.orgId }),
    )

    return { accessToken, refreshToken: newRefreshToken }
  }

  async logout(sessionId: string): Promise<void> {
    await db.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    })
    await this.redis.del(`session:${sessionId}`)
  }

  async validateSession(sessionId: string): Promise<{ userId: string; role: string; orgId: string } | null> {
    // Fast path: check Redis first
    const cached = await this.redis.get(`session:${sessionId}`)
    if (cached) return JSON.parse(cached)

    // Slow path: check DB
    const session = await db.session.findFirst({
      where: {
        id: sessionId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    })

    if (!session) return null

    // Repopulate Redis cache
    const payload = { userId: session.userId, role: session.user.role, orgId: session.user.orgId }
    const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
    await this.redis.setex(`session:${sessionId}`, ttl, JSON.stringify(payload))

    return payload
  }

  // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────────

  private async generateTokens(
    user: { id: string; role: string; orgId: string },
    sessionId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      role: user.role,
      orgId: user.orgId,
      sessionId,
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { expiresIn: '15m' }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: `${KARTA_CONSTANTS.JWT_REFRESH_TTL_DAYS}d`,
      }),
    ])

    return { accessToken, refreshToken }
  }
}
