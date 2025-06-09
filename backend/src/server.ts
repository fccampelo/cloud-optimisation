import app from './app';
import { logger } from './utils/logger';
import { MemoryLeakDetector } from './utils/performance';

const port = process.env.PORT || 3000;

MemoryLeakDetector.start();

const server = app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
});

export default server; 