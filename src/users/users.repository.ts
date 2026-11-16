import { Insertable, Kysely, Updateable } from 'kysely';
import { Database } from '../database/database.types.js';
import { DATABASE } from '../database/database.constants.js';
import { Inject } from '@nestjs/common';
import { UsersQueryDto } from './dto/users-query.dto.js';
import { escapeLikePattern } from '../database/escape-like-pattern.js';

type UpdatableUserFields = Pick<
  Updateable<Database['users']>,
  'login' | 'email' | 'age' | 'about'
>;
export class UsersRepository {
  constructor(@Inject(DATABASE) private db: Kysely<Database>) {}

  async createWithRefreshToken<T>(
    userData: Insertable<Database['users']>,
    issueRefreshToken: (userId: number) => Promise<{
      tokenData: Insertable<Database['refresh_tokens']>;
      result: T;
    }>,
  ): Promise<T> {
    return this.db.transaction().execute(async (trx) => {
      const user = await trx
        .insertInto('users')
        .values(userData)
        .returning('id')
        .executeTakeFirstOrThrow();

      const { tokenData, result } = await issueRefreshToken(user.id);

      await trx.insertInto('refresh_tokens').values(tokenData).execute();

      return result;
    });
  }

  async findById(id: number) {
    return this.db
      .selectFrom('users')
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .selectAll()
      .executeTakeFirst();
  }

  async softDelete(id: number) {
    const result = await this.db
      .updateTable('users')
      .set({
        deleted_at: new Date(),
      })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .returning('id')
      .executeTakeFirst();

    return result;
  }

  async updateUser(id: number, userData: UpdatableUserFields) {
    const { login, email, age, about } = userData;

    return this.db
      .updateTable('users')
      .set({ login, email, age, about })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .returning(['id', 'login', 'email', 'age', 'about'])
      .executeTakeFirst();
  }

  async findByLogin(login: string) {
    const user = await this.db
      .selectFrom('users')
      .where('login', '=', login)
      .where('deleted_at', 'is', null)
      .selectAll()
      .executeTakeFirst();

    return user;
  }

  async findAll(query: UsersQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const offset = (page - 1) * limit;

    let usersQuery = this.db
      .selectFrom('users')
      .select(['id', 'login', 'email', 'age', 'about'])
      .where('deleted_at', 'is', null)
      .orderBy('id', 'asc')
      .limit(limit)
      .offset(offset);

    let countQuery = this.db
      .selectFrom('users')
      .select(({ fn }) => fn.countAll().as('count'))
      .where('deleted_at', 'is', null);

    if (search) {
      const pattern = `%${escapeLikePattern(search)}%`;

      usersQuery = usersQuery.where('login', 'ilike', pattern);
      countQuery = countQuery.where('login', 'ilike', pattern);
    }

    const [users, countResult] = await Promise.all([
      usersQuery.execute(),
      countQuery.executeTakeFirstOrThrow(),
    ]);

    const total = Number(countResult.count);
    const totalPages = Math.ceil(total / limit);

    return {
      items: users,
      page,
      limit,
      total,
      totalPages,
    };
  }
}
