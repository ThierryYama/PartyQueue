import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  getHealth() {
    return {
      service: 'partyqueue-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    } as const;
  }
}
