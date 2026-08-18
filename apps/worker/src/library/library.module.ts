import { Module } from '@nestjs/common';
import { LibraryProcessor } from './library.processor';
import { LibraryRepository } from './library.repository';
import { LibrarySyncService } from './library-sync.service';
import {
  GAMING_PLATFORM_PROVIDER,
  LIBRARY_SYNC_REPOSITORY,
} from './library.types';
import { SteamLibraryProvider } from './steam-library.provider';

@Module({
  providers: [
    LibraryProcessor,
    LibrarySyncService,
    SteamLibraryProvider,
    LibraryRepository,
    {
      provide: GAMING_PLATFORM_PROVIDER,
      useExisting: SteamLibraryProvider,
    },
    {
      provide: LIBRARY_SYNC_REPOSITORY,
      useExisting: LibraryRepository,
    },
  ],
})
export class LibraryModule {}
