import { IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UsersQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of users per page',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: 'test',
    description: 'Search users by login',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
