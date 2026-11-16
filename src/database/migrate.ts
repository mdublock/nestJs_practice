import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Kysely, PostgresDialect } from 'kysely';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { Pool } from 'pg';
import databaseConfig from '../config/database.config.js';
import { Database } from './database.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = databaseConfig();

const pool = new Pool({
  host: config.host,
  port: config.port,
  database: config.name,
  user: config.user,
  password: config.password,
});

const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(__dirname, 'migrations'),
    import: (filePath) => import(pathToFileURL(filePath).href),
  }),
});

async function migrate() {
  try {
    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((result) => {
      console.log(`${result.status}: ${result.migrationName}`);
    });

    if (error) {
      console.error('Migration failed');
      console.error(error);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Migration execution failed');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

void migrate().catch((error: unknown) => {
  console.error('Unexpected migration error', error);
  process.exitCode = 1;
});
