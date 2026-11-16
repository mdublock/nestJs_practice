import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';
import { UsersRepository } from '../users/users.repository.js';
import { AuthCryptoProvider } from './auth-crypto.provider.js';
import { randomUUID } from 'crypto';
import { RefreshTokensRepository } from './refresh-tokens.repository.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private authCryptoProvider: AuthCryptoProvider,
    private refreshTokensRepository: RefreshTokensRepository,
  ) {}

  async register(userData: {
    login: string;
    email: string;
    password: string;
    age?: number;
    about?: string;
  }) {
    const passwordHash = await this.authCryptoProvider.hashPassword(
      userData.password,
    );

    return this.usersRepository.createWithRefreshToken(
      {
        login: userData.login,
        email: userData.email,
        password_hash: passwordHash,
        age: userData.age,
        about: userData.about,
      },
      async (userId) => {
        const { accessToken, refreshToken, tokenData } =
          await this.generateTokenPair(userId);

        return { tokenData, result: { accessToken, refreshToken } };
      },
    );
  }

  async login(userData: LoginDto) {
    const user = await this.usersRepository.findByLogin(userData.login);
    if (!user) {
      throw new UnauthorizedException();
    }
    const isMatch = await this.authCryptoProvider.comparePassword(
      userData.password,
      user.password_hash,
    );
    if (!isMatch) {
      throw new UnauthorizedException();
    }
    const tokens = await this.generateTokenPair(user.id);
    await this.refreshTokensRepository.create(tokens.tokenData);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    let payload: Awaited<ReturnType<AuthCryptoProvider['verifyRefreshToken']>>;

    try {
      payload = await this.authCryptoProvider.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException();
    }
    const storedToken = await this.refreshTokensRepository.findByJti(
      payload.jti,
    );
    if (!storedToken) {
      throw new UnauthorizedException();
    }
    if (storedToken.user_id !== payload.sub) {
      throw new UnauthorizedException();
    }
    const isValid = await this.authCryptoProvider.compareRefreshToken(
      refreshToken,
      storedToken.token_hash,
    );
    if (!isValid) {
      throw new UnauthorizedException();
    }
    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    const tokens = await this.generateTokenPair(payload.sub);

    const rotated = await this.refreshTokensRepository.rotate(
      payload.jti,
      payload.sub,
      tokens.tokenData,
    );

    if (!rotated) {
      throw new UnauthorizedException();
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    let payload: Awaited<ReturnType<AuthCryptoProvider['verifyRefreshToken']>>;

    try {
      payload = await this.authCryptoProvider.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException();
    }

    await this.refreshTokensRepository.deleteByJti(payload.jti);
  }

  private async generateTokenPair(userId: number) {
    const accessToken = await this.authCryptoProvider.signAccessToken(userId);
    const jti = randomUUID();
    const refresh = await this.authCryptoProvider.signRefreshToken(userId, jti);
    const tokenHash = await this.authCryptoProvider.hashRefreshToken(
      refresh.token,
    );
    return {
      accessToken,
      refreshToken: refresh.token,
      tokenData: {
        user_id: userId,
        jti,
        token_hash: tokenHash,
        expires_at: refresh.expiresAt,
      },
    };
  }
}
