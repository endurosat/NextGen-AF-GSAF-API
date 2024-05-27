import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
    @ApiProperty({ description: 'User email' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'User password' })
    @IsString()
    @MinLength(8)
    password: string;
}
