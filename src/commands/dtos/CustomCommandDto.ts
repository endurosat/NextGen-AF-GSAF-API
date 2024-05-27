import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CustomCommandDto {

  @ApiProperty({ example: 'logActivity', description: 'The name of the command' })
  @IsString()
  public name: string;

  @ApiProperty({ example: 'from=1;to=5', description: 'The request payload for the command' })
  @IsString()
  public request: string;
}