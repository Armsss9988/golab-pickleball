import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.API_PORT || 3021;
  await app.listen(port);
  console.log(`🏓 Pickleball API started on http://localhost:${port}/api`);
}
bootstrap();
