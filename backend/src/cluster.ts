import cluster from 'cluster';
import os from 'os';
import { logger } from './utils/logger';

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  logger.info(`Master process ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Code: ${code}, Signal: ${signal}`);
    cluster.fork();
  });

  process.on('SIGTERM', () => {
    logger.info('Master received SIGTERM. Shutting down...');
    
    for (const id in cluster.workers) {
      cluster.workers[id]?.process.kill('SIGTERM');
    }
    
    process.exit(0);
  });

} else {
  require('./server');
  logger.info(`Worker ${process.pid} started`);

  process.on('SIGTERM', () => {
    logger.info(`Worker ${process.pid} received SIGTERM. Shutting down...`);
    process.exit(0);
  });
}

export default cluster; 