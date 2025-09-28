import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email address',
    example: 'luffy@onepiece.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'StrongPassword123!',
  })
  @IsString()
  @MinLength(1)
  password: string;
}
