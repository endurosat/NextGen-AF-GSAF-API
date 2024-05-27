import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExecutionActionName, History } from './entities/history.entity';
import { FilterHistoryDto } from './dtos/FilterHistoryDto';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private historyRepository: Repository<History>,
  ) { }

  async filter(filterHistoryDto: FilterHistoryDto): Promise<HistoryResultDto[]> {
    try {
      const { applicationId, userId, fromDate, toDate } = filterHistoryDto;

      const queryBuilder = this.historyRepository.createQueryBuilder('history')
        .leftJoinAndSelect('history.application', 'application')
        .leftJoinAndSelect('history.user', 'user')
        .select([
          'history.id AS id',
          'history.name AS name',
          'history.description AS description',
          'application.id AS applicationId',
          'application.name AS applicationName',
          'user.id AS userId',
          'user.email AS userName',
          'history.dateOfExecution AS dateOfExecution'
        ]);

      if (applicationId) {
        queryBuilder.andWhere('history.applicationId = :applicationId', { applicationId });
      }

      if (userId) {
        queryBuilder.andWhere('history.userId = :userId', { userId });
      }

      if (fromDate) {
        queryBuilder.andWhere('history.dateOfExecution >= :fromDate', { fromDate: fromDate.toISOString() });
      }

      if (toDate) {
        queryBuilder.andWhere('history.dateOfExecution <= :toDate', { toDate: toDate.toISOString() });
      }

      const results = await queryBuilder.getRawMany();

      return results.map(result => {
        //result properties are all in lowercase ... postgres stuff ..
        const dto = {
          id: result.id,
          name: result.name,
          description: result.description,
          applicationId: result.applicationid,
          applicationName: result.applicationname,
          userId: result.userid,
          userName: result.username,
          dateOfExecution: result.dateofexecution,
        } as HistoryResultDto;
        return dto
      });
    }
    catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async addHistoryRecord(name: ExecutionActionName, description: string, applicationId: string): Promise<History> {
    const newHistoryRecord = this.historyRepository.create({
      name,
      description,
      application: { id: applicationId },
      user: { id: "be6d5754-2e00-442d-8e36-f5793a9ce25b" },//get logged user id
      dateOfExecution: new Date(),
    });

    return await this.historyRepository.save(newHistoryRecord);
  }
}