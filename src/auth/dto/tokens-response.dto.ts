import { ApiProperty } from '@nestjs/swagger';

export class TokensResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'Access JWT. Send as "Authorization: Bearer <token>"',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'Refresh JWT for POST /auth/refresh and POST /auth/logout',
  })
  refreshToken: string;
}
