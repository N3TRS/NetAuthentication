import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { BcryptService } from 'src/auth/bcrypt.service';
import { MailService } from 'src/mail/mail.service';

const mockUser = {
  _id: { toString: () => 'user-id-123' },
  email: 'test@example.com',
  role: 'user',
  authProvider: 'local',
  password: 'hashedPassword',
  avatarUrl: undefined,
};

const mockGithubUser = {
  _id: { toString: () => 'github-user-id-456' },
  email: 'github@example.com',
  role: 'user',
  authProvider: 'github',
  avatarUrl: 'https://avatar.url',
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let bcryptService: jest.Mocked<BcryptService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            setPasswordResetToken: jest.fn(),
            findByActiveResetToken: jest.fn(),
            updatePasswordAndClearResetToken: jest.fn(),
            findByGithubId: jest.fn(),
            updateGithubInfo: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
          },
        },
        {
          provide: BcryptService,
          useValue: {
            hash: jest.fn().mockResolvedValue('hashedPassword'),
            compare: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordReset: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    bcryptService = module.get(BcryptService);
    mailService = module.get(MailService);
  });

  // ─────────────────────────────────────────────
  // signUp
  // ─────────────────────────────────────────────
  describe('signUp', () => {
    const dto = { name: 'Test User', email: 'test@example.com', password: 'Password1!' };

    it('debe registrar un usuario y retornar token cuando el email no existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as any);

      const result = await service.signUp(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(bcryptService.hash).toHaveBeenCalledWith(dto.password);
      expect(usersService.create).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
        password: 'hashedPassword',
        role: 'user',
      });
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(result).toEqual({ token: 'mock.jwt.token', email: mockUser.email, role: mockUser.role });
    });

    it('debe lanzar BadRequestException si el email ya está registrado', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.signUp(dto)).rejects.toThrow(BadRequestException);
      await expect(service.signUp(dto)).rejects.toThrow('El email ya está registrado');
    });

    it('debe usar el rol proporcionado en el DTO cuando se especifica', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ ...mockUser, role: 'admin' } as any);

      await service.signUp({ ...dto, role: 'admin' });

      expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
    });
  });

  // ─────────────────────────────────────────────
  // signIn
  // ─────────────────────────────────────────────
  describe('signIn', () => {
    const dto = { email: 'test@example.com', password: 'Password1!' };

    it('debe retornar token cuando las credenciales son válidas', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      bcryptService.compare.mockResolvedValue(true);

      const result = await service.signIn(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(bcryptService.compare).toHaveBeenCalledWith(dto.password, mockUser.password);
      expect(result).toEqual({ token: 'mock.jwt.token', email: mockUser.email, role: mockUser.role });
    });

    it('debe lanzar UnauthorizedException cuando el usuario no existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.signIn(dto)).rejects.toThrow('Correo No Registrado');
    });

    it('debe lanzar UnauthorizedException cuando el usuario usa GitHub y no tiene contraseña', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        authProvider: 'github',
        password: undefined,
      } as any);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.signIn(dto)).rejects.toThrow('Esta cuenta usa GitHub para iniciar sesión');
    });

    it('debe lanzar UnauthorizedException cuando la contraseña es incorrecta', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      bcryptService.compare.mockResolvedValue(false);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.signIn(dto)).rejects.toThrow('Contraseña Incorrecta');
    });
  });

  // ─────────────────────────────────────────────
  // forgotPassword
  // ─────────────────────────────────────────────
  describe('forgotPassword', () => {
    it('no debe hacer nada si el usuario no existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await service.forgotPassword('noexiste@example.com');

      expect(usersService.setPasswordResetToken).not.toHaveBeenCalled();
      expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('no debe hacer nada si el usuario es de proveedor GitHub', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, authProvider: 'github' } as any);

      await service.forgotPassword(mockUser.email);

      expect(usersService.setPasswordResetToken).not.toHaveBeenCalled();
      expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('debe guardar el token y enviar el correo para usuario local', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.setPasswordResetToken.mockResolvedValue(mockUser as any);

      await service.forgotPassword(mockUser.email);

      expect(usersService.setPasswordResetToken).toHaveBeenCalledWith(
        'user-id-123',
        expect.any(String),
        expect.any(Date),
      );
      expect(mailService.sendPasswordReset).toHaveBeenCalledWith(mockUser.email, expect.any(String));
    });

    it('debe registrar el error pero NO lanzarlo si el envío de correo falla', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.setPasswordResetToken.mockResolvedValue(mockUser as any);
      mailService.sendPasswordReset.mockRejectedValue(new Error('SMTP error'));

      await expect(service.forgotPassword(mockUser.email)).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // resetPassword
  // ─────────────────────────────────────────────
  describe('resetPassword', () => {
    it('debe lanzar BadRequestException si el token es inválido o expirado', async () => {
      usersService.findByActiveResetToken.mockResolvedValue(null);

      await expect(service.resetPassword('token-invalido', 'NuevaPassword1!')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword('token-invalido', 'NuevaPassword1!')).rejects.toThrow(
        'Token inválido o expirado',
      );
    });

    it('debe actualizar la contraseña cuando el token es válido', async () => {
      usersService.findByActiveResetToken.mockResolvedValue(mockUser as any);
      usersService.updatePasswordAndClearResetToken.mockResolvedValue(mockUser as any);

      await service.resetPassword('token-valido', 'NuevaPassword1!');

      expect(bcryptService.hash).toHaveBeenCalledWith('NuevaPassword1!');
      expect(usersService.updatePasswordAndClearResetToken).toHaveBeenCalledWith(
        'user-id-123',
        'hashedPassword',
      );
    });
  });

  // ─────────────────────────────────────────────
  // githubLogin
  // ─────────────────────────────────────────────
  describe('githubLogin', () => {
    const githubPayload = {
      githubId: 'gh-123',
      username: 'octocat',
      displayName: 'The Octocat',
      email: 'octocat@github.com',
      avatar: 'https://avatar.url',
      accessToken: 'gh-access-token',
    };

    it('debe actualizar info de GitHub y retornar token si el usuario ya existe', async () => {
      usersService.findByGithubId.mockResolvedValue(mockGithubUser as any);
      usersService.updateGithubInfo.mockResolvedValue(mockGithubUser as any);

      const result = await service.githubLogin(githubPayload);

      expect(usersService.findByGithubId).toHaveBeenCalledWith(githubPayload.githubId);
      expect(usersService.updateGithubInfo).toHaveBeenCalledWith(
        'github-user-id-456',
        expect.objectContaining({ githubAccessToken: githubPayload.accessToken }),
      );
      expect(result.token).toBe('mock.jwt.token');
    });

    it('debe crear un nuevo usuario cuando no existe en la base de datos', async () => {
      usersService.findByGithubId.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockGithubUser as any);

      const result = await service.githubLogin(githubPayload);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          authProvider: 'github',
          githubId: githubPayload.githubId,
          email: githubPayload.email,
        }),
      );
      expect(result.token).toBe('mock.jwt.token');
    });

    it('debe usar email generado cuando GitHub no provee email', async () => {
      usersService.findByGithubId.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        ...mockGithubUser,
        email: 'octocat@github.user',
      } as any);

      await service.githubLogin({ ...githubPayload, email: null });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'octocat@github.user' }),
      );
    });
  });
});
