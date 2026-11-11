import { registerAs } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';
import { loadEnv } from './env.schema.js';

type ExpiresIn = NonNullable<SignOptions['expiresIn']>;

export default registerAs('jwt', () => {
  const env = loadEnv();

  return {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN as ExpiresIn,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN as ExpiresIn,
  };
});
