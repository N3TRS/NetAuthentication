import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength, IsString, IsIn, IsOptional } from 'class-validator';

export class SignUpDto {

  @IsString()
  @MinLength(1)
  name!: string;

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
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  readonly password!: string;

  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin'], { message: 'El rol debe ser user o admin' })
  readonly role?: string;
}
