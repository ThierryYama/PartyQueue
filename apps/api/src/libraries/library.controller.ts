import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { SessionService, type SessionRequest } from '../auth/session.service';
import { LibraryService } from './library.service';

@Controller('me/library')
export class LibraryController {
  constructor(
    private readonly library: LibraryService,
    private readonly session: SessionService,
  ) {}

  @Get()
  getLibrary(@Req() request: SessionRequest) {
    return this.library.getLibrary(this.session.authenticatedUserId(request));
  }

  @Get('sync-status')
  getSyncStatus(@Req() request: SessionRequest) {
    return this.library.getSyncStatus(
      this.session.authenticatedUserId(request),
    );
  }

  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  requestSync(@Req() request: SessionRequest) {
    return this.library.requestSync(this.session.authenticatedUserId(request));
  }
}
