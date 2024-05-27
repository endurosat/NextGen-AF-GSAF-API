import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Command } from "./entities/command.entity";
import { Repository } from "typeorm";
import { ApplicationService } from "src/applications/applications.service";
import { COMMAND_GET_CONTAINER_STATUS, COMMAND_SCHEDULE_CONTAINER_START, COMMAND_SCHEDULE_CONTAINER_STOP, COMMAND_SEND_CUSTOM_COMMAND, COMMAND_START_CONTAINER, COMMAND_STOP_CONTAINER, COMMAND_UPDATE_APPLICATION, COMMAND_UPDATE_FRAMEWORK, getCommandName } from "src/util/constants";
import { HistoryService } from "src/history/history.service";
import { ExecutionActionName } from "src/history/entities/history.entity";
import { CommandHandler } from "./handlers/CommandHandler";

@Injectable()
export class CommandsService {

  private readonly logger = new Logger(CommandsService.name);

  constructor(
    @InjectRepository(Command)
    private commandRepository: Repository<Command>,
    private applicationService: ApplicationService,
    private readonly historyService: HistoryService
  ) { }

  async findAll(): Promise<Command[]> {
    return await this.commandRepository.find();
  }

  async findAllForApplication(applicationId: string): Promise<Command[]> {
    return await this.commandRepository.find({
      where: {
        application: { id: applicationId }
      },
      order: {
        dateSent: "DESC"
      },
      take: 10
    });
  }

  private getCommandHandler(playground: boolean) : CommandHandler {
    //implement the logic to return the correct handler based on the communication type
    throw new Error("Communication type not supported");
  }
    

  async startContainer(applicationId: string, playground: boolean): Promise<Command> {
    this.logger.debug(`Starting container for application ${applicationId}`)
    const applicationName = await this.getApplicationName(applicationId, playground);
    const commandStatus = await this.getCommandHandler(playground).startContainer(applicationName);
    return await this.saveCommand(applicationId, COMMAND_START_CONTAINER, commandStatus.status);
  }

  async stopContainer(applicationId: string, playground: boolean): Promise<Command> {
    this.logger.debug(`Stopping container for application ${applicationId}`)
    const applicationName = await this.getApplicationName(applicationId, playground);
    const commandStatus = await this.getCommandHandler(playground).stopContainer(applicationName);
    return await this.saveCommand(applicationId, COMMAND_STOP_CONTAINER, commandStatus.status);
  }

  async getContainerStatus(applicationId: string, playground: boolean): Promise<Command> {
    this.logger.debug(`Getting container status for application ${applicationId}`)
    const applicationName = await this.getApplicationName(applicationId, playground);
    const commandStatus =  await this.getCommandHandler(playground).getContainerStatus(applicationName);
    return await this.saveCommand(applicationId, COMMAND_GET_CONTAINER_STATUS, commandStatus.status);
  }

  async scheduleContainerStart(applicationId: string, timestamp: string, playground: boolean): Promise<Command> {
    this.logger.debug(`Scheduling container start for application ${applicationId} at ${timestamp}`)
    const applicationName = await this.getApplicationName(applicationId, playground);
    const commandStatus =  await this.getCommandHandler(playground).scheduleContainerStart(applicationName, timestamp);
    return await this.saveCommand(applicationId, COMMAND_SCHEDULE_CONTAINER_START, commandStatus.status);
  }

  async scheduleContainerStop(applicationId: string, timestamp: string, playground: boolean): Promise<Command> {
    this.logger.debug(`Scheduling container stop for application ${applicationId} at ${timestamp}`)
    const applicationName = await this.getApplicationName(applicationId, playground);
    const commandStatus =  await this.getCommandHandler(playground).scheduleContainerStop(applicationName, timestamp);
    return await this.saveCommand(applicationId, COMMAND_SCHEDULE_CONTAINER_STOP, commandStatus.status);
  }

  async updateApplication(applicationId: string, playground: boolean): Promise<Command> {
    this.logger.debug(`Updating application ${applicationId}`)
    const applicationName = await this.getApplicationName(applicationId, playground);
    const commandStatus =  await this.getCommandHandler(playground).updateApplication(applicationName);
    return await this.saveCommand(applicationId, COMMAND_UPDATE_APPLICATION, commandStatus.status);
  }

  async updateFramework(): Promise<Command> {
    this.logger.debug(`Updating framework`)
    const commandStatus =  await this.getCommandHandler(false).updateFramework();
    const application = await this.applicationService.findByName(process.env.GATEWAY_UPDATER_APPLICATION_NAME || "Gateway Updater");
    return await this.saveCommand(application.id, COMMAND_UPDATE_FRAMEWORK, commandStatus.status);
  }

  async sendCommand(applicationId: string, commandName: string, request: string, playground: boolean): Promise<Command> {
    this.logger.debug(`Sending custom command ${commandName} - ${request} to application ${applicationId}`)
    const applicationName = await this.getApplicationName(applicationId, playground);
    const commandStatus =  await this.getCommandHandler(playground).sendCommand(applicationName, commandName, request);
    return await this.saveCommand(applicationId, COMMAND_SEND_CUSTOM_COMMAND, commandStatus.status);
  }

  private async getApplicationName(applicationId: string, playground: boolean) {
    const application = await this.applicationService.findById(applicationId);
    const name = playground ? `${application.name}-playground`.toLocaleLowerCase() : application.name.toLowerCase();
    return name;
  }

  private async saveCommand(applicationId: string, cmdType: number, status: string) : Promise<Command> {
    const commandName = getCommandName(cmdType);
    const commandRecord : Command = this.commandRepository.create({
      name: commandName,
      cmdType: cmdType,
      application: { id: applicationId },
      dateSent: new Date(),
      status: status,
      dateResultReceived: new Date()
    });
    await this.historyService.addHistoryRecord(
      ExecutionActionName.EXECUTE_COMMAND, 
      `Command ${commandName} sent to application ${applicationId}`, 
      applicationId);
    this.logger.debug(`Command saved with status: ${status}`)
    return this.commandRepository.save(commandRecord);
  }

}
