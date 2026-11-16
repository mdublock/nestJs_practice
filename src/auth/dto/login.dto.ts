import { MinLength, IsNotEmpty, IsString, IsByteLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'test_user',
    description: 'User login',
  })
  @IsString({ message: 'Login must be a string' })
  @IsNotEmpty({ message: 'Login is required' })
  login: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description:
      'User password: at least 8 characters, at most 72 bytes in UTF-8',
    minLength: 8,
    writeOnly: true,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsByteLength(0, 72, {
    message: 'Password must be at most 72 bytes in UTF-8',
  })
  password: string;
}
