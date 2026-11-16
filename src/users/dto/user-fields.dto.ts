import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UserFieldsDto {
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
    description: 'User email address, stored trimmed and in lower case',
    maxLength: 255,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(255)
  email: string;

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
