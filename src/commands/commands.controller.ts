import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CommandsService } from './commands.service';
import { Command } from './entities/command.entity';
import { CustomCommandDto } from './dtos/CustomCommandDto';

@ApiTags('commands')
@Controller('commands')
export class CommandsController {
  constructor(private readonly commandService: CommandsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all commands' })
  @ApiOkResponse({ description: 'All commands have been successfully returned.' })
  async findAllCommands() {
      return await this.commandService.findAll();
  }

  //update application
  @Put('/framework/update')
  @ApiOperation({ summary: 'Update OBAF application framework' })
  async updateFramework(): Promise<Command> {
    return await this.commandService.updateFramework();
  }

  @Get('/application/:applicationId')
  @ApiOperation({ summary: 'Get all commands for specific application' })
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  async findAllForApplication(@Param('applicationId') applicationId: string) {
    return await this.commandService.findAllForApplication(applicationId);
  }

  @Put('/application/:applicationId/start')
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  async startContainer(@Param('applicationId') applicationId: string): Promise<Command> {
    return await this.commandService.startContainer(applicationId, false);
  }

  //stop container
  @Put('/application/:applicationId/stop')
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  async stopContainer(@Param('applicationId') applicationId: string): Promise<Command> {
    return await this.commandService.stopContainer(applicationId, false);
  }

  //get container status
  @Get('/application/:applicationId/status')
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  async getContainerStatus(@Param('applicationId') applicationId: string): Promise<Command> {
    return await this.commandService.getContainerStatus(applicationId, false);
  }

  //schedule container start with timeout
  @Put('/application/:applicationId/start/:timestamp')
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  @ApiParam({ name: 'timestamp', description: 'The timestamp of the scheduled start - in seconds in the future from now' })
  async scheduleContainerStart(@Param('applicationId') applicationId: string, @Param('timestamp') timestamp: string): Promise<Command> {
    return await this.commandService.scheduleContainerStart(applicationId, timestamp, false);
  }

  //schedule container stop with timeout
  @Put('/application/:applicationId/stop/:timestamp')
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  @ApiParam({ name: 'timestamp', description: 'The timestamp of the scheduled stop - in seconds in the future from now' })
  async scheduleContainerStop(@Param('applicationId') applicationId: string, @Param('timestamp') timestamp: string): Promise<Command> {
    return await this.commandService.scheduleContainerStop(applicationId, timestamp, false);
  }

  //update application
  @Put('/application/:applicationId/update')
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  async updateApplication(@Param('applicationId') applicationId: string): Promise<Command> {
    return await this.commandService.updateApplication(applicationId, false);
  }

  //send custom command
  @Put('/application/:applicationId/send')
  @ApiParam({ name: 'applicationId', description: 'ID of the application', type: String })
  @ApiBody({ description: 'Custom command data', type: CustomCommandDto })
  async sendCommand(@Body() customCommandDto: CustomCommandDto, @Param('applicationId') applicationId: string): Promise<Command> {
    return await this.commandService.sendCommand(applicationId, customCommandDto.name, customCommandDto.request, false);
  }
}
