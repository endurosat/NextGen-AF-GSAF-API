
//interface for the command handler to start / stop / get status / schedule stop / update application
export interface CommandHandler {
    startContainer(applicationId: string): Promise<any>;
    stopContainer(applicationId: string): Promise<any>;
    getContainerStatus(applicationId: string): Promise<any>;
    scheduleContainerStart(applicationId: string, timestamp: string): Promise<any>;
    scheduleContainerStop(applicationId: string, timestamp: string): Promise<any>;
    updateApplication(applicationId: string): Promise<any>;
    sendCommand(applicationId: string, name: string, request: string): Promise<any>;
    updateFramework(): Promise<any>;
}