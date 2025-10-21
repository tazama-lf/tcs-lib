import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    {
      provide: 'PG_OPTIONS',
      inject: [ConfigService],
      useFactory: async (config) => {
        console.log('Database config:', {
          host: config.get('CONFIGURATION_DATABASE_URL'),
          database: config.get('CONFIGURATION_DATABASE'),
          user: config.get('CONFIGURATION_DATABASE_USER'),
          password: config.get('CONFIGURATION_DATABASE_PASSWORD'),
        });
        return {
          host: config.get('CONFIGURATION_DATABASE_URL'),
          database: config.get('CONFIGURATION_DATABASE'),
          user: config.get('CONFIGURATION_DATABASE_USER'),
          password: config.get('CONFIGURATION_DATABASE_PASSWORD'),
        };
      },
    },
    {
      provide: 'PG_POOL',
      inject: ['PG_OPTIONS'],
      useFactory: async (options) => {
        return new Pool(options);
      },
    },
    DatabaseService,
  ],
  exports: ['PG_POOL', DatabaseService],
})
export class DatabaseModule {}
