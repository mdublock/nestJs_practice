import {
  IsEmail,
  MinLength,
  IsNotEmpty,
  IsString,
  IsOptional,
  Max,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'test_user',
    description: 'Unique user login',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'Login must be a string' })
  @IsNotEmpty({ message: 'Login is required' })
  @MinLength(3)
  @MaxLength(255)
  login: string;

  @ApiProperty({
    example: 'test@example.com',
    description: 'User email address',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: 'User password',
    minLength: 8,
    maxLength: 72,
    writeOnly: true,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password must be at most 72 characters long' })
  password: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'User age',
    minimum: 1,
    maximum: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({
    example: 'About the user',
    description: 'User about information',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  about?: string;
}
