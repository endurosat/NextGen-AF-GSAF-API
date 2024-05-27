import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { USER_ROLE_CLIENT } from 'src/util/constants';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { id: id } });

    if(!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    return user;
  }

  async register(email: string, plainPassword: string): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const newUser = this.usersRepository.create({
        email,
        password: hashedPassword,
        role: USER_ROLE_CLIENT
    });

    return this.usersRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }
}
