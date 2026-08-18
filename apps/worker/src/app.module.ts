import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { JobsModule } from './jobs/jobs.module';
import { LibraryModule } from './library/library.module';

@Module({
  imports: [DatabaseModule, JobsModule, LibraryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
