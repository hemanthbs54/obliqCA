import { buildApp } from './app.js';
import { env } from './config/env.js';

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Obliq API listening on :${env.PORT} (docs at /docs)`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
