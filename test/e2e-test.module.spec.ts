import { describe, it, expect, afterEach } from 'vitest';
import { createE2eTestApp } from './e2e-test.module.js';

describe('E2E test module', () => {
  let app: Awaited<ReturnType<typeof createE2eTestApp>>['app'];

  afterEach(async () => {
    await app?.close();
  });

  it('should initialize and close without PostgresSQL connection', async () => {
    const testContext = await createE2eTestApp();
    app = testContext.app;

    expect(app).toBeDefined();
    expect(testContext.store.users).toHaveLength(0);
    expect(testContext.store.refreshTokens).toHaveLength(0);
  });
});
