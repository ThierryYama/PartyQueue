import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { SystemPingJobPayload } from '@partyqueue/contracts';
import type { Queue } from 'bullmq';
import { SYSTEM_PING_JOB, SYSTEM_QUEUE } from './jobs.constants';

@Injectable()
export class JobsService {
  constructor(@InjectQueue(SYSTEM_QUEUE) private readonly systemQueue: Queue) {}

  async enqueuePing() {
    const payload: SystemPingJobPayload = {
      requestedAt: new Date().toISOString(),
      source: 'api',
    };

    const job = await this.systemQueue.add(SYSTEM_PING_JOB, payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1_000,
      },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    return {
      jobId: job.id,
      name: job.name,
      status: 'queued',
    } as const;
  }
}
