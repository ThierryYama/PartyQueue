import assert from 'node:assert/strict';
import test from 'node:test';
import type { JobsService } from '../../jobs/jobs.service';
import type { LibraryRepository } from '../library.repository';
import { LibraryService } from '../library.service';

type StoredStatus = 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

class FakeJobsService {
  jobState: string | null = null;

  getLibrarySyncJobState() {
    return Promise.resolve(this.jobState);
  }

  enqueueLibrarySync() {
    return Promise.resolve({
      jobId: 'library-sync-account-1',
      name: 'library.sync',
      status: 'queued',
    });
  }
}

class FakeLibraryRepository {
  status: StoredStatus = 'SYNC_PENDING';
  orphanCheckDue = true;

  getSyncState() {
    return Promise.resolve({
      accountId: 'account-1',
      status: this.status,
      storedStatus: this.status,
      lastSyncedAt: null,
      isStale: false,
      isOrphanCheckDue: this.orphanCheckDue,
    });
  }

  listOwnedGames() {
    return Promise.resolve([]);
  }

  markFailed() {
    this.status = 'FAILED';
    return Promise.resolve();
  }

  markPending() {
    this.status = 'SYNC_PENDING';
    return Promise.resolve();
  }
}

function setup() {
  const jobs = new FakeJobsService();
  const repository = new FakeLibraryRepository();
  const service = new LibraryService(
    jobs as unknown as JobsService,
    repository as unknown as LibraryRepository,
  );
  return { jobs, repository, service };
}

void test('marks an old pending sync as failed when its BullMQ job is missing', async () => {
  const { repository, service } = setup();

  const library = await service.getLibrary('user-1');

  assert.equal(repository.status, 'FAILED');
  assert.equal(library.sync.status, 'FAILED');
});

void test('keeps pending while an active BullMQ job still exists', async () => {
  const { jobs, repository, service } = setup();
  jobs.jobState = 'active';

  const status = await service.getSyncStatus('user-1');

  assert.equal(repository.status, 'SYNC_PENDING');
  assert.equal(status.status, 'SYNC_PENDING');
});

void test('allows a new pending request its queueing grace period', async () => {
  const { repository, service } = setup();
  repository.orphanCheckDue = false;

  const status = await service.getSyncStatus('user-1');

  assert.equal(repository.status, 'SYNC_PENDING');
  assert.equal(status.status, 'SYNC_PENDING');
});
