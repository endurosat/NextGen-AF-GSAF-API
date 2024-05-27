import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Build } from './entities/build.entity';
import { ApplicationService } from 'src/applications/applications.service';
import { Application } from 'src/applications/entities/application.entity';
import { promisify } from "util";
import { exec } from 'child_process';
import { APPLICATIONS_FOLDER, APPLICATION_GATEWAY, BASE_CLIENT_IMAGE_PATH, BASE_GATEWAY_IMAGE_PATH, BYTES_PER_MB, MAX_BUNDLE_SIZE_CLIENT_MB, MAX_BUNDLE_SIZE_GATEWAY_MB } from 'src/util/constants';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { stat } from 'fs/promises';
import { HistoryService } from 'src/history/history.service';
import { ExecutionActionName } from 'src/history/entities/history.entity';

@Injectable()
export class BuildService {

  private execPromise = promisify(exec);
  private readonly logger = new Logger(BuildService.name);
  
  constructor(
    @InjectRepository(Build)
    private buildRepository: Repository<Build>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    private readonly applicationService: ApplicationService,
    private readonly historyService: HistoryService
  ) {}

  async findById(id: string, withApplication: boolean): Promise<Build | undefined> {
    
    const build = withApplication ? 
      await this.buildRepository.findOne({ where: { id: id }, relations: ['application'] }) :
      await this.buildRepository.findOne({ where: { id: id } });

    if (!build) {
      throw new NotFoundException(`Build with ID ${id} not found.`);
    }

    return build;
  }

  async findByApplicationId(applicationId: string): Promise<Build[]> {
    const builds = await this.buildRepository.find({ 
      where: { application: { id: applicationId } },
      order: { version: 'DESC' }
    });
    return builds;
  }

  async getBaseImagePath() {
    if (!fs.existsSync(BASE_CLIENT_IMAGE_PATH)) {
      throw new NotFoundException('Image file not found.');
    }
    return BASE_CLIENT_IMAGE_PATH;
  }

  async createBuild(applicationId: string): Promise<Build> {
    this.logger.debug(`Creating build for application ${applicationId}`)
    const latestBuild = await this.buildRepository.findOne({
      where: { application: { id: applicationId } },
      order: { version: 'DESC' },
    });

    const newVersion = latestBuild ? latestBuild.version + 1 : 1;

    this.logger.debug(`Creating build for application ${applicationId} with version ${newVersion}`)
    // Fetch the application details
    const application: Application = await this.applicationService.findById(applicationId);
    await this.historyService.addHistoryRecord(
      ExecutionActionName.CREATE_BUILD, 
      `Created build for application ${application.name} with version ${newVersion}`, 
      applicationId);
    if(application.name !== APPLICATION_GATEWAY){
      return this.createClientApplicationBuild(application, newVersion);
    }
    else{
      return this.createFrameworkBuild(application, newVersion);
    }
    
  }

  private async createClientApplicationBuild(application: Application, newVersion: number): Promise<Build> {

    // Pull the application code and build the image
    const appPath: string = await this.pullApp(application);

    if(application.name !== APPLICATION_GATEWAY){
      //check if appPath contains Dockerfile file
      if(!fs.existsSync(`${appPath}/Dockerfile`)){
        throw new BadRequestException(`Dockerfile not found for application ${application.name} in ${appPath}`);
      }
      await this.updateDockerfile(`${appPath}/Dockerfile`);
    }

    if (!appPath) {
      throw new BadRequestException(`Application code not found for application ${application.name}`);
    }

    const tarPath = await this.createImageTar(application.name, appPath, newVersion);

    //read the private key from a txt file in the same folder
    const privateKey = fs.readFileSync('config/signature_keys/signature_private_key.txt', 'utf8');

    const jwtPayload = jwt.sign(application.policies, privateKey, {
      algorithm: 'RS256',
      noTimestamp: true
    });

    const build = this.buildRepository.create({
      application: { id: application.id } ,
      version: newVersion,
      dateCreated: new Date(),
      imagePath: tarPath,
      jwtPayload: jwtPayload,
    });

    this.logger.debug(`Build created for application ${application.name} with version ${newVersion}`)
    return this.buildRepository.save(build);
  }

  private async createFrameworkBuild(application: Application, newVersion: number): Promise<Build> {

    // Pull the application code and build the image
    const appPath: string = await this.pullApp(application);

    if (!appPath) {
      throw new BadRequestException(`Application code not found for application ${application.name}`);
    }

    const tarPath = await this.createImageTar(application.name, appPath, newVersion);

    const build = this.buildRepository.create({
      application: { id: application.id } ,
      version: newVersion,
      dateCreated: new Date(),
      imagePath: tarPath,
      jwtPayload: "",
    });

    this.logger.debug(`Build created for application ${application.name} with version ${newVersion}`)
    return this.buildRepository.save(build);
  }

