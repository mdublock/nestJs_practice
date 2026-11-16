import { Kysely } from 'kysely';
import { Database } from '../database.types.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('refresh_tokens')
    .addColumn('expires_at', 'timestamptz')
    .addColumn('revoked', 'boolean', (col) => col.notNull().defaultTo(false))
    .execute();

  await db
    .updateTable('refresh_tokens')
    .set({
      expires_at: new Date(0),
      revoked: true,
    })
    .where('expires_at', 'is', null)
    .execute();

  await db.schema
    .alterTable('refresh_tokens')
    .alterColumn('expires_at', (col) => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('refresh_tokens')
    .dropColumn('expires_at')
    .dropColumn('revoked')
    .execute();
}
