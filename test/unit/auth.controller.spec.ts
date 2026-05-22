import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;

  const mockResult = { token: 'mock.jwt.token', email: 'test@example.com', role: 'user' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signUp: jest.fn(),
            signIn: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            githubLogin: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);
  });

  describe('signUp', () => {
    it('debe delegar a authService.signUp y retornar el resultado', async () => {
      authService.signUp.mockResolvedValue(mockResult);
      const dto = { name: 'Test User', email: 'test@example.com', password: 'Password1!' };

      const result = await controller.signUp(dto as any);

      expect(authService.signUp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('signIn', () => {
    it('debe delegar a authService.signIn y retornar el resultado', async () => {
      authService.signIn.mockResolvedValue(mockResult);
      const dto = { email: 'test@example.com', password: 'Password1!' };

      const result = await controller.signIn(dto as any);

      expect(authService.signIn).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('forgotPassword', () => {
    it('debe llamar a authService.forgotPassword y retornar mensaje de confirmación', async () => {
      authService.forgotPassword.mockResolvedValue(undefined);
      const dto = { email: 'test@example.com' };

      const result = await controller.forgotPassword(dto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto.email);
      expect(result).toEqual({ message: expect.any(String) });
    });
  });

  describe('resetPassword', () => {
    it('debe llamar a authService.resetPassword y retornar mensaje de confirmación', async () => {
      authService.resetPassword.mockResolvedValue(undefined);
      const dto = { token: 'reset-token-abc', newPassword: 'NewPassword1!' };

      const result = await controller.resetPassword(dto as any);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto.token, dto.newPassword);
      expect(result).toEqual({ message: expect.any(String) });
    });
  });

  describe('githubCallback', () => {
    const mockReq = { user: { githubId: 'gh-123', username: 'octocat' } };

    it('debe redirigir al frontend con el token cuando el login tiene éxito y frontendUrl está configurado', async () => {
      configService.get.mockReturnValue('http://frontend.com');
      authService.githubLogin.mockResolvedValue(mockResult);
      const res = { redirect: jest.fn() };

      await controller.githubCallback(mockReq, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'http://frontend.com/auth/callback?token=mock.jwt.token',
      );
    });

    it('debe retornar json cuando no hay frontendUrl y el login tiene éxito', async () => {
      configService.get.mockReturnValue(undefined);
      authService.githubLogin.mockResolvedValue(mockResult);
      const res = { json: jest.fn() };

      await controller.githubCallback(mockReq, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('debe redirigir a la página de error del frontend cuando el login falla y hay frontendUrl', async () => {
      configService.get.mockReturnValue('http://frontend.com');
      authService.githubLogin.mockRejectedValue(new Error('Auth failed'));
      const res = { redirect: jest.fn() };

      await controller.githubCallback(mockReq, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'http://frontend.com/login?error=github_auth_failed',
      );
    });

    it('debe retornar status 500 cuando el login falla y no hay frontendUrl', async () => {
      configService.get.mockReturnValue(undefined);
      authService.githubLogin.mockRejectedValue(new Error('Auth failed'));
      const mockJson = jest.fn();
      const res = { status: jest.fn().mockReturnValue({ json: mockJson }) };

      await controller.githubCallback(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Error al autenticar con GitHub' });
    });
  });
});
