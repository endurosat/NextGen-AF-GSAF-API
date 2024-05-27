import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationController } from './applications.controller';
import { ApplicationService } from './applications.service';
import { Application } from './entities/application.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Application])],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService, TypeOrmModule]
})
export class ApplicationModule {}
