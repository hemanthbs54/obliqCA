import { env } from '../config/env.js';

export const loggerConfig =
  env.NODE_ENV === 'development'
    ? { level: 'info', transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } }
    : { level: 'info' };
