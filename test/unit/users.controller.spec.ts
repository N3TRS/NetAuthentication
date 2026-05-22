import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: { getGithubRepos: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  describe('getGithubRepos', () => {
    it('debe llamar a usersService.getGithubRepos con el email del usuario autenticado', async () => {
      const mockRepos = [{ name: 'repo1', full_name: 'octocat/repo1' }];
      usersService.getGithubRepos.mockResolvedValue(mockRepos);
      const req = { user: { email: 'test@example.com' } };

      const result = await controller.getGithubRepos(req);

      expect(usersService.getGithubRepos).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockRepos);
    });
  });
});
