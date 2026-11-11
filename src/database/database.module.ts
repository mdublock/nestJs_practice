import {
  Inject,
  Injectable,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import databaseConfig from '../config/database.config.js';
import { Database } from './database.types.js';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  constructor(
    @Inject('DATABASE')
    private readonly db: Kysely<Database>,
  ) {}

  async onApplicationShutdown() {
    await this.db.destroy();
    console.log('Database connection closed');
  }
}

@Module({
  providers: [
    DatabaseService,
    {
      provide: 'DATABASE_CONNECTION',
      inject: [databaseConfig.KEY],
      useFactory: async (config: ConfigType<typeof databaseConfig>) => {
        const logger = new Logger('Database');

        const pool = new Pool({
          host: config.host,
          port: config.port,
          database: config.name,
          user: config.user,
          password: config.password,
          statement_timeout: config.statementTimeoutMs,
        });

        pool.on('error', (error) => {
          logger.error(`Idle PostgreSQL client error: ${error.message}`);
        });

        await pool.query('SELECT 1');
        console.log('Database connection established');
        return pool;
      },
    },
    {
      provide: 'DATABASE',
      inject: ['DATABASE_CONNECTION'],
      useFactory: (pool: Pool) =>
        new Kysely<Database>({
          dialect: new PostgresDialect({ pool }),
        }),
    },
  ],
  exports: ['DATABASE_CONNECTION', 'DATABASE'],
})
export class DatabaseModule {}
