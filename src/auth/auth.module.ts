import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { JwtModule } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { DatabaseModule } from '../database/database.module.js';
import { RefreshTokensRepository } from './refresh-tokens.repository.js';
import { AuthCryptoProvider } from './auth-crypto.provider.js';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.accessSecret,
        signOptions: {
          expiresIn: config.accessExpiresIn,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokensRepository,
    AuthCryptoProvider,
  ],
})
export class AuthModule {}
