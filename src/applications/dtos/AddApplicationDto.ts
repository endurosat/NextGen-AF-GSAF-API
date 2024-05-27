import { IsJSON, IsString, IsUUID, ValidateNested } from "class-validator";
import { PoliciesDto } from "./PoliciesDto";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class AddApplicationDto {
    @ApiProperty({ description: 'Owner UUID' })
    @IsUUID()
    ownerId: string;

    @ApiProperty({ description: 'Application name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Application policies', type: PoliciesDto })
    @IsJSON()
    @ValidateNested()
    @Type(() => PoliciesDto)
    policies: PoliciesDto;

    @ApiProperty({ description: 'Repository URL' })
    @IsString()
    repositoryUrl: string;
}