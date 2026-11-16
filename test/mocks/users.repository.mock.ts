import type { E2eTestStore, TestUser } from '../e2e-test.module.js';

const isSameEmail = (a: string, b: string | undefined): boolean =>
  b !== undefined && a.toLowerCase() === b.toLowerCase();
export class UsersRepositoryMock {
  constructor(private readonly store: E2eTestStore) {}

  private async create(userData: {
    login: string;
    email: string;
    password_hash: string;
    age?: number | null;
    about?: string | null;
  }): Promise<TestUser> {
    if (this.store.users.some((user) => user.login === userData.login)) {
      throw { code: '23505', constraint: 'users_login_key' };
    }

    if (
      this.store.users.some((user) => isSameEmail(user.email, userData.email))
    ) {
      throw { code: '23505', constraint: 'users_email_lower_key' };
    }

    const user: TestUser = {
      id: this.store.nextUserId++,
      login: userData.login,
      email: userData.email,
      password_hash: userData.password_hash,
      age: userData.age ?? null,
      about: userData.about ?? null,
      deleted_at: null,
    };

    this.store.users.push(user);
    return user;
  }

  async createWithRefreshToken<T>(
    userData: {
      login: string;
      email: string;
      password_hash: string;
      age?: number | null;
      about?: string | null;
    },
    issueRefreshToken: (userId: number) => Promise<{
      tokenData: {
        user_id: number;
        jti: string;
        token_hash: string;
        expires_at: Date;
      };
      result: T;
    }>,
  ): Promise<T> {
    const user = await this.create(userData);

    try {
      const { tokenData, result } = await issueRefreshToken(user.id);

      this.store.refreshTokens.push({
        id: this.store.nextRefreshTokenId++,
        ...tokenData,
        revoked: false,
      });

      return result;
    } catch (error) {
      this.store.users = this.store.users.filter((item) => item !== user);
      throw error;
    }
  }

  async findById(id: number) {
    return this.store.users.find(
      (user) => user.id === id && user.deleted_at === null,
    );
  }

  async findByLogin(login: string) {
    return this.store.users.find(
      (user) => user.login === login && user.deleted_at === null,
    );
  }

  async updateUser(
    id: number,
    userData: {
      login?: string;
      email?: string;
      age?: number | null;
      about?: string | null;
    },
  ) {
    const user = this.store.users.find(
      (item) => item.id === id && item.deleted_at === null,
    );

    if (!user) {
      return undefined;
    }

    if (
      userData.login !== undefined &&
      this.store.users.some(
        (item) => item.id !== id && item.login === userData.login,
      )
    ) {
      throw { code: '23505', constraint: 'users_login_key' };
    }

    if (
      userData.email !== undefined &&
      this.store.users.some(
        (item) => item.id !== id && isSameEmail(item.email, userData.email),
      )
    ) {
      throw { code: '23505', constraint: 'users_email_lower_key' };
    }

    const { login, email, age, about } = userData;

    if (login !== undefined) user.login = login;
    if (email !== undefined) user.email = email;
    if (age !== undefined) user.age = age;
    if (about !== undefined) user.about = about;

    return {
      id: user.id,
      login: user.login,
      email: user.email,
      age: user.age,
      about: user.about,
    };
  }

  async softDelete(id: number) {
    const user = this.store.users.find(
      (item) => item.id === id && item.deleted_at === null,
    );

    if (!user) {
      return undefined;
    }

    user.deleted_at = new Date();

    return { id: user.id };
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = query;

    let users = this.store.users.filter((user) => user.deleted_at === null);

    if (search) {
      users = users.filter((user) =>
        user.login.toLowerCase().includes(search.toLowerCase()),
      );
    }

    users.sort((a, b) => a.id - b.id);

    const total = users.length;
    const offset = (page - 1) * limit;

    return {
      items: users
        .slice(offset, offset + limit)
        .map(({ id, login, email, age, about }) => ({
          id,
          login,
          email,
          age,
          about,
        })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
