jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mock-salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { BcryptService } from 'src/auth/bcrypt.service';

describe('BcryptService', () => {
  let service: BcryptService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [BcryptService],
    }).compile();

    service = module.get<BcryptService>(BcryptService);
  });

  describe('hash', () => {
    it('debe generar un salt y retornar el hash del password', async () => {
      const result = await service.hash('myPassword123');

      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('myPassword123', 'mock-salt');
      expect(result).toBe('hashed-password');
    });
  });

  describe('compare', () => {
    it('debe retornar true cuando el password coincide con el hash', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.compare('myPassword123', 'hashed-password');

      expect(bcrypt.compare).toHaveBeenCalledWith('myPassword123', 'hashed-password');
      expect(result).toBe(true);
    });

    it('debe retornar false cuando el password no coincide con el hash', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.compare('wrongPassword', 'hashed-password');

      expect(result).toBe(false);
    });
  });
});
