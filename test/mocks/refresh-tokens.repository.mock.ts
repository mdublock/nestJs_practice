import type { E2eTestStore, TestRefreshToken } from '../e2e-test.module.js';

export class RefreshTokensRepositoryMock {
  constructor(private readonly store: E2eTestStore) {}

  async create(tokenData: {
    user_id: number;
    token_hash: string;
    jti: string;
    expires_at: Date;
    revoked?: boolean;
  }): Promise<TestRefreshToken> {
    const token: TestRefreshToken = {
      id: this.store.nextRefreshTokenId++,
      user_id: tokenData.user_id,
      token_hash: tokenData.token_hash,
      jti: tokenData.jti,
      expires_at: tokenData.expires_at,
      revoked: tokenData.revoked ?? false,
    };

    this.store.refreshTokens.push(token);
    return token;
  }

  async findByJti(jti: string) {
    return this.store.refreshTokens.find((token) => token.jti === jti);
  }

  async deleteByJti(jti: string) {
    this.store.refreshTokens = this.store.refreshTokens.filter(
      (token) => token.jti !== jti,
    );
  }

  async rotate(
    oldJti: string,
    userId: number,
    newTokenData: {
      user_id: number;
      token_hash: string;
      jti: string;
      expires_at: Date;
      revoked?: boolean;
    },
  ): Promise<boolean> {
    const oldToken = this.store.refreshTokens.find(
      (token) =>
        token.jti === oldJti &&
        token.user_id === userId &&
        token.revoked === false &&
        token.expires_at > new Date(),
    );

    if (!oldToken) {
      return false;
    }

    oldToken.revoked = true;

    await this.create(newTokenData);
    return true;
  }
}
