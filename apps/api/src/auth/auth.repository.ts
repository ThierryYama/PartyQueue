import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { AuthenticatedUser, SteamProfile } from './auth.types';

type UserWithSteamAccount = {
  avatarUrl: string | null;
  displayName: string;
  id: string;
  externalAccounts: Array<{
    externalId: string;
    metadata: unknown;
  }>;
};

function toAuthenticatedUser(user: UserWithSteamAccount): AuthenticatedUser {
  const steam = user.externalAccounts[0];
  if (!steam)
    throw new Error('Steam account is missing from authenticated user.');

  const metadata =
    typeof steam.metadata === 'object' && steam.metadata !== null
      ? (steam.metadata as Record<string, unknown>)
      : {};

  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    steam: {
      id: steam.externalId,
      profileUrl:
        typeof metadata.profileUrl === 'string' ? metadata.profileUrl : null,
    },
  };
}

@Injectable()
export class AuthRepository {
  constructor(private readonly database: DatabaseService) {}

  async findBySteamId(steamId: string) {
    const account = await this.database.client.externalAccount.findUnique({
      where: {
        provider_externalId: { provider: 'STEAM', externalId: steamId },
      },
      select: { userId: true },
    });

    return account?.userId ?? null;
  }

  async refreshUser(userId: string, profile: SteamProfile) {
    const user = await this.database.client.user.update({
      where: { id: userId },
      data: {
        avatarUrl: profile.avatarUrl,
        displayName: profile.displayName,
        externalAccounts: {
          update: {
            where: {
              provider_externalId: {
                provider: 'STEAM',
                externalId: profile.steamId,
              },
            },
            data: {
              metadata: { profileUrl: profile.profileUrl },
              username: profile.displayName,
            },
          },
        },
      },
      include: {
        externalAccounts: { where: { provider: 'STEAM' }, take: 1 },
      },
    });

    return toAuthenticatedUser(user);
  }

  async createUser(profile: SteamProfile) {
    const user = await this.database.client.user.create({
      data: {
        avatarUrl: profile.avatarUrl,
        displayName: profile.displayName,
        externalAccounts: {
          create: {
            externalId: profile.steamId,
            librarySyncStatus: 'SYNC_PENDING',
            metadata: { profileUrl: profile.profileUrl },
            provider: 'STEAM',
            username: profile.displayName,
          },
        },
      },
      include: { externalAccounts: true },
    });

    return toAuthenticatedUser(user);
  }

  async findByUserId(userId: string) {
    const user = await this.database.client.user.findUnique({
      where: { id: userId },
      include: {
        externalAccounts: { where: { provider: 'STEAM' }, take: 1 },
      },
    });

    return user ? toAuthenticatedUser(user) : null;
  }

  async librarySyncTarget(userId: string) {
    const account = await this.database.client.externalAccount.findFirstOrThrow(
      {
        where: { provider: 'STEAM', userId },
        select: {
          id: true,
          librarySyncedAt: true,
          librarySyncStatus: true,
        },
      },
    );
    const staleBefore = Date.now() - 24 * 60 * 60 * 1_000;

    return {
      externalAccountId: account.id,
      shouldSync:
        account.librarySyncStatus !== 'SYNCING' &&
        (!account.librarySyncedAt ||
          account.librarySyncedAt.getTime() < staleBefore),
    };
  }

  async markLibrarySyncFailed(externalAccountId: string) {
    await this.database.client.externalAccount.update({
      where: { id: externalAccountId },
      data: { librarySyncStatus: 'FAILED' },
    });
  }
}
