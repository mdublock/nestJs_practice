import { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  const createHost = () => {
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;

    return { host, response };
  };

  it.each([
    ['users_login_key', 'User with this login already exists'],
    ['users_email_lower_key', 'User with this email already exists'],
    ['unknown_key', 'Resource already exists'],
  ])('should map a unique violation on %s to 409', (constraint, message) => {
    const { host, response } = createHost();

    filter.catch({ code: '23505', constraint }, host);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({ statusCode: 409, message });
  });
});
