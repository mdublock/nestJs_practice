import { Insertable, Kysely } from 'kysely';
import { Database } from '../database/database.types.js';
import { Inject } from '@nestjs/common';
import { UsersQueryDto } from './dto/users-query.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

export class UsersRepository {
  constructor(@Inject('DATABASE') private db: Kysely<Database>) {}

  async create(userData: Insertable<Database['users']>) {
    const newUser = await this.db
      .insertInto('users')
      .values(userData)
      .returning(['id', 'login', 'email', 'deleted_at'])
      .executeTakeFirstOrThrow();

    return newUser;
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

  async updateUser(id: number, userData: UpdateUserDto) {
    return this.db
      .updateTable('users')
      .set(userData)
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
      usersQuery = usersQuery.where('login', 'ilike', `%${search}%`);
      countQuery = countQuery.where('login', 'ilike', `%${search}%`);
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
