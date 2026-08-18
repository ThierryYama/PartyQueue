import type { LibrarySyncStatus } from '@partyqueue/contracts';

export type ExternalOwnedGame = {
  externalGameId: string;
  title: string;
  coverUrl: string | null;
  fallbackCoverUrl: string | null;
  playtimeMinutes: number;
  lastPlayedAt: Date | null;
};

export type OwnedGamesResult = {
  games: ExternalOwnedGame[];
  ignoredEntries: number;
};

export type SteamLibraryAccount = {
  externalAccountId: string;
  externalUserId: string;
  userId: string;
};

export interface GamingPlatformProvider {
  getOwnedGames(externalUserId: string): Promise<OwnedGamesResult>;
}

export interface LibrarySyncRepositoryContract {
  findSteamAccount(
    externalAccountId: string,
    userId: string,
  ): Promise<SteamLibraryAccount | null>;
  markStatus(
    externalAccountId: string,
    status: LibrarySyncStatus,
  ): Promise<void>;
  replaceLibrary(
    account: SteamLibraryAccount,
    result: OwnedGamesResult,
  ): Promise<{ importedGames: number; syncedAt: Date }>;
}

export const GAMING_PLATFORM_PROVIDER = Symbol('GAMING_PLATFORM_PROVIDER');
export const LIBRARY_SYNC_REPOSITORY = Symbol('LIBRARY_SYNC_REPOSITORY');

export type LibrarySyncErrorCode =
  | 'INVALID_EXTERNAL_ACCOUNT'
  | 'PROFILE_PRIVATE'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_UNAVAILABLE'
  | 'INVALID_PROVIDER_RESPONSE'
  | 'INVALID_CONFIGURATION';

export class LibrarySyncError extends Error {
  constructor(
    readonly code: LibrarySyncErrorCode,
    message: string,
    readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'LibrarySyncError';
  }
}
