import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  createDatabaseClient,
  type DatabaseClient,
} from '@partyqueue/database';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly client: DatabaseClient = createDatabaseClient();

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
