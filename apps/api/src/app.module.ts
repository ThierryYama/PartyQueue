import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { JobsModule } from './jobs/jobs.module';
import { LibraryModule } from './libraries/library.module';

@Module({
  imports: [DatabaseModule, AuthModule, JobsModule, LibraryModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
