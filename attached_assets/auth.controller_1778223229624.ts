// services/auth/src/auth/auth.controller.ts
import {
  Controller, Post, Body, Get, Req, Res, UseGuards,
  HttpCode, HttpStatus, Headers, Ip,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { SendOtpDto, VerifyOtpDto } from './auth.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import type { JwtPayload } from '@karta/shared'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/v1/auth/otp/send
   * Rate limited: 5 req/10min per IP (strict throttle)
   */
  @Post('otp/send')
  @Throttle({ short: { limit: 5, ttl: 600_000 } })
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone)
  }

  /**
   * POST /api/v1/auth/otp/verify
   * Returns httpOnly refresh token cookie + access token in body
   */
  @Post('otp/verify')
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-device-hash') deviceHash?: string,
    @Ip() ip?: string,
  ) {
    const result = await this.authService.verifyOtp(dto.phone, dto.otp, deviceHash, ip)

    // Set refresh token as httpOnly cookie
    res.cookie('karta_rt', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      path: '/api/v1/auth',
    })

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
        isNewUser: result.isNewUser,
      },
    }
  }

  /**
   * POST /api/v1/auth/refresh
   * Uses httpOnly cookie for refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.karta_rt
    if (!refreshToken) {
      return { success: false, error: { code: 'AUTH_004', message: 'No refresh token' } }
    }

    const result = await this.authService.refresh(refreshToken)

    res.cookie('karta_rt', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })

    return { success: true, data: { accessToken: result.accessToken } }
  }

  /**
   * POST /api/v1/auth/logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sessionId)
    res.clearCookie('karta_rt', { path: '/api/v1/auth' })
    return { success: true, data: { message: 'Logged out' } }
  }

  /**
   * GET /api/v1/auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload) {
    return { success: true, data: { user } }
  }
}
