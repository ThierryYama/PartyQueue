import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type {
  LibrarySyncJobPayload,
  LibrarySyncJobResult,
} from '@partyqueue/contracts';
import { type Job, UnrecoverableError } from 'bullmq';
import { LIBRARY_QUEUE, LIBRARY_SYNC_JOB } from '../jobs/jobs.constants';
import { LibrarySyncService } from './library-sync.service';
import { LibrarySyncError } from './library.types';

@Processor(LIBRARY_QUEUE)
export class LibraryProcessor extends WorkerHost {
  private readonly logger = new Logger(LibraryProcessor.name);

  constructor(private readonly librarySync: LibrarySyncService) {
    super();
  }

  async process(
    job: Job<LibrarySyncJobPayload, LibrarySyncJobResult>,
  ): Promise<LibrarySyncJobResult> {
    if (job.name !== LIBRARY_SYNC_JOB) {
      throw new UnrecoverableError(`Unsupported job: ${job.name}`);
    }

    try {
      const result = await this.librarySync.sync(job.data);
      this.logger.log(
        `Synced ${result.importedGames} Steam games for user ${job.data.userId}`,
      );
      return result;
    } catch (error) {
      if (error instanceof LibrarySyncError && !error.retryable) {
        throw new UnrecoverableError(`${error.code}: ${error.message}`);
      }
      throw error;
    }
  }
}
