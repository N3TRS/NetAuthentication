import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-jwt-secret') },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get(JwtService);
  });

  const buildContext = (headers: Record<string, string>) => ({
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  });

  it('debe lanzar UnauthorizedException cuando no hay cabecera de autorización', async () => {
    const context = buildContext({});

    await expect(guard.canActivate(context as any)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context as any)).rejects.toThrow('Token no proporcionado');
  });

  it('debe lanzar UnauthorizedException cuando la cabecera no comienza con Bearer', async () => {
    const context = buildContext({ authorization: 'Basic dXNlcjpwYXNz' });

    await expect(guard.canActivate(context as any)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context as any)).rejects.toThrow('Token no proporcionado');
  });

  it('debe retornar true y asignar el payload al request cuando el token es válido', async () => {
    const payload = { email: 'test@example.com', role: 'user' };
    jwtService.verifyAsync.mockResolvedValue(payload);
    const request: any = { headers: { authorization: 'Bearer valid.jwt.token' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    const result = await guard.canActivate(context as any);

    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.jwt.token', {
      secret: 'test-jwt-secret',
    });
  });

  it('debe lanzar UnauthorizedException cuando el token es inválido o expirado', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const context = buildContext({ authorization: 'Bearer invalid.token.here' });

    await expect(guard.canActivate(context as any)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context as any)).rejects.toThrow('Token inválido o expirado');
  });
});
