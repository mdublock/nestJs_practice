import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UsersQueryDto } from './dto/users-query.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UsersListResponseDto } from './dto/users-list-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtRequest } from '../auth/interfaces/jwt-request.interface.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired access token',
  type: ErrorResponseDto,
})
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({
    summary: 'Get paginated list of users, optionally filtered by login',
  })
  @ApiOkResponse({ type: UsersListResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
    type: ErrorResponseDto,
  })
  @Get()
  findUsers(@Query() query: UsersQueryDto): Promise<UsersListResponseDto> {
    return this.usersService.findUsers(query);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid user ID',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @Get(':id')
  findUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.usersService.findUserById(id);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid user data',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Login or email already exists',
    type: ErrorResponseDto,
  })
  @Put('me')
  updateUser(
    @Req() req: JwtRequest,
    @Body() userData: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(req.user.sub, userData);
  }

  @ApiOperation({ summary: 'Soft delete current user' })
  @ApiOkResponse({ description: 'User soft-deleted' })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @Delete('me')
  softDeleteUser(@Req() req: JwtRequest): Promise<void> {
    return this.usersService.softDeleteUser(req.user.sub);
  }
}
