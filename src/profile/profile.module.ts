import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
