import { registerAs } from '@nestjs/config';
import { loadEnv } from './env.schema.js';

export default registerAs('database', () => {
  const env = loadEnv();

  return {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    name: env.DATABASE_NAME,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    statementTimeoutMs: env.DATABASE_STATEMENT_TIMEOUT_MS,
  };
});
