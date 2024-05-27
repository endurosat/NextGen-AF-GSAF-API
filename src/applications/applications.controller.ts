import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApplicationService } from './applications.service';
import { Application } from './entities/application.entity';
import { ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddApplicationDto } from './dtos/AddApplicationDto';

@ApiTags('applications')
@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get('/:id')
  @ApiParam({ name: 'id', description: 'The ID of the application' })
  @ApiOperation({ summary: 'Get an application by ID' })
  @ApiOkResponse({ type: Application, description: 'The application has been successfully returned.' })
  async findApplicationById(@Param('id') id: string): Promise<Application> {
    return await this.applicationService.findById(id);
  }

  @Get('/user/:userId')
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiOperation({ summary: 'Get applications by User ID' })
  @ApiOkResponse({ type: [Application], description: 'The applications for the specified user have been successfully returned.' })
  async findApplicationsByUserId(@Param('userId') userId: string): Promise<Application[]> {
    return await this.applicationService.findByUserId(userId);
  }
  
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new application' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The application has been successfully created.', type: Application })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input.' })
  async addApplication(@Body() addApplicationDto: AddApplicationDto): Promise<Application> {
      return await this.applicationService.addApplication(addApplicationDto);
  }
}
