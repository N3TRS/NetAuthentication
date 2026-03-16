export class CreateUserDto {
  name!: string;
  email!: string;
  password?: string;
  role!: string;
  authProvider?: string;
  githubId?: string;
  githubAccessToken?: string;
  githubUsername?: string;
  avatarUrl?: string;
}