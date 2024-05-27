import { Module } from '@nestjs/common';
import { PlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';
import { BuildModule } from 'src/builds/builds.module';
import { ApplicationModule } from 'src/applications/applications.module';
import { CommandModule } from 'src/commands/commands.module';

@Module({
  imports: [
    BuildModule,
    ApplicationModule,
    CommandModule
  ],
  controllers: [PlaygroundController],
  providers: [PlaygroundService],
  exports: [PlaygroundService]
})
export class PlaygroundModule {}
