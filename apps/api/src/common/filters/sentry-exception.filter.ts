import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { Request, Response } from 'express';

function captureWithRequestContext(exception: unknown, request: Request): void {
  Sentry.withScope((scope) => {
    const environment = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development';
    scope.setTag('environment', environment);

    if (request.activeOrganizationId) {
      scope.setTag('organizationId', request.activeOrganizationId);
    }

    const route = request.route?.path as string | undefined;
    const endpoint = route ? `${request.method} ${route}` : `${request.method} ${request.path}`;
    scope.setTag('endpoint', endpoint);

    Sentry.captureException(exception);
  });
}

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      if (process.env.SENTRY_DSN?.trim()) {
        captureWithRequestContext(exception, request);
      }
      this.logger.error(exception);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erro interno do servidor.',
      });
      return;
    }

    const status = exception.getStatus();
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR && process.env.SENTRY_DSN?.trim()) {
      captureWithRequestContext(exception, request);
    }

    const body = exception.getResponse();
    response
      .status(status)
      .json(typeof body === 'string' ? { message: body } : body);
  }
}
