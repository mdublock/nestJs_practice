import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { UsersService } from '../users/users.service.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({
    summary: 'Get current user profile (user is taken from the access token)',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyProfile(@Req() req: { user: JwtPayload }): Promise<UserResponseDto> {
    return this.usersService.findUserById(req.user.sub);
  }
}
