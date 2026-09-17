import fp from 'fastify-plugin';
import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { ApiError } from '../lib/errors.js';

const STATUS_NAMES: Record<number, string> = {
  400: 'BadRequest',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'NotFound',
  409: 'Conflict',
  413: 'PayloadTooLarge',
  415: 'UnsupportedMediaType',
};

export default fp(async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError | ZodError | ApiError, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: 'BadRequest',
        message: error.issues
          .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
          .join('; '),
        statusCode: 400,
      });
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error(error);
      return reply.code(statusCode).send({ error: 'InternalServerError', message: 'Something went wrong', statusCode });
    }

    return reply.code(statusCode).send({
      error: STATUS_NAMES[statusCode] ?? 'Error',
      message: error.message,
      statusCode,
    });
  });
});
