import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BcryptService } from './bcrypt.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {

  private readonly logger = new Logger(AuthService.name);
  private static readonly RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly bcryptService: BcryptService,
    private readonly mailService: MailService,
  ) {}

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.authProvider !== 'local') {
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + AuthService.RESET_TOKEN_TTL_MS);

    await this.usersService.setPasswordResetToken(user._id.toString(), tokenHash, expiresAt);

    try {
      await this.mailService.sendPasswordReset(user.email, rawToken);
    } catch (err) {
      this.logger.error(`No se pudo enviar correo de reset a ${user.email}`, err as Error);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByActiveResetToken(tokenHash);

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashedPassword = await this.bcryptService.hash(newPassword);
    await this.usersService.updatePasswordAndClearResetToken(user._id.toString(), hashedPassword);
  }

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

    const payload = { email: user.email, role: user.role, avatarUrl: user.avatarUrl };
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

    const payload = { email: user.email, role: user.role, avatarUrl: user.avatarUrl };
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
    
    const payload = { email: user.email, role: user.role, avatarUrl: user.avatarUrl };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      email: user.email,
      role: user.role,
    };
  }
}