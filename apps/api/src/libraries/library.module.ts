import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JobsModule } from '../jobs/jobs.module';
import { LibraryController } from './library.controller';
import { LibraryRepository } from './library.repository';
import { LibraryService } from './library.service';

@Module({
  imports: [AuthModule, JobsModule],
  controllers: [LibraryController],
  providers: [LibraryRepository, LibraryService],
})
export class LibraryModule {}
