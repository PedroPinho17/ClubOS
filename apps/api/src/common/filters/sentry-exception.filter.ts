import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { Response } from 'express';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      if (process.env.SENTRY_DSN?.trim()) {
        Sentry.captureException(exception);
      }
      this.logger.error(exception);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erro interno do servidor.',
      });
      return;
    }

    const status = exception.getStatus();
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR && process.env.SENTRY_DSN?.trim()) {
      Sentry.captureException(exception);
    }

    const body = exception.getResponse();
    response
      .status(status)
      .json(typeof body === 'string' ? { message: body } : body);
  }
}
