import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SYSTEM_QUEUE } from './jobs.constants';
import { getRedisConnection } from './redis-connection';
import { SystemProcessor } from './system.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: getRedisConnection(),
      prefix: 'partyqueue',
    }),
    BullModule.registerQueue({
      name: SYSTEM_QUEUE,
    }),
  ],
  providers: [SystemProcessor],
})
export class JobsModule {}
