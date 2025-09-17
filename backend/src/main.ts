import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GitSyncService } from './git/git-sync/git-sync.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const gitService = app.get(GitSyncService);
  await gitService.syncRepo();

  await app.listen(3003);
  console.log('Backend running on http://localhost:3003');
}
bootstrap();