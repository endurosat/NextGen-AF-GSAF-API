import { Module } from '@nestjs/common';
import { CommandsService } from './commands.service';
import { Command } from './entities/command.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandsController } from './commands.controller';
import { ApplicationModule } from 'src/applications/applications.module';
import { HistoryModule } from 'src/history/history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Command]),
    ApplicationModule,
    HistoryModule
  ],
  controllers: [CommandsController],
  providers: [
    CommandsService
  ],
  exports: [CommandsService]
})
export class CommandModule {}
