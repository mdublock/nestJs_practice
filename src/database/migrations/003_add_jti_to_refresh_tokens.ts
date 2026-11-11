import { Kysely } from 'kysely';
import { Database } from '../database.types.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('refresh_tokens')
    .addColumn('jti', 'uuid', (col) => col.notNull().unique())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('refresh_tokens').dropColumn('jti').execute();
}
