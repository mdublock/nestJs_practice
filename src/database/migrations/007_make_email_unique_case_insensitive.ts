import { Kysely, sql } from 'kysely';
import { Database } from '../database.types.js';

// Existing rows are not modified: the index compares lower(email),
// so stored values keep their original case.
export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createIndex('users_email_lower_key')
    .on('users')
    .unique()
    .expression(sql`lower(email)`)
    .execute();

  await db.schema
    .alterTable('users')
    .dropConstraint('users_email_key')
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addUniqueConstraint('users_email_key', ['email'])
    .execute();

  await db.schema.dropIndex('users_email_lower_key').execute();
}
