import { Kysely } from 'kysely';
import { Database } from '../database.types.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('refresh_tokens')
    .addColumn('id', 'integer', (col) =>
      col.primaryKey().generatedAlwaysAsIdentity(),
    )
    .addColumn('user_id', 'integer', (col) =>
      col.notNull().references('users.id'),
    )
    .addColumn('token_hash', 'varchar(255)', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('refresh_tokens').execute();
}
