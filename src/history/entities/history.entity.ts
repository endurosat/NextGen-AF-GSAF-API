import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Application } from 'src/applications/entities/application.entity';
import { User } from 'src/users/entities/user.entity';

export enum ExecutionActionName {
    CREATE_BUILD = "CREATE_BUILD",
    CREATE_DIFF = "CREATE_DIFF",
    EXECUTE_COMMAND = "EXECUTE_COMMAND",
}

@Entity('history')
export class History {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ type: String, description: 'The unique identifier of the execution history entry.' })
    id: string;

    @Column({
        type: 'enum',
        enum: ExecutionActionName,
    })
    @ApiProperty({ enum: ExecutionActionName, description: 'The name of the execution action.' })
    name: ExecutionActionName;

    @Column()
    @ApiProperty({ type: String, description: 'The name of the execution action.' })
    description: string;

    @ManyToOne(() => Application, application => application.id)
    @ApiProperty({ type: String, description: 'The application ID this execution action belongs to.' })
    application: Application;

    @ManyToOne(() => User, user => user.id)
    @ApiProperty({ type: String, description: 'The user ID who executed the action.' })
    user: User;

    @Column()
    @ApiProperty({ type: Date, description: 'The date of execution of the action.' })
    dateOfExecution: Date;
}