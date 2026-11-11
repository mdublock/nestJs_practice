import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import type { JwtRequest } from '../auth/interfaces/jwt-request.interface.js';

describe('UsersController', () => {
  const usersServiceMock = {
    findUserById: vi.fn(),
    updateUser: vi.fn(),
    softDeleteUser: vi.fn(),
    findUsers: vi.fn(),
  };
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return user by id', async () => {
    const user = {
      id: 1,
      login: 'test_user',
      email: 'test@example.com',
      deleted_at: null,
    };

    usersServiceMock.findUserById.mockResolvedValue(user);

    const result = await controller.findUserById(1);

    expect(result).toEqual(user);
    expect(usersServiceMock.findUserById).toHaveBeenCalledWith(1);
  });

  it('should update user', async () => {
    const userData = {
      login: 'updated_user',
      email: 'updated@example.com',
      age: 25,
      about: 'About the user',
    };

    const updatedUser = {
      id: 1,
      login: 'updated_user',
      email: 'updated@example.com',
      age: 25,
      about: 'About the user',
    };

    usersServiceMock.updateUser.mockResolvedValue(updatedUser);

    const request = { user: { sub: 1 } } as JwtRequest;
    const result = await controller.updateUser(request, userData);

    expect(result).toEqual(updatedUser);
    expect(usersServiceMock.updateUser).toHaveBeenCalledWith(1, userData);
  });

  it('should delete user', async () => {
    usersServiceMock.softDeleteUser.mockResolvedValue(undefined);

    const request = { user: { sub: 1 } } as JwtRequest;
    const result = await controller.softDeleteUser(request);

    expect(result).toBeUndefined();
    expect(usersServiceMock.softDeleteUser).toHaveBeenCalledWith(1);
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
          email: 'test@example.com',
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    };

    usersServiceMock.findUsers.mockResolvedValue(usersResult);

    const result = await controller.findUsers(query);

    expect(result).toEqual(usersResult);
    expect(usersServiceMock.findUsers).toHaveBeenCalledWith(query);
  });
});
