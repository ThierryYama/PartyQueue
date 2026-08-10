import { z } from 'zod';

export const healthResponseSchema = z.object({
  service: z.string(),
  status: z.literal('ok'),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export type QueueName = 'system';

export type SystemJobName = 'system.ping';

export type SystemPingJobPayload = {
  requestedAt: string;
  source: 'api';
};

export type SystemPingJobResult = {
  processedAt: string;
  worker: 'partyqueue-worker';
};
