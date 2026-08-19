import fp from 'fastify-plugin';
import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError | ZodError | ApiError, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: 'BadRequest',
        message: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        statusCode: 400,
      });
    }

    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
      });
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error(error);
    }

    return reply.code(statusCode).send({
      error: statusCode >= 500 ? 'InternalServerError' : 'Error',
      message: statusCode >= 500 ? 'Something went wrong' : error.message,
      statusCode,
    });
  });
});
