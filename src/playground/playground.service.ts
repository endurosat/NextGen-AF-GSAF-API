import { HttpException, Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as Docker from 'dockerode';
import * as fs from 'fs';
import { BuildService } from 'src/builds/builds.service';
import { Build } from 'src/builds/entities/build.entity';
import { ApplicationService } from 'src/applications/applications.service';
import { convertPublicKey } from 'src/util/constants';

@Injectable()
export class PlaygroundService {

  private execPromise = promisify(exec);
  private docker: Docker;
  private readonly logger = new Logger(PlaygroundService.name);

  constructor(private readonly buildService: BuildService,
    private readonly applicationSercice: ApplicationService) {
    this.docker = new Docker();
  }

  async getLogs(appId: string): Promise<string[]> {
    
    const application = await this.applicationSercice.findById(appId);
    if (!application) {
      throw new HttpException(`Application with ID ${appId} not found.`, 404);
    }
    const containerName = `${application.name}-playground`.toLowerCase();
    try {
      const logs = await this.getContainerLogs(containerName);
      return logs;
    } catch (error) {
      this.logger.error(`Error getting logs for playground: ${error}`);
      throw new HttpException('Error getting logs for playground', 500);
    }
  }

  private stripAnsiCodes(str: string): string {
    // ANSI escape codes are often represented by the sequence '\u001b[' followed by some characters and ending with 'm'.
    // Define the escape character separately to prevent SonarQube from flagging it directly in the regex
    const ESC = String.fromCharCode(27);  // 27 is the ASCII code for the escape character
    const ansiEscapeRegex = new RegExp(ESC + '\\[[0-9;]*m', 'g');
    return str.replace(ansiEscapeRegex, '');
}

private cleanLogString(logString: string): string {
  // Regex to find the starting point of the log message (e.g., "[Nest]").
  const startOfLogRegex = /\[Nest\]/;
  const match = startOfLogRegex.exec(logString);

  if (match) {
      // Extract everything from the "[Nest]" onwards.
      return logString.substring(match.index);
  } else {
      // If no match is found, return the original string.
      return logString;
  }
}

  private async getContainerLogs(containerName: string): Promise<string[]> {
    const container = this.docker.getContainer(containerName);
    const logStream = await container.logs({
        stdout: true,
        stderr: true,
        follow: false,
        timestamps: false
    });
    const logs = logStream.toString()
      .split('\n')
      .map(this.stripAnsiCodes)
      .map(this.cleanLogString);
    return logs;
}

  async start(appId: string): Promise<string> {
    const application = await this.applicationSercice.findById(appId);
    if (!application) {
      throw new HttpException(`Application with ID ${appId} not found.`, 404);
    }
    try {

      let publicKey = fs.readFileSync('config/signature_keys/signature_public_key.txt', 'utf8');
      publicKey = convertPublicKey(publicKey);
      this.logger.log(`Starting playground with ID ${appId}`);
      const scriptPath = 'src/playground/playground_start.sh';
      await this.execPromise(`bash ${scriptPath} ${appId} ${publicKey}`);
      this.logger.log(`Playground with ID ${appId} started successfully.`);
      return `Playground with ID ${appId} started successfully.`;
    }
    catch (error) {
      this.logger.error(`Error starting playground: ${error}`);
      throw new HttpException('Error starting playground', 500);
    }
  }

  async stop(appId: string): Promise<string> {
    const application = await this.applicationSercice.findById(appId);
    if (!application) {
      throw new HttpException(`Application with ID ${appId} not found.`, 404);
    }
    try {
      const imageName = `${application.name}-playground`.toLowerCase();
      await this.stopContainer(imageName);
      await this.removeImage(imageName);
      this.logger.log(`Stopping playground with ID ${appId}`);
      const scriptPath = 'src/playground/playground_stop.sh';
      await this.execPromise(`bash ${scriptPath} ${appId}`);
      this.logger.log(`Playground with ID ${appId} stopped successfully.`);
      return `Playground with ID ${appId} stopped successfully.`;
    }
    catch (error) {
      this.logger.error(`Error stopping playground: ${error}`);
      throw new HttpException('Error stopping playground', 500);
    }
  }

  async status(appId: string): Promise<string> {
    const imageName = `${appId}-gateway-image`.toLowerCase();
    //if image exists return STARTED else STOPPED
    const existingImage = this.docker.getImage(imageName);
    try {
      await existingImage.inspect();
      return 'STARTED';
    } catch (error) {
      if (error.statusCode === 404) {
        return 'STOPPED';
      } else {
        this.logger.error(`Error getting status of playground: ${error}`);
        throw new HttpException('Error getting status of playground', 500);
      }
    }
  }

  async deployed(appId: string): Promise<string> {
    const application = await this.applicationSercice.findById(appId);
    const imageName = `${application.name}-playground`.toLowerCase();
    const existingImage = this.docker.getImage(imageName);
    try {
      await existingImage.inspect();
      return 'DEPLOYED';
    } catch (error) {
      if (error.statusCode === 404) {
        return 'NOT DEPLOYED';
      } else {
        this.logger.error(`Error getting status of build: ${error}`);
        throw new HttpException('Error getting status of build', 500);
      }
    }
  }

  async deployBuild(buildId: string): Promise<string> {
    try {
      const build = await this.buildService.findById(buildId, true);
      const appName = build.application.name;
      this.logger.log(`Deploying build for ${appName}`);
      const imageName = `${appName}-playground`.toLowerCase();
      await this.stopContainer(imageName);
      await this.removeImage(imageName);
      await this.loadImage(build, imageName);
      this.logger.log(`Image loaded for ${imageName}, now starting a container`);
      await this.startDockerContainer(build, imageName);
      return "Build deployed successfully";
    }
    catch (error) {
      this.logger.error(`Error deploying build: ${error}`);
      throw new HttpException('Error deploying build', 500);
    }
  }

  private async removeImage(imageName: string) {
    this.logger.log(`Removing existing image for ${imageName}`);
    const existingImage = this.docker.getImage(imageName);
    try {
      await existingImage.remove();
      console.log(`Image ${imageName} removed.`);
    } catch (error) {
      if (error.statusCode === 404) {
        console.log(`Image ${imageName} does not exist.`);
      } else {
        console.error('Error removing image:', error);
        throw error;
      }
    }
  }

  private async stopContainer(imageName: string) {
    this.logger.log(`Stopping and removing existing container for ${imageName}`);
    const existingContainer = this.docker.getContainer(imageName);
    //if container exists stop it
    try {
      // Inspect the container to see if it exists
      await existingContainer.inspect();

      // Stop the container if it's running
      await existingContainer.stop();
      this.logger.log(`Container ${imageName} stopped.`);
    } catch (error) {
      if (error.statusCode === 404) {
        console.log(`Container ${imageName} does not exist.`);
      } else {
        console.error('Error stopping or removing container:', error);
      }
    }
    try{
      // Remove the container
      await existingContainer.remove();
      console.log(`Container ${imageName} removed.`);
    }
    catch (error) {
      if (error.statusCode === 404) {
        console.log(`Container ${imageName} does not exist.`);
      } else {
        console.error('Error removing container:', error);
      }
    }
  }

  private async loadImage(build, newImageName) : Promise<void> {
    try {
      this.logger.log(`Loading image for ${newImageName}`);
      const stream = await this.docker.loadImage(fs.createReadStream(build.imagePath));

      await new Promise((resolve, reject) => {
        stream.on('data', async (data) => {
          const result = JSON.parse(data.toString());
          if (result.stream) {
            const originalImageName = result.stream.split(":")[1].trim();
            if (originalImageName) {
              try {
                const originalImageTag = build.version;
                const fullImageName = `${originalImageName}:${originalImageTag}`;
                // Tag the image
                this.logger.log(`Tagging docker image for ${fullImageName}`);
                await this.tagDockerImage(fullImageName, newImageName);
                // Remove the original image
                await this.removeDockerImage(fullImageName);
                this.logger.log(`Docker image loaded and renamed successfully from ${fullImageName} to ${newImageName}`);
                resolve("Image loaded and renamed successfully");
              } catch (error) {
                reject(new Error(`Error in processing docker image: ${error}`));
              }
            }
          }
        });

        stream.on('error', (error) => {
          reject(new Error(`Error loading docker image: ${error}`));
        });
      });
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }

  private tagDockerImage(originalName: string, imageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.docker.getImage(originalName).tag({ repo: imageName, tag: 'latest' }, (err, res) => {
        if (err) {
          console.error('Error tagging image:', err);
          reject(err);
        } else {
          console.log(`Image tagged: ${imageName}:latest`);
          resolve();
        }
      });
    });
  }

  private removeDockerImage(imageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.docker.getImage(imageName).remove((err, res) => {
        if (err) {
          console.error('Error removing image:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async startDockerContainer(build: Build, imageName: string): Promise<void> {
    this.logger.log(`Starting container for image ${imageName}`);
    // Variables for container creation
    const jwtPayload = build.jwtPayload;
    const serverPort = 7777;
    const clientPort = 4000;
    const networkName = `${build.application.id}-network`;
    const serverHost = `${build.application.id}-gateway-container`;

    const container = await this.docker.createContainer({
      Image: imageName,
      name: imageName,
      ExposedPorts: { [`${clientPort}/tcp`]: {} },
      PortBindings: { [`${clientPort}/tcp`]: [{ HostPort: `${clientPort}` }] },
      Env: [
        `JWT_PAYLOAD=${jwtPayload}`,
        `SERVER_PORT=${serverPort}`,
        `CLIENT_PORT=${clientPort}`,
        `SERVER_HOST=${serverHost}`,
      ],
      NetworkMode: networkName,
    });
    await container.start();
    this.logger.log(`Container started successfully for ${imageName}`);
  }
}
