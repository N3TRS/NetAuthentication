import { Controller, Get,  Req, Param, UseGuards} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('github/repos')
  @UseGuards(JwtAuthGuard)
  getGithubRepos(@Req() req: any) {
    return this.usersService.getGithubRepos(req.user.email);
  }

}
