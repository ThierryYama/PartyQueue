import assert from 'node:assert/strict';
import test from 'node:test';
import type { LibrarySyncStatus } from '@partyqueue/contracts';
import { LibrarySyncService } from '../library-sync.service';
import type {
  ExternalOwnedGame,
  GamingPlatformProvider,
  LibrarySyncRepositoryContract,
  OwnedGamesResult,
  SteamLibraryAccount,
} from '../library.types';
import { LibrarySyncError } from '../library.types';

const account: SteamLibraryAccount = {
  externalAccountId: 'account-1',
  externalUserId: '76561198000000000',
  userId: 'user-1',
};

const payload = {
  externalAccountId: account.externalAccountId,
  userId: account.userId,
};

const game = {
  externalGameId: '440',
  title: 'Team Fortress 2',
  coverUrl: 'https://cdn.example/440.jpg',
  fallbackCoverUrl: 'https://cdn.example/440-icon.jpg',
  playtimeMinutes: 120,
  lastPlayedAt: null,
};

class FakeRepository implements LibrarySyncRepositoryContract {
  readonly games = new Map<string, ExternalOwnedGame & { owned: boolean }>();
  readonly statuses: LibrarySyncStatus[] = [];
  syncedAt = new Date('2026-08-18T12:00:00.000Z');

  findSteamAccount(externalAccountId: string, userId: string) {
    return Promise.resolve(
      externalAccountId === account.externalAccountId &&
        userId === account.userId
        ? account
        : null,
    );
  }

  markStatus(_externalAccountId: string, status: LibrarySyncStatus) {
    this.statuses.push(status);
    return Promise.resolve();
  }

  replaceLibrary(_account: SteamLibraryAccount, result: OwnedGamesResult) {
    for (const stored of this.games.values()) stored.owned = false;
    for (const item of result.games) {
      this.games.set(item.externalGameId, { ...item, owned: true });
    }
    this.statuses.push('SYNCED');
    return Promise.resolve({
      importedGames: result.games.length,
      syncedAt: this.syncedAt,
    });
  }
}

class FakeProvider implements GamingPlatformProvider {
  constructor(
    private readonly result: OwnedGamesResult | LibrarySyncError = {
      games: [game],
      ignoredEntries: 0,
    },
  ) {}

  getOwnedGames() {
    return this.result instanceof LibrarySyncError
      ? Promise.reject(this.result)
      : Promise.resolve(this.result);
  }
}

function setup(result?: OwnedGamesResult | LibrarySyncError) {
  const repository = new FakeRepository();
  const provider = new FakeProvider(result);
  const service = new LibrarySyncService(repository, provider);
  return { repository, service };
}

void test('syncs a Steam library and reports the persisted result', async () => {
  const { repository, service } = setup();

  const result = await service.sync(payload);

  assert.deepEqual(result, {
    importedGames: 1,
    ignoredEntries: 0,
    syncedAt: '2026-08-18T12:00:00.000Z',
  });
  assert.deepEqual(repository.statuses, ['SYNCING', 'SYNCED']);
  assert.equal(repository.games.get('440')?.owned, true);
});

void test('keeps repeated syncs idempotent and updates ownership', async () => {
  const { repository, service } = setup();

  await service.sync(payload);
  await service.sync(payload);

  assert.equal(repository.games.size, 1);
  assert.equal(repository.games.get('440')?.playtimeMinutes, 120);
});

void test('treats a private profile as a permanent normal state', async () => {
  const error = new LibrarySyncError(
    'PROFILE_PRIVATE',
    'Private library.',
    false,
  );
  const { repository, service } = setup(error);

  await assert.rejects(service.sync(payload), error);
  assert.deepEqual(repository.statuses, ['SYNCING', 'PRIVATE']);
});

void test('marks transient provider timeouts as failed for retry', async () => {
  const error = new LibrarySyncError(
    'PROVIDER_TIMEOUT',
    'Steam timed out.',
    true,
  );
  const { repository, service } = setup(error);

  await assert.rejects(service.sync(payload), error);
  assert.deepEqual(repository.statuses, ['SYNCING', 'FAILED']);
});

void test('rejects an account that does not belong to the user', async () => {
  const { repository, service } = setup();

  await assert.rejects(
    service.sync({ ...payload, userId: 'another-user' }),
    (error: unknown) =>
      error instanceof LibrarySyncError &&
      error.code === 'INVALID_EXTERNAL_ACCOUNT',
  );
  assert.deepEqual(repository.statuses, []);
});
