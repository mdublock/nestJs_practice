import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

type ErrorBody = {
  statusCode: number;
  message: string | string[];
};

const POSTGRES_ERRORS: Record<string, ErrorBody> = {
  '23505': {
    statusCode: HttpStatus.CONFLICT,
    message: 'Resource already exists',
  },
  '23502': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Required field is missing',
  },
  '22001': { statusCode: HttpStatus.BAD_REQUEST, message: 'Value is too long' },
  '22P02': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Invalid input syntax',
  },
};

function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toErrorBody(exception);

    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message: this.extractMessage(exception),
      };
    }

    if (hasErrorCode(exception) && exception.code in POSTGRES_ERRORS) {
      return POSTGRES_ERRORS[exception.code];
    }

    this.logger.error(
      exception instanceof Error
        ? (exception.stack ?? exception.message)
        : String(exception),
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  private extractMessage(exception: HttpException): string | string[] {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if ('message' in response) {
      const { message } = response;

      if (typeof message === 'string') {
        return message;
      }

      if (
        Array.isArray(message) &&
        message.every((item): item is string => typeof item === 'string')
      ) {
        return message;
      }
    }

    return exception.message;
  }
}
