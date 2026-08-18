import { Inject, Injectable } from '@nestjs/common';
import type {
  LibrarySyncJobPayload,
  LibrarySyncJobResult,
} from '@partyqueue/contracts';
import {
  GAMING_PLATFORM_PROVIDER,
  type GamingPlatformProvider,
  LIBRARY_SYNC_REPOSITORY,
  LibrarySyncError,
  type LibrarySyncRepositoryContract,
} from './library.types';

@Injectable()
export class LibrarySyncService {
  constructor(
    @Inject(LIBRARY_SYNC_REPOSITORY)
    private readonly repository: LibrarySyncRepositoryContract,
    @Inject(GAMING_PLATFORM_PROVIDER)
    private readonly provider: GamingPlatformProvider,
  ) {}

  async sync(payload: LibrarySyncJobPayload): Promise<LibrarySyncJobResult> {
    const account = await this.repository.findSteamAccount(
      payload.externalAccountId,
      payload.userId,
    );
    if (!account) {
      throw new LibrarySyncError(
        'INVALID_EXTERNAL_ACCOUNT',
        'The Steam account does not belong to the requested user.',
        false,
      );
    }

    await this.repository.markStatus(account.externalAccountId, 'SYNCING');

    try {
      const result = await this.provider.getOwnedGames(account.externalUserId);
      const persisted = await this.repository.replaceLibrary(account, result);

      return {
        importedGames: persisted.importedGames,
        ignoredEntries: result.ignoredEntries,
        syncedAt: persisted.syncedAt.toISOString(),
      };
    } catch (error) {
      await this.repository.markStatus(
        account.externalAccountId,
        error instanceof LibrarySyncError && error.code === 'PROFILE_PRIVATE'
          ? 'PRIVATE'
          : 'FAILED',
      );
      throw error;
    }
  }
}
