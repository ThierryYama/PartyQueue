import type {
  LibrarySyncJobName,
  QueueName,
  SystemJobName,
} from '@partyqueue/contracts';

export const SYSTEM_QUEUE = 'system' satisfies QueueName;
export const SYSTEM_PING_JOB = 'system.ping' satisfies SystemJobName;
export const LIBRARY_QUEUE = 'library' satisfies QueueName;
export const LIBRARY_SYNC_JOB = 'library.sync' satisfies LibrarySyncJobName;
