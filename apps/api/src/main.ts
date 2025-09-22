import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GitSyncService } from '@uavos/scripts';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  
  app.enableCors({
    origin: process.env.ADMIN_HOST ?? 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const gitService = app.get(GitSyncService);
  await gitService.syncRepo();

  await app.listen(process.env.API_PORT || 3002);
}
bootstrap();