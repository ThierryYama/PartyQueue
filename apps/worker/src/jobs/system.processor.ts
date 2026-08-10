import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type {
  SystemPingJobPayload,
  SystemPingJobResult,
} from '@partyqueue/contracts';
import type { Job } from 'bullmq';
import { SYSTEM_PING_JOB, SYSTEM_QUEUE } from './jobs.constants';

@Processor(SYSTEM_QUEUE)
export class SystemProcessor extends WorkerHost {
  private readonly logger = new Logger(SystemProcessor.name);

  process(
    job: Job<SystemPingJobPayload, SystemPingJobResult>,
  ): Promise<SystemPingJobResult> {
    if (job.name !== SYSTEM_PING_JOB) {
      throw new Error(`Unsupported job: ${job.name}`);
    }

    this.logger.log(`Processing ${job.name} (${job.id ?? 'without-id'})`);

    return Promise.resolve({
      processedAt: new Date().toISOString(),
      worker: 'partyqueue-worker' as const,
    });
  }
}
