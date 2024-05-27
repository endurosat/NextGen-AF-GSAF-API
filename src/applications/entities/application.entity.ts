import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { PoliciesDto } from '../dtos/PoliciesDto';
import { Build } from 'src/builds/entities/build.entity';

@Entity('applications')
export class Application {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ type: String, description: 'The unique identifier of the application.' })
    id: string;

    @Column()
    @ApiProperty({ type: String, description: 'The name of the application.' })
    name: string;

    @Column({ default: 4000 })
    @ApiProperty({ type: Number, description: 'The port the application should run on.' })
    port: number;

    @Column()
    @ApiProperty({ type: String, description: 'The git repository URL of the application.' })
    gitRepositoryUrl: string;

    @ManyToOne(() => User, user => user.id)
    @ApiProperty({ type: String, description: 'The owner ID of the application.' })
    owner: User;

    @Column({ type: 'json' })
    @ApiProperty({ type: PoliciesDto, description: 'Additional application data in JSON format.' })
    policies: PoliciesDto; // Replace 'any' with a more specific type if needed

    @ManyToOne(() => Build, build => build.id)
    @ApiProperty({ type: String, description: 'The current deployed build ID of the application.' })
    deployedBuild: Build;
}
