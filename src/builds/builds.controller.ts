import { Controller, Get, HttpCode, Param, Post, Put, Res } from '@nestjs/common';
import { BuildService } from './builds.service';
import { Build } from './entities/build.entity';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import * as path from 'path';
import { Response } from 'express';

@ApiTags('builds')
@Controller('builds')
export class BuildController {
  constructor(private readonly buildService: BuildService) {}


  @Get('base-image')
  @ApiOperation({ summary: 'Download the base image for all builds' })
  async downloadBaseImage(@Res() res: Response) {
    const imagePath = await this.buildService.getBaseImagePath();
    res.sendFile(path.resolve(imagePath));
  }

  @Get('/:id')
  @ApiParam({ name: 'id', description: 'The ID of the build' })
  @ApiOperation({ summary: 'Get a build by ID' })
  @ApiOkResponse({ type: Build, description: 'The build has been successfully returned.' })
  async findBuildById(@Param('id') id: string): Promise<Build> {
    return await this.buildService.findById(id, false);
  }

  @Get('/application/:applicationId')
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  @ApiOperation({ summary: 'Get all builds for a specific application' })
  @ApiOkResponse({ type: [Build], description: 'All builds for the specified application have been successfully returned.' })
  async findAllBuildsForApplication(@Param('applicationId') applicationId: string): Promise<Build[]> {
    return await this.buildService.findByApplicationId(applicationId);
  }

  @Post('/application/:applicationId')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new build' })
  @ApiParam({ name: 'applicationId', description: 'The ID of the application' })
  @ApiOkResponse({ type: Build, description: 'The build has been successfully created.' })
  async createBuild(@Param('applicationId') applicationId: string): Promise<Build> {
    return await this.buildService.createBuild(applicationId);
  }

  @Put(':buildId/prepare-for-deploy')
  @ApiParam({ name: 'buildId', description: 'The ID of the build' })
  @ApiOperation({ summary: 'Prepare a build for deployment' })
  @ApiOkResponse({ type: Build, description: 'The build has been successfully prepared for deployment.' })
  async prepareForDeploy(@Param('buildId') buildId: string): Promise<Build> {
      return await this.buildService.prepareForDeploy(buildId);
  }
}
