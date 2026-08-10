import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('ping')
  @HttpCode(HttpStatus.ACCEPTED)
  enqueuePing() {
    return this.jobsService.enqueuePing();
  }
}
