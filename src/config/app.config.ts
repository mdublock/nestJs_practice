import { registerAs } from '@nestjs/config';
import { loadEnv } from './env.schema.js';

export default registerAs('app', () => ({
  port: loadEnv().PORT,
}));
