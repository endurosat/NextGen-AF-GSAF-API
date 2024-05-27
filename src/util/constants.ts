import { readFileSync } from "fs";
import * as crypto from 'crypto';

export const APPLICATIONS_FOLDER : string     = 'devtools/applications';
export const BASE_CLIENT_IMAGE_PATH : string  = 'devtools/nextgen-base-image-client.tar';
export const BASE_GATEWAY_IMAGE_PATH : string = 'devtools/nextgen-base-image-gateway.tar';
export const GROUND_COMMANDS_JSON : string    = "config/ground-commands.json";

export const APPLICATION_GATEWAY = 'Gateway';
export const COMMUNICATION_WEB_SOCKET = 'WEB_SOCKET';
export const COMMUNICATION_GSS = 'GSS';

export const BYTES_PER_MB = 1024 * 1024;
export const MAX_BUNDLE_SIZE_CLIENT_MB = 5;
export const MAX_BUNDLE_SIZE_GATEWAY_MB = 5;

export const USER_ROLE_CLIENT = 'CLIENT';

export function getCommandName(id){
  const groundCommands = JSON.parse(readFileSync(GROUND_COMMANDS_JSON, "utf-8"));
  return groundCommands[id.toString()];
}

export function generateId() : number {
  const randomBytes = crypto.randomBytes(4);
  const unsignedNumber = randomBytes.readUInt32BE(0);
  
  // Ensure it's positive by masking with 0x7FFFFFFF (2147483647)
  const positiveNumber = unsignedNumber & 0x7FFFFFFF;

  return positiveNumber;
}

export function convertPublicKey(pemKey: string): string {
  return pemKey
    .replace(/[\n\r]/g, '') // Remove new lines and carriage returns
    .replace('-----BEGIN PUBLIC KEY-----', '') // Remove the header
    .replace('-----END PUBLIC KEY-----', '') // Remove the footer
    .trim(); // Trim any spaces that might have been left
}

export const COMMAND_GET_CONTAINER_STATUS = 0;
export const COMMAND_START_CONTAINER = 1;
export const COMMAND_STOP_CONTAINER = 2;
export const COMMAND_SEND_CUSTOM_COMMAND = 3;
export const COMMAND_SCHEDULE_CONTAINER_START = 4;
export const COMMAND_SCHEDULE_CONTAINER_STOP = 5;
export const COMMAND_UPDATE_APPLICATION = 6;
export const COMMAND_UPDATE_FRAMEWORK = 7;