import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Application } from 'src/applications/entities/application.entity';


@Entity('commands')
export class Command {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ type: String, description: 'The unique identifier of the command.' })
    id: string;

    @Column()
    @ApiProperty({ type: String, description: 'The name of the application.' })
    name: string;

    @Column()
    @ApiProperty({ type: Number, description: 'The number identifier of the command.' })
    cmdType: number;

    @ManyToOne(() => Application, application => application.id)
    @JoinColumn({ name: 'applicationId' })
    @ApiProperty({ type: () => Application, description: 'The application this command is associated with.' })
    application: Application;

    @Column({ type: 'bigint', nullable: true })
    @ApiProperty({ type: Number, description: 'The scheduled time for the command in UNIX timestamp format.', nullable: true })
    scheduledFor: number;

    @Column({ nullable: true })
    @ApiProperty({ type: String, description: 'The request name of the command to the client app.', nullable: true })
    requestName: string;

    @Column({ nullable: true })
    @ApiProperty({ type: String, description: 'The request payload of the command to the client app.', nullable: true })
    requestPayload: string;

    @Column({ type: 'timestamp', nullable: false })
    @ApiProperty({ type: Date, description: 'The date and time when the command was sent.' })
    dateSent: Date;

    @Column({ nullable: true })
    @ApiProperty({ type: String, description: 'The status of the command - returned as a result.' })
    status: string; 

    @Column({ type: 'timestamp', nullable: false })
    @ApiProperty({ type: Date, description: 'The date and time when the result of the command was received.' })
    dateResultReceived: Date;
}
