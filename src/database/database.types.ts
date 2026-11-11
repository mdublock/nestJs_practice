import { Generated } from 'kysely';

interface UsersTable {
  id: Generated<number>;
  login: string;
  email: string;
  password_hash: string;
  deleted_at: Date | null;
  age: number | null;
  about: string | null;
}
interface RefreshTokensTable {
  id: Generated<number>;
  user_id: number;
  token_hash: string;
  jti: string;
  expires_at: Date;
  revoked: Generated<boolean>;
}

export interface Database {
  users: UsersTable;
  refresh_tokens: RefreshTokensTable;
}
