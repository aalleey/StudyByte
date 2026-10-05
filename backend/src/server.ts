import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const app = createApp();

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[server] received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('[server] shutdown complete');
    process.exit(0);
  });

  // Force exit if graceful shutdown hangs
  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error('[server] forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
