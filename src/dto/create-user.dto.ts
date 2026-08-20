import {IsEmail, IsString, MinLength} from 'class-validator';

export class CreateUserDto {
    @IsEmail({}, {message: 'email має бути коректною поштою'})
    email!: string;

    @IsString()
    @MinLength(2, {message: 'name має містити щонайменше 2 символи'})
    name!: string;
}
