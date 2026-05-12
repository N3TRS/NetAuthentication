import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  readonly token!: string;

  @MinLength(8, { message: 'Contraseña muy corta' })
  @MaxLength(20, { message: 'Contraseña muy larga' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Contraseña muy débil',
  })
  @IsNotEmpty()
  readonly newPassword!: string;
}