  private async updateDockerfile(filePath: string): Promise<void> {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        let lines = data.split(/\r?\n/);
        lines = lines.map(line => line.startsWith('FROM') ? 'FROM nextgen-base-image' : line);
        const updatedContent = lines.join('\n');
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log('Dockerfile updated successfully.');
    } catch (error) {
        console.error('Error updating Dockerfile:', error);
    }
  }

  async prepareForDeploy(buildId: string): Promise<Build> {
    try{
      const build = await this.buildRepository.findOne({ where: { id: buildId }, relations: ['application']});

      if (!build) {
          throw new Error('Build not found');
      }

      // Deploy the build
      console.log(`Preparing build with ID: ${build.id} and version ${build.version}...`);

      const application = await this.applicationService.findById(build.application.id);
      await this.historyService.addHistoryRecord(
        ExecutionActionName.CREATE_DIFF, 
        `Preparing build with ID: ${build.id} for application ${application.name} and version ${build.version} for deployment`, 
        application.id);
      if(application.name !== APPLICATION_GATEWAY){
        return this.prepareForDeployClientApplication(application, build);
      }
      else{
        return this.prepareForDeployFramework(application, build);
      }
    }
    catch(error){
      this.logger.error(`Error preparing build for deployment: ${error}`);
      return null;
    }
  }

  private async prepareForDeployFramework(application: Application, build: Build): Promise<Build> {

    const updatedPath = build.imagePath;
    
    let sourcePath = application.deployedBuild ? application.deployedBuild.imagePath : BASE_GATEWAY_IMAGE_PATH;

    if(sourcePath === BASE_GATEWAY_IMAGE_PATH){
        console.log('Initial deployment...');
    }
    else{
        console.log(`Redeployment from version ${application.deployedBuild.version} to version ${build.version}...`);
    }

    const execAsync = promisify(exec);
    const baseDir = `${APPLICATIONS_FOLDER}/${application.name}`;

    const deltaDiffFile         = `${application.name}-${build.version}.diff`;
    const deltaDiffPreparedFile = `${application.name.toLocaleLowerCase()}.diff`;
    const bundleFile            = `${application.name.toLocaleLowerCase()}-bundle.tar.xz`;

    const deltaDiffPath         = `${baseDir}/${deltaDiffFile}`;
    const deltaDiffPreparedPath = `${baseDir}/${deltaDiffPreparedFile}`;

    const signaturePath         = `${baseDir}/signature-file`;
    const bundlePath            = `${baseDir}/${bundleFile}`;

    this.logger.debug("Source - " + sourcePath);
    this.logger.debug("Updated - " + updatedPath);
    this.logger.debug("Signature - " + signaturePath);
    this.logger.debug("Delta - " + deltaDiffPath);
    //if signature file exists, remove it
    if (fs.existsSync(signaturePath)) {
        await execAsync(`rm ${signaturePath}`);
    }
    if(fs.existsSync(deltaDiffPath)) {
        await execAsync(`rm ${deltaDiffPath}`);
    }
    await execAsync(`rdiff signature ${sourcePath} ${signaturePath}`);
    await execAsync(`rdiff delta ${signaturePath} ${updatedPath} ${deltaDiffPath}`);
    await execAsync(`rm ${signaturePath}`);

    build.deploymentDate = new Date();
    build.diffPath = deltaDiffPath;
    build.deploymentStatus = "Success";

    await execAsync(`cp ${deltaDiffPath} ${deltaDiffPreparedPath}`);

    await execAsync(`tar -cf - -C ${baseDir} ${deltaDiffPreparedFile} | xz --best -c > ${bundlePath}`);

    const stats = await stat(bundlePath);
    build.bundleSize = Number((stats.size / BYTES_PER_MB).toFixed(2));
    if(build.bundleSize < MAX_BUNDLE_SIZE_GATEWAY_MB){
      this.logger.debug(`Build prepared for deployment with version ${build.version} and bundle size ${build.bundleSize} MB`);
      //copy the diff and the config to /diffs folder so that the OBAF api can pick them for clientUpdate
      if(process.env.SERVER_ENV === 'production'){
        await execAsync(`scp ${bundlePath} nextgen:/home/es/nextgen/diffs/${bundleFile}`);
      }
      else{
        await execAsync(`cp ${bundlePath} /home/es/nextgen/diffs/${bundleFile}`);
      }
      application.deployedBuild = build;
      await this.applicationRepository.save(application);
    }
    else{
      this.logger.error(`Bundle size exceeds the maximum allowed size of ${MAX_BUNDLE_SIZE_GATEWAY_MB} MB`);
    }

    await this.buildRepository.save(build);
    return build;
  }

  private async prepareForDeployClientApplication(application: Application, build: Build): Promise<Build> {

    const updatedPath = build.imagePath;

    let sourcePath = application.deployedBuild ? application.deployedBuild.imagePath : BASE_CLIENT_IMAGE_PATH;

    if(sourcePath === BASE_CLIENT_IMAGE_PATH){
        console.log('Initial deployment...');
    }
    else{
        console.log(`Redeployment from version ${application.deployedBuild.version} to version ${build.version}...`);
    }

    const execAsync = promisify(exec);
    const baseDir = `${APPLICATIONS_FOLDER}/${application.name}`;

    const deltaDiffFile         = `${application.name}-${build.version}.diff`;
    const deltaDiffPreparedFile = `${application.name.toLocaleLowerCase()}.diff`;
    const bundleFile            = `${application.name.toLocaleLowerCase()}-bundle.tar.xz`;
    const configFile            = `config.json`;

    const deltaDiffPath         = `${baseDir}/${deltaDiffFile}`;
    const deltaDiffPreparedPath = `${baseDir}/${deltaDiffPreparedFile}`;

    const signaturePath         = `${baseDir}/signature-file`;
    const configPath            = `${baseDir}/${configFile}`;
    const bundlePath            = `${baseDir}/${bundleFile}`;

    this.logger.debug("Source - " + sourcePath);
    this.logger.debug("Updated - " + updatedPath);
    this.logger.debug("Signature - " + signaturePath);
    this.logger.debug("Delta - " + deltaDiffPath);
    //if signature file exists, remove it
    if (fs.existsSync(signaturePath)) {
        await execAsync(`rm ${signaturePath}`);
    }
    if(fs.existsSync(deltaDiffPath)) {
        await execAsync(`rm ${deltaDiffPath}`);
    }
    await execAsync(`rdiff signature ${sourcePath} ${signaturePath}`);
    await execAsync(`rdiff delta ${signaturePath} ${updatedPath} ${deltaDiffPath}`);
    await execAsync(`rm ${signaturePath}`);

    build.deploymentDate = new Date();
    build.diffPath = deltaDiffPath;
    build.deploymentStatus = "Success";

    const config = {
      port: application.port,
      jwtPayload: build.jwtPayload,
      version: build.version
    };

    //save the config to a file
    fs.writeFileSync(configPath, JSON.stringify(config));

    await execAsync(`cp ${deltaDiffPath} ${deltaDiffPreparedPath}`);

    await execAsync(`tar -cf - -C ${baseDir} ${deltaDiffPreparedFile} ${configFile} | xz --best -c > ${bundlePath}`);

    const stats = await stat(bundlePath);
    build.bundleSize = Number((stats.size / BYTES_PER_MB).toFixed(2));
    if(build.bundleSize < MAX_BUNDLE_SIZE_CLIENT_MB){
      this.logger.debug(`Build prepared for deployment with version ${build.version} and bundle size ${build.bundleSize} MB`);
      //copy the diff and the config to /diffs folder so that the OBAF api can pick them for clientUpdate
      if(process.env.SERVER_ENV === 'production'){
        await execAsync(`scp ${bundlePath} nextgen:/home/es/nextgen/diffs/${bundleFile}`);
      }
      else{
        await execAsync(`cp ${bundlePath} /home/es/nextgen/diffs/${bundleFile}`);
      }
      application.deployedBuild = build;
      await this.applicationRepository.save(application);
    }
    else{
      this.logger.error(`Bundle size exceeds the maximum allowed size of ${MAX_BUNDLE_SIZE_CLIENT_MB} MB`);
    }

    await this.buildRepository.save(build);
    return build;
  }

  private async createImageTar(appName: string, appPath: string, version: number): Promise<string> {
    this.logger.debug(`Building and exporting image for application ${appName} with version ${version}`)
    try {
      const scriptPath = 'src/builds/imageBuilder.sh';
      const tarPath = `${APPLICATIONS_FOLDER}/${appName}/${appName}-${version}.tar`;
      const { stdout, stderr } = await this.execPromise(`bash ${scriptPath} ${appName.toLowerCase()} ${appPath} ${tarPath} ${version}`);

      if (stderr) {
        this.logger.debug(`Error: ${stderr}`);
      }
      else{
        this.logger.log(`Output: ${stdout}`);
      }
      return tarPath;
    } catch (error) {
      console.error(`Execution error: ${error.message}`);
    }
  }

  async pullApp(app: Application): Promise<string> {
    try{
      //when you ssh into the mac server, the ssh-agent is not running, so we need to start it and add the key
      if(process.env.SERVER_ENV === 'production'){
        const appPath = `${APPLICATIONS_FOLDER}/${app.name}/repo`;
        const execAsync = promisify(exec);
        await execAsync('cd ~/.ssh && eval $(ssh-agent -s) && ssh-add gitlab_key');
        if (fs.existsSync(appPath)) {
            this.logger.debug(`Updating repository in ${appPath}`);
            await execAsync(`git -C ${appPath} checkout .`);
            await execAsync(`git -C ${appPath} pull --recurse-submodules`);
            this.logger.debug(`Repository updated at ${appPath}`);
        } else {
            fs.mkdirSync(appPath, { recursive: true });
            this.logger.debug(`Cloning repository ${app.gitRepositoryUrl} to ${appPath}`);
            await execAsync(`git clone --recurse-submodules ${app.gitRepositoryUrl} ${appPath}`);
            this.logger.debug(`Repository cloned to ${appPath}`);
        }
        return appPath;
      }
      else{
        return '/home/es/nextgen/nextgen-obaf-client';
      }
    }
    catch(error){
      this.logger.error(`Error pulling application code: ${error}`);
      return null;
    }
  }
}
