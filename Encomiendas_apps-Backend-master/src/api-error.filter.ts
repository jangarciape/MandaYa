import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import type { Response } from 'express';

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = exception instanceof HttpException ? exception : undefined;
    const statusCode = http?.getStatus() ?? 500;
    const error = STATUS_CODES[statusCode] ?? 'Error';
    let message = 'No se pudo completar la solicitud';
    if (http && statusCode < 500) {
      const response = http.getResponse();
      const detail = typeof response === 'string' ? response : Reflect.get(response, 'message');
      if (typeof detail === 'string') message = detail;
      if (Array.isArray(detail)) message = detail.filter(item => typeof item === 'string').join('. ');
    }
    host.switchToHttp().getResponse<Response>().status(statusCode).json({ statusCode, error, message });
  }
}
