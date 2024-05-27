import { Controller, Post, Param, Get, Put, Body } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PlaygroundService } from './playground.service';
import { CustomCommandDto } from 'src/commands/dtos/CustomCommandDto';
import { CommandsService } from 'src/commands/commands.service';
import { Command } from 'src/commands/entities/command.entity';

@ApiTags('playground')
@Controller('playground')
export class PlaygroundController {
  constructor(private readonly playgroundService: PlaygroundService,
              private readonly commandService: CommandsService) {}

  @Post('/start/:appId')
  @ApiParam({ name: 'appId', description: 'The ID of the application' })
  @ApiOperation({ summary: 'Start the playground' })
  @ApiOkResponse({ type: String, description: 'The playground has been successfully started.' })
  async start(@Param('appId') appId: string): Promise<string> {
    return await this.playgroundService.start(appId);
  }

  @Post('/stop/:appId')
  @ApiParam({ name: 'appId', description: 'The ID of the application' })
  @ApiOperation({ summary: 'Stop the playground' })
  @ApiOkResponse({ type: String, description: 'The playground has been successfully stopped.' })
  async stop(@Param('appId') appId: string): Promise<string> {
    return await this.playgroundService.stop(appId);
  }

  @Post('/deploy/:buildId')
  @ApiParam({ name: 'buildId', description: 'The ID of the build to be deployed' })
  @ApiOperation({ summary: 'Deploy a build' })
  @ApiOkResponse({ type: String, description: 'The build has been successfully deployed.' })
  async deployTar(@Param('buildId') buildId: string): Promise<string> {
    return await this.playgroundService.deployBuild(buildId);
  }

  @Get('/status/:appId')
  @ApiParam({ name: 'appId', description: 'The ID of the application' })
  @ApiOperation({ summary: 'Get the status of the playground' })
  @ApiOkResponse({ type: String, description: 'The status of the playground.' })
  async status(@Param('appId') appId: string): Promise<string> {
    return await this.playgroundService.status(appId);
  }

  @Get('/deployed/:appId')
  @ApiParam({ name: 'appId', description: 'The ID of the application' })
  @ApiOperation({ summary: 'Get the status of the application' })
  @ApiOkResponse({ type: String, description: 'The status of the application.' })
  async deployed(@Param('appId') appId: string): Promise<string> {
    return await this.playgroundService.deployed(appId);
  }
  
  @Get('/logs/:appId')
  @ApiParam({ name: 'appId', description: 'The ID of the application' })
  @ApiOperation({ summary: 'Get the status of the application' })
  @ApiOkResponse({ type: String, description: 'The logs of the application.' })
  async getLogs(@Param('appId') appId: string): Promise<string[]> {
    return await this.playgroundService.getLogs(appId);
  }



  @Get('/commands/application/:applicationId')
  @ApiOperation({ summary: 'Get all commands for specific application' })
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  async findAllForApplication(@Param('applicationId') applicationId: string) {
    return await this.commandService.findAllForApplication(applicationId);
  }

  @Put('/commands/application/:applicationId/start')
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  async startContainer(@Param('applicationId') applicationId: string): Promise<Command> {
    return await this.commandService.startContainer(applicationId, true);
  }

  //stop container
  @Put('/commands/application/:applicationId/stop')
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  async stopContainer(@Param('applicationId') applicationId: string): Promise<Command> {
    return await this.commandService.stopContainer(applicationId, true);
  }

  //get container status
  @Get('/commands/application/:applicationId/status')
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  async getContainerStatus(@Param('applicationId') applicationId: string): Promise<Command> {
    return await this.commandService.getContainerStatus(applicationId, true);
  }

  //schedule container stop with timeout
  @Put('/commands/application/:applicationId/stop/:timestamp')
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  @ApiParam({ name: 'timestamp', description: 'The timestamp of the scheduled stop' })
  async scheduleContainerStop(@Param('applicationId') applicationId: string, @Param('timestamp') timestamp: string): Promise<Command> {
    return await this.commandService.scheduleContainerStop(applicationId, timestamp, true);
  }

  //send custom command
  @Put('/commands/application/:applicationId/send')
  @ApiParam({ name: 'applicationId', description: 'ID of the application', type: String })
  @ApiBody({ description: 'Custom command data', type: CustomCommandDto })
  async sendCommand(@Body() customCommandDto: CustomCommandDto, @Param('applicationId') applicationId: string): Promise<Command> {
    return await this.commandService.sendCommand(applicationId, customCommandDto.name, customCommandDto.request, true);
  }
}
