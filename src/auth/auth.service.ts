import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BcryptService } from './bcrypt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly bcryptService: BcryptService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ token: string; email: string; role: string }> {
    const existingUser = await this.usersService.findByEmail(signUpDto.email);
    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    const hashedPassword = await this.bcryptService.hash(signUpDto.password);

    const user = await this.usersService.create({
      name: signUpDto.name,
      email: signUpDto.email,
      password: hashedPassword,
      role: signUpDto.role ?? 'user',
    });

    const payload = { email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      email: user.email,
      role: user.role,
    };
  }

  async signIn({ email, password }: SignInDto) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Correo No Registrado');
    }

    // Si el usuario se registro con GitHubno tiene password
    if (user.authProvider === 'github' && !user.password) {
      throw new UnauthorizedException('Esta cuenta usa GitHub para iniciar sesión. Usa el botón de GitHub.');
    }

    const isPasswordValid = await this.bcryptService.compare(password, user.password!);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña Incorrecta');
    }

    const payload = { email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      email: user.email,
      role: user.role,
    };
  }

  async githubLogin(githubUser: {
    githubId: string;
    username: string;
    displayName: string;
    email: string | null;
    avatar: string | null;
    accessToken: string; }): Promise<{ token: string; email: string; role: string }> {

    let user = await this.usersService.findByGithubId(githubUser.githubId); //Constante que se accede solo dentro de este metodo

    if (user) {
      await this.usersService.updateGithubInfo(user._id.toString(), {
        githubAccessToken: githubUser.accessToken,
        githubUsername: githubUser.username,
        avatarUrl: githubUser.avatar ?? undefined,
      });
    } else {
      const email = githubUser.email ?? `${githubUser.username}@github.user`;

      user = await this.usersService.create({
        name: githubUser.displayName || githubUser.username,
        email,
        role: 'user',
        authProvider: 'github',
        githubId: githubUser.githubId,
        githubAccessToken: githubUser.accessToken,
        githubUsername: githubUser.username,
        avatarUrl: githubUser.avatar ?? undefined,
      });
    }
    
    const payload = { email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      email: user.email,
      role: user.role,
    };
  }
}