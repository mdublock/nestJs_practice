import { IsByteLength, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserFieldsDto } from '../../users/dto/user-fields.dto.js';

export class RegisterDto extends UserFieldsDto {
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
