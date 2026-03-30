import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';


@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User> ){}

  async create(createUserDto: CreateUserDto) {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }

  async findByGithubId(githubId: string) {
    return await this.userModel.findOne({ githubId });
  }

  async updateGithubInfo(userId: string, data: { githubAccessToken?: string; githubUsername?: string; avatarUrl?: string }) {
    return await this.userModel.findByIdAndUpdate(userId, data, { new: true });
  }

  async getGithubRepos(email: string) {
    const user = await this.findByEmail(email);
    if (!user || !user.githubAccessToken) {
      throw new NotFoundException('Usuario No Encontrado o Token de GitHub No Disponible');
    }

    const response = await fetch('https://api.github.com/user/repos?per_page=100', {
      headers: {
        Authorization: `token ${user.githubAccessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });
    return response.json();
  }
}
