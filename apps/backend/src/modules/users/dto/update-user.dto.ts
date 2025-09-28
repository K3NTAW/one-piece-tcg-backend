import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Username',
    example: 'luffy123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  username?: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
