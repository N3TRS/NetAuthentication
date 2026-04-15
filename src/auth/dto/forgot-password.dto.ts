import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ForgotPasswordDto {

  @IsEmail()
  @MaxLength(255)
  @IsNotEmpty()
  readonly email!: string;
}
