import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { UsersQueryDto } from './dto/users-query.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

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
    const updatedUser = await this.usersRepository.updateUser(id, userData);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async findUserByLogin(login: string) {
    return this.usersRepository.findByLogin(login);
  }

  async findUsers(query: UsersQueryDto) {
    return this.usersRepository.findAll(query);
  }
}
