import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/schemas/user.schema';

const mockUserDoc = {
  _id: { toString: () => 'user-id-123' },
  email: 'test@example.com',
  role: 'user',
  authProvider: 'local',
  password: 'hashedPassword',
  githubAccessToken: 'gh-token-123',
};

describe('UsersService', () => {
  let service: UsersService;
  let mockSave: jest.Mock;
  let MockModel: any;

  beforeEach(async () => {
    mockSave = jest.fn().mockResolvedValue(mockUserDoc);
    MockModel = jest.fn().mockImplementation(() => ({ save: mockSave }));
    MockModel.findOne = jest.fn();
    MockModel.findByIdAndUpdate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: MockModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    global.fetch = jest.fn();
  });

  describe('create', () => {
    it('debe crear una instancia del modelo y guardarla', async () => {
      const dto = { name: 'Test User', email: 'test@example.com', password: 'hash', role: 'user' };

      const result = await service.create(dto as any);

      expect(MockModel).toHaveBeenCalledWith(dto);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockUserDoc);
    });
  });

  describe('findByEmail', () => {
    it('debe encontrar y retornar un usuario por su email', async () => {
      MockModel.findOne.mockResolvedValue(mockUserDoc);

      const result = await service.findByEmail('test@example.com');

      expect(MockModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual(mockUserDoc);
    });

    it('debe retornar null cuando el usuario no existe', async () => {
      MockModel.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('noexiste@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByGithubId', () => {
    it('debe encontrar y retornar un usuario por su githubId', async () => {
      MockModel.findOne.mockResolvedValue(mockUserDoc);

      const result = await service.findByGithubId('gh-123');

      expect(MockModel.findOne).toHaveBeenCalledWith({ githubId: 'gh-123' });
      expect(result).toEqual(mockUserDoc);
    });
  });

  describe('updateGithubInfo', () => {
    it('debe actualizar la información de GitHub del usuario', async () => {
      MockModel.findByIdAndUpdate.mockResolvedValue(mockUserDoc);
      const data = { githubAccessToken: 'new-token', avatarUrl: 'https://new-avatar.url' };

      const result = await service.updateGithubInfo('user-id-123', data);

      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith('user-id-123', data, { new: true });
      expect(result).toEqual(mockUserDoc);
    });
  });

  describe('setPasswordResetToken', () => {
    it('debe guardar el tokenHash y la fecha de expiración del reset', async () => {
      MockModel.findByIdAndUpdate.mockResolvedValue(mockUserDoc);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await service.setPasswordResetToken('user-id-123', 'token-hash-abc', expiresAt);

      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-id-123',
        { passwordResetToken: 'token-hash-abc', passwordResetExpires: expiresAt },
        { new: true },
      );
    });
  });

  describe('findByActiveResetToken', () => {
    it('debe encontrar un usuario con token activo usando select extendido', async () => {
      const mockSelect = jest.fn().mockResolvedValue(mockUserDoc);
      MockModel.findOne.mockReturnValue({ select: mockSelect });

      const result = await service.findByActiveResetToken('token-hash-abc');

      expect(MockModel.findOne).toHaveBeenCalledWith({
        passwordResetToken: 'token-hash-abc',
        passwordResetExpires: { $gt: expect.any(Date) },
      });
      expect(mockSelect).toHaveBeenCalledWith('+passwordResetToken +passwordResetExpires');
      expect(result).toEqual(mockUserDoc);
    });
  });

  describe('updatePasswordAndClearResetToken', () => {
    it('debe actualizar el password y eliminar los campos del token de reset', async () => {
      MockModel.findByIdAndUpdate.mockResolvedValue(mockUserDoc);

      await service.updatePasswordAndClearResetToken('user-id-123', 'new-hashed-password');

      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-id-123',
        {
          password: 'new-hashed-password',
          $unset: { passwordResetToken: '', passwordResetExpires: '' },
        },
        { new: true },
      );
    });
  });

  describe('getGithubRepos', () => {
    it('debe retornar los repositorios de GitHub del usuario', async () => {
      MockModel.findOne.mockResolvedValue(mockUserDoc);
      const mockRepos = [{ name: 'repo1' }, { name: 'repo2' }];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockRepos),
      });

      const result = await service.getGithubRepos('test@example.com');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/user/repos?per_page=100',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'token gh-token-123' }),
        }),
      );
      expect(result).toEqual(mockRepos);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      MockModel.findOne.mockResolvedValue(null);

      await expect(service.getGithubRepos('noexiste@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar NotFoundException si el usuario no tiene token de GitHub', async () => {
      MockModel.findOne.mockResolvedValue({ ...mockUserDoc, githubAccessToken: null });

      await expect(service.getGithubRepos('test@example.com')).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar InternalServerErrorException si la API de GitHub responde con error', async () => {
      MockModel.findOne.mockResolvedValue(mockUserDoc);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      await expect(service.getGithubRepos('test@example.com')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
