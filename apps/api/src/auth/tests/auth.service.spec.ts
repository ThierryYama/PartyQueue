import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthRepository } from '../auth.repository';
import { AuthService } from '../auth.service';
import type { AuthenticatedUser, SteamProfile } from '../auth.types';

const profile: SteamProfile = {
  steamId: '76561198000000000',
  displayName: 'Queue Player',
  avatarUrl: 'https://avatars.steamstatic.com/example_full.jpg',
  profileUrl: 'https://steamcommunity.com/id/queue-player/',
};

class FakeAuthRepository {
  created = 0;
  refreshed = 0;
  steamUserId: string | null = null;

  findBySteamId() {
    return Promise.resolve(this.steamUserId);
  }

  createUser(input: SteamProfile) {
    this.created += 1;
    this.steamUserId = 'new-user';
    return Promise.resolve(this.user('new-user', input));
  }

  refreshUser(userId: string, input: SteamProfile) {
    this.refreshed += 1;
    return Promise.resolve(this.user(userId, input));
  }

  findByUserId() {
    return Promise.resolve(null);
  }

  private user(userId: string, input: SteamProfile): AuthenticatedUser {
    return {
      id: userId,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      steam: { id: input.steamId, profileUrl: input.profileUrl },
    };
  }
}

function setup(existingUserId: string | null = null) {
  const repository = new FakeAuthRepository();
  repository.steamUserId = existingUserId;
  const service = new AuthService(repository as unknown as AuthRepository);
  return { repository, service };
}

void test('creates a PartyQueue user for a new Steam identity', async () => {
  const { repository, service } = setup();

  const user = await service.signInWithSteam(profile);

  assert.equal(user.id, 'new-user');
  assert.equal(repository.created, 1);
  assert.equal(repository.refreshed, 0);
});

void test('reuses and refreshes an existing PartyQueue user', async () => {
  const { repository, service } = setup('existing-user');

  const user = await service.signInWithSteam(profile);

  assert.equal(user.id, 'existing-user');
  assert.equal(repository.created, 0);
  assert.equal(repository.refreshed, 1);
});

void test('keeps account linking idempotent across repeated logins', async () => {
  const { repository, service } = setup();

  await service.signInWithSteam(profile);
  await service.signInWithSteam(profile);

  assert.equal(repository.created, 1);
  assert.equal(repository.refreshed, 1);
});
