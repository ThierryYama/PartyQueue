import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { LIBRARY_QUEUE, SYSTEM_QUEUE } from './jobs.constants';
import { JobsService } from './jobs.service';
import { getRedisConnection } from './redis-connection';

@Module({
  imports: [
    BullModule.forRoot({
      connection: getRedisConnection(),
      prefix: 'partyqueue',
    }),
    BullModule.registerQueue({
      name: SYSTEM_QUEUE,
    }),
    BullModule.registerQueue({
      name: LIBRARY_QUEUE,
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
