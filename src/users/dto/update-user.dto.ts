import {
  IsEmail,
  IsString,
  MinLength,
  ValidateIf,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { AtLeastOneField } from '../validators/at-least-one-field.validator.js';
import { ApiPropertyOptional } from '@nestjs/swagger';

@AtLeastOneField(['login', 'email', 'age', 'about'], {
  message: 'At least one field(login, email, age or about) must be provided',
})
export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'updated_user',
    description: 'New unique user login',
    minLength: 3,
    maxLength: 255,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  login?: string;

  @ApiPropertyOptional({
    example: 'updated@example.com',
    description: 'New user email address',
    maxLength: 255,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'New user age',
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
    description: 'New user about information',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  about?: string;
}
