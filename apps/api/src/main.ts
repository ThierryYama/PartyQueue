import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3333);

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    credentials: true,
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
  });
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
