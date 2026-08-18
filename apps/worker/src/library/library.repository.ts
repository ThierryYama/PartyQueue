import { Injectable } from '@nestjs/common';
import type { LibrarySyncStatus } from '@partyqueue/contracts';
import { DatabaseService } from '../database/database.service';
import type {
  LibrarySyncRepositoryContract,
  OwnedGamesResult,
  SteamLibraryAccount,
} from './library.types';

function gameSlug(title: string, externalGameId: string) {
  const titlePart = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return `${titlePart || 'steam-game'}-${externalGameId}`;
}

@Injectable()
export class LibraryRepository implements LibrarySyncRepositoryContract {
  constructor(private readonly database: DatabaseService) {}

  async findSteamAccount(externalAccountId: string, userId: string) {
    const account = await this.database.client.externalAccount.findFirst({
      where: {
        id: externalAccountId,
        provider: 'STEAM',
        userId,
      },
      select: { externalId: true, id: true, userId: true },
    });

    return account
      ? {
          externalAccountId: account.id,
          externalUserId: account.externalId,
          userId: account.userId,
        }
      : null;
  }

  async markStatus(externalAccountId: string, status: LibrarySyncStatus) {
    await this.database.client.externalAccount.update({
      where: { id: externalAccountId },
      data: { librarySyncStatus: status },
    });
  }

  async replaceLibrary(account: SteamLibraryAccount, result: OwnedGamesResult) {
    const syncedAt = new Date();

    await this.database.client.$transaction(async (transaction) => {
      await transaction.userGame.updateMany({
        where: {
          owned: true,
          platform: 'STEAM',
          userId: account.userId,
        },
        data: { owned: false, syncedAt },
      });

      for (const ownedGame of result.games) {
        const mapping = await transaction.gameExternalMapping.findUnique({
          where: {
            platform_externalGameId: {
              externalGameId: ownedGame.externalGameId,
              platform: 'STEAM',
            },
          },
          select: { gameId: true },
        });

        const game = mapping
          ? await transaction.game.update({
              where: { id: mapping.gameId },
              data: {
                coverUrl: ownedGame.coverUrl,
                fallbackCoverUrl: ownedGame.fallbackCoverUrl,
                title: ownedGame.title,
              },
              select: { id: true },
            })
          : await transaction.game.create({
              data: {
                coverUrl: ownedGame.coverUrl,
                fallbackCoverUrl: ownedGame.fallbackCoverUrl,
                externalMappings: {
                  create: {
                    externalGameId: ownedGame.externalGameId,
                    platform: 'STEAM',
                  },
                },
                slug: gameSlug(ownedGame.title, ownedGame.externalGameId),
                title: ownedGame.title,
              },
              select: { id: true },
            });

        await transaction.userGame.upsert({
          where: {
            userId_gameId_platform: {
              gameId: game.id,
              platform: 'STEAM',
              userId: account.userId,
            },
          },
          create: {
            gameId: game.id,
            lastPlayedAt: ownedGame.lastPlayedAt,
            owned: true,
            platform: 'STEAM',
            playtimeMinutes: ownedGame.playtimeMinutes,
            syncedAt,
            userId: account.userId,
          },
          update: {
            lastPlayedAt: ownedGame.lastPlayedAt,
            owned: true,
            playtimeMinutes: ownedGame.playtimeMinutes,
            syncedAt,
          },
        });
      }

      await transaction.externalAccount.update({
        where: { id: account.externalAccountId },
        data: {
          librarySyncedAt: syncedAt,
          librarySyncStatus: 'SYNCED',
        },
      });
    });

    return { importedGames: result.games.length, syncedAt };
  }
}
