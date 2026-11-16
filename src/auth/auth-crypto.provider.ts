import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config.js';
import * as bcrypt from 'bcrypt';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from './types/jwt-payload.type.js';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthCryptoProvider {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, BCRYPT_ROUNDS);
  }

  async compareRefreshToken(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  async signAccessToken(userId: number): Promise<string> {
    const payload: AccessTokenPayload = { sub: userId, type: 'access' };
    return this.jwtService.signAsync(payload);
  }

  async signRefreshToken(
    userId: number,
    jti: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const payload: Omit<RefreshTokenPayload, 'exp'> = {
      sub: userId,
      jti,
      type: 'refresh',
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.jwtConfiguration.refreshSecret,
      expiresIn: this.jwtConfiguration.refreshExpiresIn,
    });

    const { exp } = this.jwtService.decode<RefreshTokenPayload>(token);

    return {
      token,
      expiresAt: new Date(exp * 1000),
    };
  }
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
      token,
      { secret: this.jwtConfiguration.refreshSecret },
    );

    if (payload.type !== 'refresh' || typeof payload.jti !== 'string') {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
