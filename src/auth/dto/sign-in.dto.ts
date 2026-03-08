import {IsEmail, IsNotEmpty, Matches, MaxLength, MinLength,} from 'class-validator';

export class SignInDto {
  
  @IsEmail()
  @MaxLength(255)
  @IsNotEmpty()
  readonly email!: string;

  @MinLength(8, {
    message: 'Contraseña muy corta',
  })
  @MaxLength(20, {
    message: 'Contraseña muy larga',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Contraseña muy débil',
  })
  @IsNotEmpty()
  readonly password!: string;
}