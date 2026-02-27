import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let fields: Record<string, string> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        error = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        error = resObj['error'] || resObj['message'] || error;
        code = resObj['code'] || code;
        fields = resObj['fields'];

        // Handle class-validator errors from ValidationPipe
        if (Array.isArray(resObj['message'])) {
          error = 'Validation failed';
          code = 'VALIDATION_ERROR';
          fields = {};
          for (const msg of resObj['message'] as string[]) {
            const parts = msg.split(' ');
            const field = parts[0];
            fields[field] = msg;
          }
        }
      }
    } else {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const responseBody: Record<string, any> = { error, code };
    if (fields) responseBody['fields'] = fields;

    response.status(status).json(responseBody);
  }
}
