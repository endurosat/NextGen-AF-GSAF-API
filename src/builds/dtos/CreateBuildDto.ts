import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBuildDto {
    @IsUUID()
    @ApiProperty({ type: String, description: 'The application ID this build belongs to.' })
    applicationId: string;
}
