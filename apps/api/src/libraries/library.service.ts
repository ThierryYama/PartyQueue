import { Injectable } from '@nestjs/common';
import type { LibraryResponse } from '@partyqueue/contracts';
import { JobsService } from '../jobs/jobs.service';
import { LibraryRepository } from './library.repository';

@Injectable()
export class LibraryService {
  constructor(
    private readonly jobs: JobsService,
    private readonly repository: LibraryRepository,
  ) {}

  async getLibrary(userId: string): Promise<LibraryResponse> {
    const [games, state] = await Promise.all([
      this.repository.listOwnedGames(userId),
      this.resolveSyncState(userId),
    ]);

    return {
      games,
      sync: {
        status: state.status,
        lastSyncedAt: state.lastSyncedAt,
        isStale: state.isStale,
      },
    };
  }

  async getSyncStatus(userId: string) {
    const state = await this.resolveSyncState(userId);
    return {
      status: state.status,
      lastSyncedAt: state.lastSyncedAt,
      isStale: state.isStale,
    };
  }

  async requestSync(userId: string) {
    const state = await this.repository.getSyncState(userId);
    if (state.storedStatus === 'SYNCING') return this.getSyncStatus(userId);

    await this.repository.markPending(state.accountId);
    try {
      await this.jobs.enqueueLibrarySync({
        externalAccountId: state.accountId,
        userId,
      });
    } catch (error) {
      await this.repository.markFailed(state.accountId);
      throw error;
    }

    return this.getSyncStatus(userId);
  }

  private async resolveSyncState(userId: string) {
    const state = await this.repository.getSyncState(userId);
    if (
      !['SYNC_PENDING', 'SYNCING'].includes(state.storedStatus) ||
      !state.isOrphanCheckDue
    ) {
      return state;
    }

    let jobState: string | null = null;
    try {
      jobState = await this.jobs.getLibrarySyncJobState(state.accountId);
    } catch {
      // A fila indisponível também não pode manter a interface presa para sempre.
    }

    const activeStates = [
      'active',
      'delayed',
      'prioritized',
      'waiting',
      'waiting-children',
    ];
    if (jobState && activeStates.includes(jobState)) return state;

    await this.repository.markFailed(state.accountId);
    return this.repository.getSyncState(userId);
  }
}
