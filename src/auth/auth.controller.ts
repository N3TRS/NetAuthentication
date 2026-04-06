import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto): Promise<{ token: string; email: string; role: string }> {
    return this.authService.signUp(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signIn(@Body() signInDto: SignInDto): Promise<{ token: string; email: string; role: string }> {
    return this.authService.signIn(signInDto);
  }

  
  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {
    // Esto nunca se ejecuta elGithubAuthGuard redirige a GitHub
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: any, @Res() res: any) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    try {
      const result = await this.authService.githubLogin(req.user);
      //redirige con el JWT como query param cuando se complete el login con GitHub
      if (frontendUrl) {
        return res.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
      }
      return res.json(result);
    } catch {
      if (frontendUrl) {
        return res.redirect(`${frontendUrl}/login?error=github_auth_failed`);
      }
      return res.status(500).json({ message: 'Error al autenticar con GitHub' });
    }
  }
}
