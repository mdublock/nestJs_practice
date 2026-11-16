import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';

describe('UsersService', () => {
  const userRepositoryMock = {
    findById: vi.fn(),
    softDelete: vi.fn(),
    updateUser: vi.fn(),
    findAll: vi.fn(),
  };

  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user without password_hash', async () => {
    userRepositoryMock.findById.mockResolvedValue({
      id: 1,
      login: 'test_user',
      email: 'test@example.com',
      password_hash: 'Hashed_password',
      deleted_at: null,
    });

    const result = await service.findUserById(1);

    expect(result).toEqual({
      id: 1,
      login: 'test_user',
      email: 'test@example.com',
    });

    expect(result).not.toHaveProperty('password_hash');

    expect(userRepositoryMock.findById).toHaveBeenCalledWith(1);
  });

  it('should throw NotFoundException if user is not found', async () => {
    userRepositoryMock.findById.mockResolvedValue(undefined);

    await expect(service.findUserById(1)).rejects.toThrowError(
      'User not found',
    );
  });

  it('should throw NotFoundException if user not found when deleting', async () => {
    userRepositoryMock.softDelete.mockResolvedValue(undefined);

    await expect(service.softDeleteUser(1)).rejects.toThrow('User not found');

    expect(userRepositoryMock.softDelete).toHaveBeenCalledWith(1);
  });

  it('should soft delete user successfully', async () => {
    userRepositoryMock.softDelete.mockResolvedValue({
      id: 1,
    });

    await service.softDeleteUser(1);

    expect(userRepositoryMock.softDelete).toHaveBeenCalledWith(1);
  });

  it('should update user successfully', async () => {
    const userData = {
      login: 'updated_user',
      email: 'updated@example.com',
      age: 25,
      about: 'About the user',
    };

    userRepositoryMock.updateUser.mockResolvedValue({
      id: 1,
      login: 'updated_user',
      email: 'updated@example.com',
      age: 25,
      about: 'About the user',
    });

    const result = await service.updateUser(1, userData);

    expect(result).toEqual({
      id: 1,
      login: 'updated_user',
      email: 'updated@example.com',
      age: 25,
      about: 'About the user',
    });

    expect(userRepositoryMock.updateUser).toHaveBeenCalledWith(1, userData);
  });

  it('should throw NotFoundException if user not found when updating', async () => {
    userRepositoryMock.updateUser.mockResolvedValue(undefined);

    await expect(
      service.updateUser(1, {
        login: 'updated_user',
        email: 'updated@example.com',
      }),
    ).rejects.toThrow('User not found');

    expect(userRepositoryMock.updateUser).toHaveBeenCalledWith(1, {
      login: 'updated_user',
      email: 'updated@example.com',
    });
  });

  it('should return users list', async () => {
    const query = {
      page: 1,
      limit: 10,
      search: 'test',
    };

    const usersResult = {
      items: [
        {
          id: 1,
          login: 'test_user',
          email: 'test@example',
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    };

    userRepositoryMock.findAll.mockResolvedValue(usersResult);

    const result = await service.findUsers(query);

    expect(result).toEqual(usersResult);

    expect(userRepositoryMock.findAll).toHaveBeenCalledWith(query);
  });
});
