import { z } from 'zod';

export const healthResponseSchema = z.object({
  service: z.string(),
  status: z.literal('ok'),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export type QueueName = 'system' | 'library';

export type SystemJobName = 'system.ping';

export type SystemPingJobPayload = {
  requestedAt: string;
  source: 'api';
};

export type SystemPingJobResult = {
  processedAt: string;
  worker: 'partyqueue-worker';
};

export type LibrarySyncJobName = 'library.sync';

export type LibrarySyncJobPayload = {
  userId: string;
  externalAccountId: string;
};

export type LibrarySyncJobResult = {
  importedGames: number;
  ignoredEntries: number;
  syncedAt: string;
};

export const librarySyncStatusSchema = z.enum([
  'NOT_CONNECTED',
  'SYNC_PENDING',
  'SYNCING',
  'SYNCED',
  'PRIVATE',
  'FAILED',
  'STALE',
]);

export type LibrarySyncStatus = z.infer<typeof librarySyncStatusSchema>;

export const libraryGameSchema = z.object({
  id: z.uuid(),
  steamAppId: z.string(),
  title: z.string(),
  coverUrl: z.url().nullable(),
  fallbackCoverUrl: z.url().nullable(),
  playtimeMinutes: z.number().int().nonnegative(),
  lastPlayedAt: z.iso.datetime().nullable(),
  syncedAt: z.iso.datetime(),
});

export type LibraryGame = z.infer<typeof libraryGameSchema>;

export const libraryResponseSchema = z.object({
  games: z.array(libraryGameSchema),
  sync: z.object({
    status: librarySyncStatusSchema,
    lastSyncedAt: z.iso.datetime().nullable(),
    isStale: z.boolean(),
  }),
});

export type LibraryResponse = z.infer<typeof libraryResponseSchema>;
