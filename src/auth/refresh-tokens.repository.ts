import { Insertable, Kysely } from 'kysely';
import { Database } from '../database/database.types.js';
import { Inject } from '@nestjs/common';

export class RefreshTokensRepository {
  constructor(@Inject('DATABASE') private db: Kysely<Database>) {}

  async create(tokenData: Insertable<Database['refresh_tokens']>) {
    const newToken = await this.db
      .insertInto('refresh_tokens')
      .values(tokenData)
      .returningAll()
      .executeTakeFirst();

    return newToken;
  }

  async findByJti(jti: string) {
    return this.db
      .selectFrom('refresh_tokens')
      .selectAll()
      .where('jti', '=', jti)
      .executeTakeFirst();
  }

  async deleteByJti(jti: string) {
    await this.db.deleteFrom('refresh_tokens').where('jti', '=', jti).execute();
  }

  async rotate(
    oldJti: string,
    userId: number,
    newTokenData: Insertable<Database['refresh_tokens']>,
  ): Promise<boolean> {
    return this.db.transaction().execute(async (trx) => {
      const consumedToken = await trx
        .updateTable('refresh_tokens')
        .set({ revoked: true })
        .where('jti', '=', oldJti)
        .where('user_id', '=', userId)
        .where('revoked', '=', false)
        .where('expires_at', '>', new Date())
        .returning('id')
        .executeTakeFirst();

      if (!consumedToken) {
        return false;
      }

      await trx.insertInto('refresh_tokens').values(newTokenData).execute();

      return true;
    });
  }
}
