import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './users/users.module';
import { ApplicationModule } from './applications/applications.module';
import { BuildModule } from './builds/builds.module';
import { CommandModule } from './commands/commands.module';
import { PlaygroundModule } from './playground/playground.module';
import { HistoryModule } from './history/history.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // This makes ConfigModule globally available across your app
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], 
      useFactory: (config: ConfigService) => ({
        type: 'postgres', 
        host: config.get<string>('DB_HOST'), // Ensures string type
        port: parseInt(config.get<string>('DB_PORT', '5432')), // Default to 5432 if not set
        username: config.get<string>('DB_USER'), 
        password: config.get<string>('DB_PASS'), // Ensures string type
        database: config.get<string>('DB_NAME'), 
        autoLoadEntities: true, 
        synchronize: config.get<string>('NODE_ENV') !== 'production', // Safer check
      }),
      inject: [ConfigService],
    }),
    UserModule,
    ApplicationModule,
    BuildModule,
    CommandModule,
    PlaygroundModule,
    HistoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
