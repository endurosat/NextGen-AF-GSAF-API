import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildController } from './builds.controller';
import { BuildService } from './builds.service';
import { Build } from './entities/build.entity';
import { ApplicationModule } from 'src/applications/applications.module';
import { CommandModule } from 'src/commands/commands.module';
import { HistoryModule } from 'src/history/history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Build]),
    ApplicationModule,
    CommandModule,
    HistoryModule
  ],
  controllers: [BuildController],
  providers: [BuildService],
  exports: [BuildService]
})
export class BuildModule {}
