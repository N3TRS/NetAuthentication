jest.mock('passport-github2', () => ({
  Strategy: class MockGithubStrategy {
    constructor(_options: any) {}
    authenticate(_req: any, _options?: any) {}
  },
}));

jest.mock('@nestjs/passport', () => ({
  PassportStrategy: (Strategy: any, _name?: string) =>
    class extends Strategy {
      constructor(...args: any[]) {
        super(...args);
      }
    },
  AuthGuard: jest.fn(() => class MockAuthGuard {}),
}));

import { ConfigService } from '@nestjs/config';
import { GithubStrategy } from 'src/auth/strategies/github.strategy';

describe('GithubStrategy', () => {
  let strategy: GithubStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          GITHUB_CLIENT_ID: 'test-client-id',
          GITHUB_CLIENT_SECRET: 'test-client-secret',
          GITHUB_CALLBACK_URL: 'http://localhost:3000/auth/github/callback',
        };
        return config[key];
      }),
    } as unknown as ConfigService;

    strategy = new GithubStrategy(configService);
  });

  describe('validate', () => {
    const profile = {
      id: 'gh-123',
      username: 'octocat',
      displayName: 'The Octocat',
      emails: [{ value: 'octocat@github.com' }],
      photos: [{ value: 'https://avatars.github.com/octocat' }],
    };

    it('debe retornar el objeto de usuario mapeado desde el perfil de GitHub', async () => {
      const result = await strategy.validate('access-token-abc', 'refresh-token', profile);

      expect(result).toEqual({
        githubId: 'gh-123',
        username: 'octocat',
        displayName: 'The Octocat',
        email: 'octocat@github.com',
        avatar: 'https://avatars.github.com/octocat',
        accessToken: 'access-token-abc',
      });
    });

    it('debe retornar null para email cuando el perfil no tiene emails', async () => {
      const profileSinEmail = { ...profile, emails: undefined };

      const result = await strategy.validate('access-token', 'refresh-token', profileSinEmail);

      expect(result.email).toBeNull();
    });

    it('debe retornar null para avatar cuando el perfil no tiene fotos', async () => {
      const profileSinFoto = { ...profile, photos: undefined };

      const result = await strategy.validate('access-token', 'refresh-token', profileSinFoto);

      expect(result.avatar).toBeNull();
    });
  });
});
