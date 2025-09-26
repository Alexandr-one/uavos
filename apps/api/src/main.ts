import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GitSyncService } from './git/git-sync/git-sync.service';

config({ path: join(__dirname, '../../../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  
  // const config = new DocumentBuilder()
  //   .setTitle('UAVOS API')
  //   .setDescription('API documentation for UAVOS project')
  //   .setVersion('1.0')
  //   .addBearerAuth()
  //   .build();

  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api-docs', app, document);

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