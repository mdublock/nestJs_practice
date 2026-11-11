import { Kysely } from 'kysely';
import { Database } from '../database.types.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('age', 'integer')
    .addColumn('about', 'varchar(1000)')
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropColumn('age')
    .dropColumn('about')
    .execute();
}
