import { Kysely } from 'kysely';
import { Database } from '../database.types.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'integer', (column) =>
      column.primaryKey().generatedAlwaysAsIdentity(),
    )
    .addColumn('login', 'varchar(255)', (column) => column.notNull().unique())
    .addColumn('email', 'varchar(255)', (column) => column.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (column) => column.notNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('users').execute();
}
