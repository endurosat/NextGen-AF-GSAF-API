import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Application } from 'src/applications/entities/application.entity';

@Entity('builds')
export class Build {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ type: String, description: 'The unique identifier of the build.' })
    id: string;

    @Column()
    @ApiProperty({ type: Number, description: 'The version of the build.' })
    version: number;

    @ManyToOne(() => Application, application => application.id)
    @ApiProperty({ type: String, description: 'The application ID this build belongs to.' })
    application: Application;

    @Column()
    @ApiProperty({ type: Date, description: 'The creation date of the build.' })
    dateCreated: Date;

    @Column({ nullable: true })
    @ApiProperty({ type: String, description: 'The tar file URL of the build.' })
    imagePath: string;

    @Column({ nullable: true })
    @ApiProperty({ type: Date, description: 'The date of the build deployment.', required: false })
    deploymentDate: Date | null;

    @Column({ nullable: true })
    @ApiProperty({ type: String, description: 'The diff file path of the build deployment.', required: false })
    diffPath: string | null;

    @Column({  type: 'float', nullable: true })
    @ApiProperty({ type: Number, description: 'The bundle size in MB of the build deployment.', required: false })
    bundleSize: number | null;
    
    @Column({ nullable: true })
    @ApiProperty({ type: String, description: 'The deployment status of the build.', required: false })
    deploymentStatus: string | null;

    @Column({ nullable: true })
    @ApiProperty({ type: String, description: 'The JWT payload of the build.', required: false })
    jwtPayload: string | null;
}
