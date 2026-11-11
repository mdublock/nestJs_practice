import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { UsersRepository } from '../users/users.repository.js';
import { AuthCryptoProvider } from './auth-crypto.provider.js';
import { randomUUID } from 'crypto';
import { RefreshTokensRepository } from './refresh-tokens.repository.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

function isDatabaseError(error: unknown): error is {
  constraint?: string;
  code: string;
} {
  return typeof error === 'object' && error !== null && 'code' in error;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private usersRepository: UsersRepository,
    private authCryptoProvider: AuthCryptoProvider,
    private refreshTokensRepository: RefreshTokensRepository,
  ) {}

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

  async register(userData: {
    login: string;
    email: string;
    password: string;
    age?: number;
    about?: string;
  }) {
    try {
      const user = await this.usersService.createUser({
        login: userData.login,
        email: userData.email,
        password_hash: await this.authCryptoProvider.hashPassword(
          userData.password,
        ),
        age: userData.age,
        about: userData.about,
      });

      const tokens = await this.generateTokenPair(user.id);
      await this.refreshTokensRepository.create(tokens.tokenData);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (isDatabaseError(error) && error.code === '23505') {
        if (error.constraint === 'users_login_key') {
          throw new ConflictException('User with this login already exists');
        }

        if (error.constraint === 'users_email_key') {
          throw new ConflictException('User with this email already exists');
        }
      }
      throw error;
    }
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
}
