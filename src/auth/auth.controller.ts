import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { TokensResponseDto } from './dto/tokens-response.dto.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

@ApiTags('Auth')
@ApiBadRequestResponse({
  description: 'Validation failed',
  type: ErrorResponseDto,
})
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'User registered, token pair issued',
    type: TokensResponseDto,
  })
  @ApiConflictResponse({
    description: 'Login or email already exists',
    type: ErrorResponseDto,
  })
  @Post('register')
  register(@Body() userData: RegisterDto): Promise<TokensResponseDto> {
    return this.authService.register(userData);
  }

  @ApiOperation({ summary: 'Login with login and password' })
  @ApiOkResponse({
    description: 'New token pair issued',
    type: TokensResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid login or password',
    type: ErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() userData: LoginDto): Promise<TokensResponseDto> {
    return this.authService.login(userData);
  }

  @ApiOperation({ summary: 'Rotate token pair using a refresh token' })
  @ApiOkResponse({
    description: 'New token pair issued, old refresh token revoked',
    type: TokensResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid, expired, revoked or already used',
    type: ErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokensResponseDto> {
    return this.authService.refresh(refreshTokenDto);
  }

  @ApiOperation({ summary: 'Logout and delete the refresh token' })
  @ApiCreatedResponse({ description: 'Refresh token deleted' })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    type: ErrorResponseDto,
  })
  @Post('logout')
  logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<void> {
    return this.authService.logout(refreshTokenDto);
  }
}
