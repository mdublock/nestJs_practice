export type JwtPayload = {
  sub: number;
};

export type AccessTokenPayload = JwtPayload & {
  type: 'access';
};

export type RefreshTokenPayload = JwtPayload & {
  jti: string;
  type: 'refresh';
  exp: number;
};
