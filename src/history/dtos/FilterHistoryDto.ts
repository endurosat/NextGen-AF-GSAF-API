import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class FilterHistoryDto {
    @ApiProperty({ type: String, description: 'The application ID', required: false })
    @IsUUID()
    @IsOptional()
    applicationId?: string;

    @ApiProperty({ type: String, description: 'The user ID', required: false })
    @IsUUID()
    @IsOptional()
    userId?: string;

    @ApiProperty({ type: String, description: 'The starting date of the period', required: false })
    @IsDateString()
    @IsOptional()
    fromDate?: Date;

    @ApiProperty({ type: String, description: 'The ending date of the period', required: false })
    @IsDateString()
    @IsOptional()
    toDate?: Date;
}