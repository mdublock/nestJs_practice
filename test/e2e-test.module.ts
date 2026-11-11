import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { UsersRepositoryMock } from './mocks/users.repository.mock.js';
import { RefreshTokensRepositoryMock } from './mocks/refresh-tokens.repository.mock.js';

import { UsersRepository } from '../src/users/users.repository.js';
import { RefreshTokensRepository } from '../src/auth/refresh-tokens.repository.js';

export interface TestUser {
  id: number;
  login: string;
  email: string;
  password_hash: string;
  deleted_at: Date | null;
  age: number | null;
  about: string | null;
}

export interface TestRefreshToken {
  id: number;
  user_id: number;
  jti: string;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
}

export class E2eTestStore {
  users: TestUser[] = [];
  refreshTokens: TestRefreshToken[] = [];

  nextUserId = 1;
  nextRefreshTokenId = 1;

  reset(): void {
    this.users = [];
    this.refreshTokens = [];
    this.nextUserId = 1;
    this.nextRefreshTokenId = 1;
  }
}

export async function createE2eTestApp() {
  const store = new E2eTestStore();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(UsersRepository)
    .useFactory({
      factory: () => new UsersRepositoryMock(store),
    })
    .overrideProvider(RefreshTokensRepository)
    .useFactory({
      factory: () => new RefreshTokensRepositoryMock(store),
    })
    .overrideProvider('DATABASE')
    .useValue({
      destroy: async () => {},
    })
    .overrideProvider('DATABASE_CONNECTION')
    .useValue({})
    .compile();

  const app: INestApplication = moduleRef.createNestApplication();

  await app.init();

  return { app, store };
}
