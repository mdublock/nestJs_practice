import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import request from 'supertest';
import jwtConfig from '../src/config/jwt.config.js';
import { createE2eTestApp, E2eTestStore } from './e2e-test.module.js';
type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

describe('Application (e2e)', () => {
  let app: INestApplication;
  let store: E2eTestStore;

  beforeEach(async () => {
    const testContext = await createE2eTestApp();
    app = testContext.app;
    store = testContext.store;
  });

  afterEach(async () => {
    await app.close();
  });

  const registerUser = async (login: string): Promise<TokenPair> => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login,
        email: `${login}@example.com`,
        password: 'StrongPassword123',
      })
      .expect(201);

    return response.body as TokenPair;
  };

  const getAccessSecret = (): string =>
    app.get<ConfigType<typeof jwtConfig>>(jwtConfig.KEY).accessSecret;

  it('GET / should return Hello World', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('GET /users without access token should return 401', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
    });
  });

  it('POST /auth/register should create a user and return token pair', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'e2e_test_user',
        email: 'e2e_test@example.com',
        password: 'StrongPassword123',
        age: 30,
        about: 'E2E test user',
      })
      .expect(201);

    expect(response.body).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });

    expect(store.users).toHaveLength(1);
    expect(store.users[0]).toMatchObject({
      login: 'e2e_test_user',
      email: 'e2e_test@example.com',
      age: 30,
      about: 'E2E test user',
      deleted_at: null,
    });

    expect(store.refreshTokens).toHaveLength(1);
    expect(store.refreshTokens[0]).toMatchObject({
      user_id: store.users[0].id,
      revoked: false,
    });

    expect(store.refreshTokens[0].token_hash).not.toBe(
      response.body.refreshToken,
    );
  });

  it('POST /auth/login should authenticate an existing user and return token pair', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'login_test_user',
        email: 'login_test@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'login_test_user',
        password: 'StrongPassword123',
      })
      .expect(200);

    expect(response.body).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });

    expect(store.users).toHaveLength(1);
    expect(store.refreshTokens).toHaveLength(2);
  });

  it('POST /auth/login should return 401 for unknown login', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'unknown_user',
        password: 'StrongPassword123',
      })
      .expect(401);
  });

  it('POST /auth/login should return 401 for incorrect password', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'wrong_password_user',
        email: 'wrong_password@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'wrong_password_user',
        password: 'WrongPassword123',
      })
      .expect(401);
  });

  it('POST /auth/refresh should rotate refresh token successfully', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'refresh_test_user',
        email: 'refresh_test@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    const oldRefreshToken = registerResponse.body.refreshToken;

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: oldRefreshToken,
      })
      .expect(200);

    expect(refreshResponse.body).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });

    expect(refreshResponse.body.refreshToken).not.toBe(oldRefreshToken);

    expect(store.refreshTokens).toHaveLength(2);
    expect(store.refreshTokens[0].revoked).toBe(true);
    expect(store.refreshTokens[1].revoked).toBe(false);
  });

  it('POST /auth/refresh should reject a previously rotated token', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'refresh_replay_user',
        email: 'refresh_replay@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    const oldRefreshToken = registerResponse.body.refreshToken;

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: oldRefreshToken,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: oldRefreshToken,
      })
      .expect(401);

    expect(store.refreshTokens).toHaveLength(2);
  });

  it('POST /auth/refresh should accept the newly issued refresh token', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'refresh_new_token_user',
        email: 'refresh_new_token@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    const firstRefreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: registerResponse.body.refreshToken,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: firstRefreshResponse.body.refreshToken,
      })
      .expect(200);

    expect(store.refreshTokens).toHaveLength(3);
    expect(store.refreshTokens[0].revoked).toBe(true);
    expect(store.refreshTokens[1].revoked).toBe(true);
    expect(store.refreshTokens[2].revoked).toBe(false);
  });

  it('POST /auth/logout should delete refresh token', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'logout_test_user',
        email: 'logout_test@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    expect(store.refreshTokens).toHaveLength(1);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken: registerResponse.body.refreshToken,
      })
      .expect(201);

    expect(store.refreshTokens).toHaveLength(0);
  });

  it('POST /auth/refresh should reject a token after logout', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'logout_refresh_user',
        email: 'logout_refresh@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    const refreshToken = registerResponse.body.refreshToken;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(401);

    expect(store.refreshTokens).toHaveLength(0);
  });

  it('POST /auth/logout should return 401 for invalid refresh token', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken: 'invalid-token',
      })
      .expect(401);

    expect(store.refreshTokens).toHaveLength(0);
  });

  it('POST /auth/register should return 409 for a taken login', async () => {
    await registerUser('duplicate_user');

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'duplicate_user',
        email: 'anoither_email@example.com',
        password: 'StrongPassword123',
      })
      .expect(409);

    expect(response.body).toEqual({
      statusCode: 409,
      message: 'User with this login already exists',
    });

    expect(store.users).toHaveLength(1);
  });

  it('GET /profile/my should return 401 for an expired access token', async () => {
    await registerUser('expired_token_user');

    const expiredToken = await new JwtService().signAsync(
      {
        sub: store.users[0].id,
        type: 'access',
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      { secret: getAccessSecret() },
    );

    const response = await request(app.getHttpServer())
      .get('/profile/my')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
    });
  });

  it.each<[string, (tokens: TokenPair, userId: number) => Promise<string>]>([
    ['a malformed token', async () => 'not-a-jwt'],
    [
      'a token signed with another secret',
      (_tokens, userId) =>
        new JwtService().signAsync(
          { sub: userId, type: 'access' },
          { secret: 'another-secret-another-secret-123', expiresIn: '15m' },
        ),
    ],
    ['a refresh token', async (tokens) => tokens.refreshToken],
    [
      'an access-signed token with type refresh',
      (_tokens, userId) =>
        new JwtService().signAsync(
          { sub: userId, type: 'refresh' },
          { secret: getAccessSecret(), expiresIn: '15m' },
        ),
    ],
  ])('GET /profile/my should return 401 for %s', async (_name, buildToken) => {
    const tokens = await registerUser('invalid_token_user');
    const token = await buildToken(tokens, store.users[0].id);

    await request(app.getHttpServer())
      .get('/profile/my')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('GET /profile/my should return the current user profile', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'profile_test_user',
        email: 'profile_test@example.com',
        password: 'StrongPassword123',
        age: 30,
        about: 'Profile E2E test',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/profile/my')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: store.users[0].id,
      login: 'profile_test_user',
      email: 'profile_test@example.com',
      age: 30,
      about: 'Profile E2E test',
    });
  });

  it('PUT /users/me should update the current user profile', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'update_test_user',
        email: 'update_test@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .put('/users/me')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({
        login: 'updated_profile_user',
        email: 'updated_profile@example.com',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: store.users[0].id,
      login: 'updated_profile_user',
      email: 'updated_profile@example.com',
    });

    expect(store.users[0]).toMatchObject({
      login: 'updated_profile_user',
      email: 'updated_profile@example.com',
    });
  });

  it('GET /users should return users list with pagination', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'list_test_user',
        email: 'list_test@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body).toMatchObject({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });

    expect(response.body.items).toEqual([
      expect.objectContaining({
        id: store.users[0].id,
        login: 'list_test_user',
        email: 'list_test@example.com',
      }),
    ]);
  });

  it('GET /users should filter by login and paginate the result', async () => {
    const { accessToken } = await registerUser('alice_one');
    await registerUser('bob');
    await registerUser('ALICE_two');

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: 'alice', page: 2, limit: 1 })
      .expect(200);

    expect(response.body).toEqual({
      items: [
        {
          id: store.users[2].id,
          login: 'ALICE_two',
          email: 'ALICE_two@example.com',
          age: null,
          about: null,
        },
      ],
      page: 2,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
  });

  it('GET /users should return 400 when limit exceeds the maximum', async () => {
    const { accessToken } = await registerUser('limit_test_user');

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ limit: 1000 })
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: ['limit must not be greater than 100'],
    });
  });

  it('GET /users/:id should return user by ID', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        login: 'find_test_user',
        email: 'find_test@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    const userId = store.users[0].id;

    const response = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: userId,
      login: 'find_test_user',
      email: 'find_test@example.com',
    });

    expect(store.users[0]).toMatchObject({
      id: userId,
      login: 'find_test_user',
      email: 'find_test@example.com',
    });

    expect(response.body).not.toHaveProperty('password_hash');
  });

  it('DELETE /users/me should soft delete the user and revoke further access', async () => {
    const deleted = await registerUser('delete_test_user');
    const other = await registerUser('other_user');

    await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${deleted.accessToken}`)
      .expect(200);

    expect(store.users[0].deleted_at).toBeInstanceOf(Date);

    await request(app.getHttpServer())
      .get('/profile/my')
      .set('Authorization', `Bearer ${deleted.accessToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: 'delete_test_user', password: 'StrongPassword123' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: deleted.refreshToken })
      .expect(401);

    const listResponse = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${other.accessToken}`)
      .expect(200);

    expect(listResponse.body.total).toBe(1);
    expect(listResponse.body.items).toEqual([
      expect.objectContaining({ login: 'other_user' }),
    ]);
  });
});
