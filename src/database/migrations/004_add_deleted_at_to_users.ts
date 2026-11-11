import { Kysely } from 'kysely';
import { Database } from '../database.types.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('deleted_at', 'timestamp')
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('users').dropColumn('deleted_at').execute();
}
