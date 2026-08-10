import type { QueueName, SystemJobName } from '@partyqueue/contracts';

export const SYSTEM_QUEUE = 'system' satisfies QueueName;
export const SYSTEM_PING_JOB = 'system.ping' satisfies SystemJobName;
