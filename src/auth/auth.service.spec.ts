import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { UsersRepository } from '../users/users.repository.js';
import { AuthCryptoProvider } from './auth-crypto.provider.js';
import { RefreshTokensRepository } from './refresh-tokens.repository.js';

describe('AuthService', () => {
  const usersServiceMock = {
    createUser: vi.fn(),
  };

  const usersRepositoryMock = {
    findByLogin: vi.fn(),
    findById: vi.fn(),
  };

  const authCryptoProviderMock = {
    hashPassword: vi.fn(),
    comparePassword: vi.fn(),
    hashRefreshToken: vi.fn(),
    compareRefreshToken: vi.fn(),
    signAccessToken: vi.fn(),
    signRefreshToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  };

  const refreshTokensRepositoryMock = {
    create: vi.fn(),
    findByJti: vi.fn(),
    rotate: vi.fn(),
    deleteByJti: vi.fn(),
  };

  let service: AuthService;

  const expiresAt = new Date('2026-11-09T12:00:00.000Z');

  const mockTokenPair = (
    accessToken = 'accessToken',
    refreshToken = 'refreshToken',
  ) => {
    authCryptoProviderMock.signAccessToken.mockResolvedValue(accessToken);

    authCryptoProviderMock.signRefreshToken.mockResolvedValue({
      token: refreshToken,
      expiresAt,
    });

    authCryptoProviderMock.hashRefreshToken.mockResolvedValue(
      `hashed-${refreshToken}`,
    );
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: UsersRepository,
          useValue: usersRepositoryMock,
        },
        {
          provide: AuthCryptoProvider,
          useValue: authCryptoProviderMock,
        },
        {
          provide: RefreshTokensRepository,
          useValue: refreshTokensRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register user', async () => {
      const userData = {
        login: 'test_user',
        email: 'test@example.com',
        password: 'StrongPassword123',
      };

      const createdUser = {
        id: 1,
        login: 'test_user',
        email: 'test@example.com',
        deleted_at: null,
      };

      usersServiceMock.createUser.mockResolvedValue(createdUser);

      authCryptoProviderMock.hashPassword.mockResolvedValue('hashed-password');

      mockTokenPair();

      refreshTokensRepositoryMock.create.mockResolvedValue({ id: 1 });

      const result = await service.register(userData);

      expect(result).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });

      expect(authCryptoProviderMock.hashPassword).toHaveBeenCalledWith(
        userData.password,
      );

      expect(usersServiceMock.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          login: userData.login,
          email: userData.email,
          password_hash: 'hashed-password',
        }),
      );

      expect(usersServiceMock.createUser.mock.calls[0][0]).not.toHaveProperty(
        'password',
      );

      expect(authCryptoProviderMock.signAccessToken).toHaveBeenCalledWith(
        createdUser.id,
      );

      expect(authCryptoProviderMock.signRefreshToken).toHaveBeenCalledWith(
        createdUser.id,
        expect.any(String),
      );

      expect(authCryptoProviderMock.hashRefreshToken).toHaveBeenCalledWith(
        'refreshToken',
      );

      expect(refreshTokensRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: createdUser.id,
          jti: expect.any(String),
          token_hash: 'hashed-refreshToken',
          expires_at: expiresAt,
        }),
      );
    });

    it('should throw ConflictException if login already exists', async () => {
      usersServiceMock.createUser.mockRejectedValue({
        code: '23505',
        constraint: 'users_login_key',
      });

      await expect(
        service.register({
          login: 'test_user',
          email: 'test@example.com',
          password: 'StrongPassword123',
        }),
      ).rejects.toThrow('User with this login already exists');
    });

    it('should throw ConflictException if email already exists', async () => {
      usersServiceMock.createUser.mockRejectedValue({
        code: '23505',
        constraint: 'users_email_key',
      });

      await expect(
        service.register({
          login: 'test_user',
          email: 'test@example.com',
          password: 'StrongPassword123',
        }),
      ).rejects.toThrow('User with this email already exists');
    });

    it('should rethrow unknown errors', async () => {
      const error = new Error('Database connection error');

      usersServiceMock.createUser.mockRejectedValue(error);

      await expect(
        service.register({
          login: 'test_user',
          email: 'test@example.com',
          password: 'StrongPassword123',
        }),
      ).rejects.toThrow('Database connection error');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersRepositoryMock.findByLogin.mockResolvedValue(undefined);

      await expect(
        service.login({
          login: 'unknown_user',
          password: 'StrongPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersRepositoryMock.findByLogin).toHaveBeenCalledWith(
        'unknown_user',
      );

      expect(authCryptoProviderMock.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersRepositoryMock.findByLogin.mockResolvedValue({
        id: 1,
        login: 'test_user',
        email: 'test@example.com',
        password_hash: 'stored-password-hash',
        deleted_at: null,
      });

      authCryptoProviderMock.comparePassword.mockResolvedValue(false);

      await expect(
        service.login({
          login: 'test_user',
          password: 'WrongPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(authCryptoProviderMock.comparePassword).toHaveBeenCalledWith(
        'WrongPassword123',
        'stored-password-hash',
      );
    });

    it('should login user successfully', async () => {
      usersRepositoryMock.findByLogin.mockResolvedValue({
        id: 1,
        login: 'test_user',
        email: 'test@example.com',
        password_hash: 'stored-password-hash',
        deleted_at: null,
      });

      authCryptoProviderMock.comparePassword.mockResolvedValue(true);

      mockTokenPair();

      refreshTokensRepositoryMock.create.mockResolvedValue({ id: 1 });

      const result = await service.login({
        login: 'test_user',
        password: 'CorrectPassword123',
      });

      expect(result).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });

      expect(usersRepositoryMock.findByLogin).toHaveBeenCalledWith('test_user');

      expect(authCryptoProviderMock.comparePassword).toHaveBeenCalledWith(
        'CorrectPassword123',
        'stored-password-hash',
      );

      expect(refreshTokensRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          token_hash: 'hashed-refreshToken',
        }),
      );
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      authCryptoProviderMock.verifyRefreshToken.mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(
        service.refresh({
          refreshToken: 'invalid-token',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokensRepositoryMock.findByJti).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is not found in database', async () => {
      authCryptoProviderMock.verifyRefreshToken.mockResolvedValue({
        sub: 1,
        jti: 'some-jti',
        exp: 1800000000,
      });

      refreshTokensRepositoryMock.findByJti.mockResolvedValue(null);

      await expect(
        service.refresh({
          refreshToken: 'valid-token',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token hash is invalid', async () => {
      authCryptoProviderMock.verifyRefreshToken.mockResolvedValue({
        sub: 1,
        jti: 'some-jti',
        exp: 1800000000,
      });

      refreshTokensRepositoryMock.findByJti.mockResolvedValue({
        id: 1,
        user_id: 1,
        jti: 'some-jti',
        token_hash: 'stored-token-hash',
      });

      authCryptoProviderMock.compareRefreshToken.mockResolvedValue(false);

      await expect(
        service.refresh({
          refreshToken: 'valid-token',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(authCryptoProviderMock.compareRefreshToken).toHaveBeenCalledWith(
        'valid-token',
        'stored-token-hash',
      );

      expect(usersRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it('should refresh tokens successfully and rotate refresh token', async () => {
      authCryptoProviderMock.verifyRefreshToken.mockResolvedValue({
        sub: 1,
        jti: 'old-jti',
        exp: 1800000000,
      });

      refreshTokensRepositoryMock.findByJti.mockResolvedValue({
        id: 1,
        user_id: 1,
        jti: 'old-jti',
        token_hash: 'old-token-hash',
      });

      authCryptoProviderMock.compareRefreshToken.mockResolvedValue(true);

      usersRepositoryMock.findById.mockResolvedValue({
        id: 1,
        login: 'test_user',
        email: 'test@example.com',
        deleted_at: null,
      });

      mockTokenPair('new-access-token', 'new-refresh-token');

      refreshTokensRepositoryMock.rotate.mockResolvedValue(true);

      const result = await service.refresh({
        refreshToken: 'old-refresh-token',
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      expect(authCryptoProviderMock.compareRefreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
        'old-token-hash',
      );

      expect(refreshTokensRepositoryMock.rotate).toHaveBeenCalledWith(
        'old-jti',
        1,
        expect.objectContaining({
          user_id: 1,
          jti: expect.any(String),
          token_hash: 'hashed-new-refresh-token',
          expires_at: expiresAt,
        }),
      );
    });

    it('should reject replay of an already rotated refresh token', async () => {
      authCryptoProviderMock.verifyRefreshToken.mockResolvedValue({
        sub: 1,
        jti: 'old-jti',
        exp: 1800000000,
      });

      refreshTokensRepositoryMock.findByJti.mockResolvedValue({
        id: 1,
        user_id: 1,
        jti: 'old-jti',
        token_hash: 'old-token-hash',
      });

      authCryptoProviderMock.compareRefreshToken.mockResolvedValue(true);

      usersRepositoryMock.findById.mockResolvedValue({
        id: 1,
        login: 'test_user',
        email: 'test@example.com',
        deleted_at: null,
      });

      mockTokenPair('new-access-token', 'new-refresh-token');

      refreshTokensRepositoryMock.rotate.mockResolvedValue(false);

      await expect(
        service.refresh({
          refreshToken: 'old-refresh-token',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokensRepositoryMock.rotate).toHaveBeenCalledWith(
        'old-jti',
        1,
        expect.objectContaining({
          user_id: 1,
        }),
      );
    });

    it('should reject refresh token if user is deleted', async () => {
      authCryptoProviderMock.verifyRefreshToken.mockResolvedValue({
        sub: 1,
        jti: 'old-jti',
        exp: 1800000000,
      });

      refreshTokensRepositoryMock.findByJti.mockResolvedValue({
        id: 1,
        user_id: 1,
        jti: 'old-jti',
        token_hash: 'old-token-hash',
      });

      authCryptoProviderMock.compareRefreshToken.mockResolvedValue(true);

      usersRepositoryMock.findById.mockResolvedValue(undefined);

      await expect(
        service.refresh({
          refreshToken: 'old-refresh-token',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokensRepositoryMock.rotate).not.toHaveBeenCalled();
    });

    it('should reject refresh token if user_id does not match JWT sub', async () => {
      authCryptoProviderMock.verifyRefreshToken.mockResolvedValue({
        sub: 1,
        jti: 'old-jti',
        exp: 1800000000,
      });

      refreshTokensRepositoryMock.findByJti.mockResolvedValue({
        id: 1,
        user_id: 2,
        jti: 'old-jti',
        token_hash: 'old-token-hash',
      });

      await expect(
        service.refresh({
          refreshToken: 'old-refresh-token',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(authCryptoProviderMock.compareRefreshToken).not.toHaveBeenCalled();

      expect(usersRepositoryMock.findById).not.toHaveBeenCalled();

      expect(refreshTokensRepositoryMock.rotate).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout the user successfully', async () => {
      authCryptoProviderMock.verifyRefreshToken.mockResolvedValue({
        sub: 1,
        jti: 'valid-jti',
        exp: 1800000000,
      });

      refreshTokensRepositoryMock.deleteByJti.mockResolvedValue(undefined);

      const result = await service.logout({
        refreshToken: 'valid-refresh-token',
      });

      expect(result).toBeUndefined();

      expect(authCryptoProviderMock.verifyRefreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );

      expect(refreshTokensRepositoryMock.deleteByJti).toHaveBeenCalledWith(
        'valid-jti',
      );
    });

    it('should reject logout with invalid refresh token', async () => {
      authCryptoProviderMock.verifyRefreshToken.mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(
        service.logout({
          refreshToken: 'invalid-refresh-token',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokensRepositoryMock.deleteByJti).not.toHaveBeenCalled();
    });
  });
});
