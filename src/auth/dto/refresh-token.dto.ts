import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGci0iJIUzI1N34Is...',
    description: 'Refresh token',
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
