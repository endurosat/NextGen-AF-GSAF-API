import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { AddApplicationDto } from './dtos/AddApplicationDto';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
  ) {}

  async findById(id: string): Promise<Application | undefined> {
    const application = await this.applicationRepository.findOne({ where: { id: id }, relations: ['deployedBuild']});

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found.`);
    }

    return application;
  }

  async findByName(name: string): Promise<Application | undefined> {
    const application = await this.applicationRepository.findOne({ where: { name: name } });

    if (!application) {
      throw new NotFoundException(`Application with name ${name} not found.`);
    }

    return application;
  }

  async findByUserId(userId: string): Promise<Application[]> {
    const applications = await this.applicationRepository.find({
      where: { owner : {id : userId } },
      //relations: ['owner'], // If you want to include user data in the response
    });

    return applications;
  }

  async addApplication(addApplicationDto: AddApplicationDto): Promise<Application> {
    const newApplication = this.applicationRepository.create({
      name: addApplicationDto.name,
      owner: { id: addApplicationDto.ownerId },
      gitRepositoryUrl: addApplicationDto.repositoryUrl,
      policies: addApplicationDto.policies,
    });

    return this.applicationRepository.save(newApplication);
  }
}
