import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity("users")
export class User {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ type: String, description: 'The unique identifier of the user.' })
    id: string; 

    @Column()
    @Expose({ name: 'email' })
    @ApiProperty({ type: String, description: 'The email of the user.' })
    email: string;

    //password
    @Column()
    @Exclude()
    password: string;

    @Column()
    @Expose({ name: 'role' })
    @ApiProperty({ type: String, description: 'The role of the user.' })
    role: string;
}