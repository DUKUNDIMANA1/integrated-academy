import { Queue, Worker } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import enrollmentService from '../services/enrollment.service';

let paymentCheckpointQueue: Queue | null = null;
let checkpointWorker: Worker | null = null;

async function redisAvailable(connection: { ping: () => Promise<string> }): Promise<boolean> {
  try {
    await Promise.race([
      connection.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout')), 3000)),
    ]);
    return true;
  } catch {
    return false;
  }
}

export const initScheduler = async (): Promise<void> => {
  let queueConnection: ReturnType<typeof createBullMQConnection> | null = null;
  let workerConnection: ReturnType<typeof createBullMQConnection> | null = null;
  try {
    // BullMQ requires SEPARATE connections for Queue and Worker — never share one.
    queueConnection = createBullMQConnection();
    workerConnection = createBullMQConnection();
    workerConnection.on('error', () => {}); // handled via ping check below

    const ok = await redisAvailable(queueConnection);
    if (!ok) {
      console.warn('[Scheduler] Redis unavailable — running WITHOUT background scheduler (API still works). Start Redis and restart backend to enable daily checkpoint job.');
      try { queueConnection.disconnect(); } catch { /* ignore */ }
      try { workerConnection.disconnect(); } catch { /* ignore */ }
      return;
    }

    // Create queue
    paymentCheckpointQueue = new Queue('payment-checkpoint', { connection: queueConnection });

    // Worker: runs the daily checkpoint check
    checkpointWorker = new Worker(
      'payment-checkpoint',
      async (job) => {
        console.log(`[Scheduler] Running job: ${job.name} at ${new Date().toISOString()}`);
        const result = await enrollmentService.runDailyCheckpointCheck();
        console.log(`[Scheduler] Checkpoint check done — locked: ${result.locked}, reminded: ${result.reminded}`);
        return result;
      },
      { connection: workerConnection }
    );

    checkpointWorker.on('completed', (job, result) => {
      console.log(`[Scheduler] Job ${job.id} completed:`, result);
    });

    checkpointWorker.on('failed', (job, err) => {
      console.error(`[Scheduler] Job ${job?.id} failed:`, err.message);
    });

    // Schedule daily job at midnight (using repeat)
    await paymentCheckpointQueue.add(
      'daily-checkpoint',
      { type: 'checkpoint' },
      {
        repeat: { pattern: '0 0 * * *' }, // Every day at midnight
        removeOnComplete: 10,
        removeOnFail: 5,
      }
    );

    // Also run immediately on startup (dev convenience)
    if (process.env.NODE_ENV === 'development') {
      await paymentCheckpointQueue.add('startup-checkpoint', { type: 'checkpoint' }, { removeOnComplete: 1 });
    }

    console.log('[Scheduler] Payment checkpoint scheduler initialized');
  } catch (err) {
    console.error('[Scheduler] Failed to initialize scheduler (Redis may be unavailable):', (err as Error).message);
    // Non-fatal: app continues without scheduler
  }
};

export const stopScheduler = async (): Promise<void> => {
  try {
    if (checkpointWorker) await checkpointWorker.close();
  } catch { /* ignore */ }
  try {
    if (paymentCheckpointQueue) await paymentCheckpointQueue.close();
  } catch { /* ignore */ }
  checkpointWorker = null;
  paymentCheckpointQueue = null;
};
