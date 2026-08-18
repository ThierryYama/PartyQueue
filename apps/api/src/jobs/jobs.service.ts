import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type {
  LibrarySyncJobPayload,
  SystemPingJobPayload,
} from '@partyqueue/contracts';
import type { Queue } from 'bullmq';
import {
  LIBRARY_QUEUE,
  LIBRARY_SYNC_JOB,
  SYSTEM_PING_JOB,
  SYSTEM_QUEUE,
} from './jobs.constants';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue(SYSTEM_QUEUE) private readonly systemQueue: Queue,
    @InjectQueue(LIBRARY_QUEUE) private readonly libraryQueue: Queue,
  ) {}

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

  async enqueueLibrarySync(payload: LibrarySyncJobPayload) {
    const jobId = `library-sync-${payload.externalAccountId}`;
    const existingJob = await this.libraryQueue.getJob(jobId);
    if (existingJob) {
      const state = await existingJob.getState();
      if (['completed', 'failed'].includes(state)) {
        await existingJob.remove();
      } else {
        return {
          jobId: existingJob.id,
          name: existingJob.name,
          status: state,
        } as const;
      }
    }

    const job = await this.libraryQueue.add(LIBRARY_SYNC_JOB, payload, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2_000,
      },
      jobId,
      removeOnComplete: true,
      removeOnFail: true,
    });

    return {
      jobId: job.id,
      name: job.name,
      status: 'queued',
    } as const;
  }

  async getLibrarySyncJobState(externalAccountId: string) {
    const job = await this.libraryQueue.getJob(
      `library-sync-${externalAccountId}`,
    );
    return job ? job.getState() : null;
  }
}
