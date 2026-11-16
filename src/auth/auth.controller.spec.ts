import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  const authServiceMock = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  };

  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a new user', async () => {
    const userData = {
      login: 'test_user',
      email: 'test@example.com',
      password: 'Strongpassword123',
    };

    authServiceMock.register.mockResolvedValue({
      accessToken: 'eyJhbGciOiJIUzI1NiIs...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
    });

    const result = await controller.register(userData);

    expect(result).toEqual({
      accessToken: 'eyJhbGciOiJIUzI1NiIs...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
    });

    expect(authServiceMock.register).toHaveBeenCalledWith(userData);
  });

  it('should login user', async () => {
    const userData = {
      login: 'test_user',
      password: 'Strongpassword123',
    };

    authServiceMock.login.mockResolvedValue({
      accessToken: 'eyJhbGci390djIOje9IJm...',
      refreshToken: 'eyJhbGci390djIOje9IJm...',
    });

    const result = await controller.login(userData);

    expect(result).toEqual({
      accessToken: 'eyJhbGci390djIOje9IJm...',
      refreshToken: 'eyJhbGci390djIOje9IJm...',
    });

    expect(authServiceMock.login).toHaveBeenCalledWith(userData);
  });

  it('should refresh tokens', async () => {
    const refreshTokenDto = {
      refreshToken: 'eyJhbGci0iJIUzI1N34Is...',
    };

    authServiceMock.refresh.mockResolvedValue({
      accessToken: 'eyJhbGci0iJIUzI1N34Is...',
      refreshToken: 'eyJhbGci0iJIUzI1N34Is...',
    });

    const result = await controller.refresh(refreshTokenDto);

    expect(result).toEqual({
      accessToken: 'eyJhbGci0iJIUzI1N34Is...',
      refreshToken: 'eyJhbGci0iJIUzI1N34Is...',
    });

    expect(authServiceMock.refresh).toHaveBeenCalledWith(refreshTokenDto);
  });

  it('should logout user', async () => {
    const refreshTokenDto = {
      refreshToken: 'eyJhbGci0iJIUzI1N34Is...',
    };

    authServiceMock.logout.mockResolvedValue(undefined);

    const result = await controller.logout(refreshTokenDto);

    expect(result).toBeUndefined();

    expect(authServiceMock.logout).toHaveBeenCalledWith(refreshTokenDto);
  });
});
