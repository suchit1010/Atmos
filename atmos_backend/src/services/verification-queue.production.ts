/**
 * ATMOS Protocol — Async Verification Queue
 * Using Bull (Redis-backed) for background verification jobs
 * This prevents 30+ second AI calls from blocking HTTP responses
 */

import Queue from 'bull';
import { logger } from '../utils/logger';
import { runAIVerification } from './ai';
import { generateZKProof } from './zk';
import { query } from '../db/pool';
import type { AIVerificationResult } from './ai';

// ─── Queue Configuration ────────────────────────────────
const verificationQueue = new Queue('verification:mrv', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// ─── Interfaces ──────────────────────────────────────────
export interface VerificationJob {
  projectId: string;
  userId: string;
  type: string;
  location: string;
  metadata: Record<string, any>;
  priority: 'high' | 'normal' | 'low';
}

export interface VerificationResult {
  projectId: string;
  co2eEstimated: number;
  confidence: number;
  grade: 'A' | 'B' | 'C' | 'D';
  fraudRisk: 'low' | 'medium' | 'high';
  methodology: string;
  zkProof: string;
  timestamp: number;
  version: number;
}

// ─── Queue Processor ────────────────────────────────────
verificationQueue.process(5, async (job) => {
  const { projectId, userId, type, location, metadata, priority } = job.data as VerificationJob;

  logger.info('Processing verification job', { jobId: job.id, projectId, userId, priority });

  try {
    // Step 1: Run AI verification
    job.progress(25);
    const aiResult: AIVerificationResult = await runAIVerification(
      projectId,
      type,
      metadata,
      null // satellite data (optional)
    );

    logger.info('AI verification complete', {
      projectId,
      confidence: aiResult.confidence.overall,
    });

    // Step 2: Generate ZK proof
    job.progress(50);
    const zkResult = await generateZKProof({
      projectId,
      userId,
      co2eEstimated: aiResult.co2eEstimated,
      grade: aiResult.grade,
      entityType: type,
      metadata: aiResult,
      lat: parseFloat(metadata.lat) || 0,
      lng: parseFloat(metadata.lng) || 0,
      confidence: aiResult.confidence.overall,
      verificationId: projectId,
    });

    // Step 3: Assemble result
    const result: VerificationResult = {
      projectId,
      co2eEstimated: aiResult.co2eEstimated,
      confidence: aiResult.confidence.overall,
      grade: aiResult.grade === 'S' ? 'A' : aiResult.grade,
      fraudRisk: aiResult.fraud.risk,
      methodology: aiResult.methodology,
      zkProof: zkResult.proofHash,
      timestamp: Date.now(),
      version: 1,
    };

    job.progress(75);

    // Step 4: Store in database
    await query(
      `UPDATE projects 
       SET verification_result = $1, zk_proof = $2, verified_at = NOW(), status = 'verified'
       WHERE id = $3`,
      [JSON.stringify(result), zkResult.proofHash, projectId]
    );

    job.progress(100);

    logger.info('Verification job completed', {
      jobId: job.id,
      projectId,
      confidence: result.confidence,
      grade: result.grade,
    });

    return result;
  } catch (err) {
    logger.error('Verification job failed', {
      jobId: job.id,
      projectId,
      error: (err as any).message,
      attempt: job.attemptsMade,
    });

    if (job.attemptsMade >= 3) {
      await query(
        `UPDATE projects SET status = 'verification_failed', error = $1 WHERE id = $2`,
        [(err as any).message, projectId]
      );
    }

    throw err;
  }
});

// ─── Event Handlers ─────────────────────────────────────
verificationQueue.on('completed', (job) => {
  logger.info('Verification job completed', {
    jobId: job.id,
    duration: (job.finishedOn || 0) - (job.processedOn || 0),
  });
});

verificationQueue.on('failed', (job, err) => {
  logger.error('Verification job failed', {
    jobId: job.id,
    error: err.message,
    attempts: job.attemptsMade,
  });
});

verificationQueue.on('stalled', (job) => {
  logger.warn('Verification job stalled', { jobId: job.id });
});

// ─── Public API ──────────────────────────────────────────
export async function submitVerificationJob(
  data: VerificationJob
): Promise<{ jobId: string; estimatedTime: number }> {
  const priorityValue = data.priority === 'high' ? 10
    : data.priority === 'low' ? -5
      : 0;

  const job = await verificationQueue.add(data, {
    priority: priorityValue,
  });

  logger.info('Verification job submitted', {
    jobId: job.id,
    projectId: data.projectId,
    priority: data.priority,
  });

  return {
    jobId: String(job.id),
    estimatedTime: 60000,
  };
}

export async function getVerificationJobStatus(jobId: string) {
  const job = await verificationQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    state: await job.getState(),
    progress: job.progress(),
    attempts: job.attemptsMade,
    isCompleted: job.isCompleted(),
    isFailed: job.isFailed(),
    data: job.data,
    result: job.returnvalue,
  };
}

export async function getQueueStats() {
  const counts = await verificationQueue.getJobCounts();

  return {
    active: counts.active,
    waiting: counts.waiting,
    failed: counts.failed,
    completed: counts.completed,
  };
}

// ─── Dead Letter Queue ──────────────────────────────────
const dlq = new Queue('verification:dlq', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export async function moveToDeadLetterQueue(jobId: string) {
  const job = await verificationQueue.getJob(jobId);
  if (job) {
    await dlq.add(job.data, { jobId });
    await job.remove();
  }
}

export async function retryDeadLetterJob(dlqJobId: string) {
  const job = await dlq.getJob(dlqJobId);
  if (job) {
    const newJob = await verificationQueue.add(job.data);
    await job.remove();
    return newJob.id;
  }
}

// ─── Cleanup ────────────────────────────────────────────
export async function closeVerificationQueue() {
  await verificationQueue.close();
  await dlq.close();
}

export { verificationQueue };
