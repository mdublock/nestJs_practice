import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'test_user' })
  login: string;

  @ApiProperty({ example: 'test@example.com' })
  email: string;

  @ApiProperty({ type: Number, nullable: true, example: 25 })
  age: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'About the user' })
  about: string | null;
}
