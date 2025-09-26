// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { DeploymentService } from './deployment/deployment.service';
import { resolve } from 'path';

dotenv.config({ path: '.env' });

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const helloService = appContext.get(DeploymentService);
  console.log('Стартуем публикацию');
  helloService.publish();
  await appContext.close();
}

bootstrap();
