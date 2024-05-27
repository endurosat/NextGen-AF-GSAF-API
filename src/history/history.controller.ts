import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { ExecutionActionName, History } from './entities/history.entity';
import { FilterHistoryDto } from './dtos/FilterHistoryDto';

@ApiTags('history')
@Controller('history')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}

    @Post('/filter')
    @ApiOperation({ summary: 'Filter execution history records' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Successfully filtered execution history records.' })
    @ApiOkResponse({ type: [History], description: 'Execution history records matching criteria.' })
    async filterHistory(@Body() filterHistoryDto: FilterHistoryDto): Promise<HistoryResultDto[]> {
        return await this.historyService.filter(filterHistoryDto);
    }

    @Get('/actions')
    @ApiOperation({ summary: 'Get all ExecutionActionName values' })
    @ApiOkResponse({ type: [String], description: 'All ExecutionActionName values have been successfully returned.' })
    getAllActionNames(): string[] {
        return Object.values(ExecutionActionName);
    }
}