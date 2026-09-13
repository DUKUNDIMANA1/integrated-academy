import app from './app';
import { env } from './config/env';
import prisma from './config/database';
import { initScheduler, stopScheduler } from './jobs/scheduler';
import * as fs from 'fs';
import * as path from 'path';

const startServer = async (): Promise<void> => {
  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), env.UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // Connect to database
  await prisma.$connect();
  console.log('✅ Database connected');

  // Initialize scheduler (non-fatal if Redis unavailable)
  await initScheduler();

  // Start HTTP server
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`📱 Environment: ${env.NODE_ENV}`);
    console.log(`🗄️  API Base: http://localhost:${env.PORT}/api`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await stopScheduler();
      await prisma.$disconnect();
      console.log('Server shut down');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
