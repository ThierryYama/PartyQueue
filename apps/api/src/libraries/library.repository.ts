import { Injectable, NotFoundException } from '@nestjs/common';
import type { LibraryGame, LibrarySyncStatus } from '@partyqueue/contracts';
import { DatabaseService } from '../database/database.service';

const STALE_AFTER_MS = 24 * 60 * 60 * 1_000;
const ORPHANED_SYNC_AFTER_MS = 30_000;

@Injectable()
export class LibraryRepository {
  constructor(private readonly database: DatabaseService) {}

  async getSyncState(userId: string) {
    const account = await this.database.client.externalAccount.findFirst({
      where: { provider: 'STEAM', userId },
      select: {
        id: true,
        librarySyncedAt: true,
        librarySyncStatus: true,
        updatedAt: true,
      },
    });

    if (!account) {
      throw new NotFoundException({
        error: {
          code: 'STEAM_NOT_CONNECTED',
          message: 'Connect a Steam account before syncing a library.',
        },
      });
    }

    const isStale = Boolean(
      account.librarySyncedAt &&
      Date.now() - account.librarySyncedAt.getTime() > STALE_AFTER_MS,
    );
    const status: LibrarySyncStatus =
      account.librarySyncStatus === 'SYNCED' && isStale
        ? 'STALE'
        : account.librarySyncStatus;

    return {
      accountId: account.id,
      status,
      storedStatus: account.librarySyncStatus,
      lastSyncedAt: account.librarySyncedAt?.toISOString() ?? null,
      isStale,
      isOrphanCheckDue:
        Date.now() - account.updatedAt.getTime() > ORPHANED_SYNC_AFTER_MS,
    };
  }

  async markPending(externalAccountId: string) {
    await this.database.client.externalAccount.update({
      where: { id: externalAccountId },
      data: { librarySyncStatus: 'SYNC_PENDING' },
    });
  }

  async markFailed(externalAccountId: string) {
    await this.database.client.externalAccount.update({
      where: { id: externalAccountId },
      data: { librarySyncStatus: 'FAILED' },
    });
  }

  async listOwnedGames(userId: string): Promise<LibraryGame[]> {
    const rows = await this.database.client.userGame.findMany({
      where: { owned: true, platform: 'STEAM', userId },
      select: {
        game: {
          select: {
            coverUrl: true,
            fallbackCoverUrl: true,
            externalMappings: {
              where: { platform: 'STEAM' },
              select: { externalGameId: true },
              take: 1,
            },
            id: true,
            title: true,
          },
        },
        lastPlayedAt: true,
        playtimeMinutes: true,
        syncedAt: true,
      },
    });

    return rows
      .flatMap((row) => {
        const mapping = row.game.externalMappings[0];
        if (!mapping) return [];

        return [
          {
            id: row.game.id,
            steamAppId: mapping.externalGameId,
            title: row.game.title,
            coverUrl: row.game.coverUrl,
            fallbackCoverUrl: row.game.fallbackCoverUrl,
            playtimeMinutes: row.playtimeMinutes,
            lastPlayedAt: row.lastPlayedAt?.toISOString() ?? null,
            syncedAt: row.syncedAt.toISOString(),
          },
        ];
      })
      .sort((left, right) => left.title.localeCompare(right.title, 'pt-BR'));
  }
}
