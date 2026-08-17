import { NestFactory } from '@nestjs/core';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3333);

  app.setGlobalPrefix('api/v1');
  app.use(
    (_request: IncomingMessage, response: ServerResponse, next: () => void) => {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-Frame-Options', 'DENY');
      response.setHeader('Referrer-Policy', 'no-referrer');
      next();
    },
  );
  app.enableCors({
    credentials: true,
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
  });
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
