// services/auth/src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerModule } from '@nestjs/throttler'
import { RedisModule } from '@liaoliaots/nestjs-redis'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { HealthModule } from './health/health.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60_000, limit: 10 },   // 10 req/min (strict endpoints)
      { name: 'medium', ttl: 60_000, limit: 100 },  // 100 req/min (general)
    ]),

    RedisModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        config: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
          db: 0,
        },
      }),
      inject: [ConfigService],
    }),

    JwtModule.registerAsync({
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '15m', issuer: 'karta.earth' },
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}
