import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { UsersQueryDto } from './dto/users-query.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }

  async createUser(userData: {
    login: string;
    email: string;
    password_hash: string;
    age?: number | null;
    about?: string | null;
  }) {
    return this.usersRepository.create(userData);
  }

  async findUserById(id: number) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      age: user.age,
      about: user.about,
    };
  }

  async softDeleteUser(id: number) {
    const user = await this.usersRepository.softDelete(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  async updateUser(id: number, userData: UpdateUserDto) {
    try {
      const updatedUser = await this.usersRepository.updateUser(id, userData);

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Login or email already exists');
      }
      throw error;
    }
  }

  async findUserByLogin(login: string) {
    return this.usersRepository.findByLogin(login);
  }

  async findUsers(query: UsersQueryDto) {
    return this.usersRepository.findAll(query);
  }
}
