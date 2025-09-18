import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { GitService } from './git/git.service';
import { ContentController } from './content/content.controller';
import { ImagesController } from './images/images.controller';
import { GitSyncModule } from './git/git-sync/git-sync.module';
import { AuthModule } from './auth/auth.module';
import { ContentService } from './content/content.service';
import { GitModule } from './git/git.module';
import { ContentProcessorModule } from './content-processor/content-processor.module';
import { DeploymentModule } from './deployment/deployment.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'content'),
      serveRoot: '/content',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GitSyncModule,
    GitModule,
    DeploymentModule,
    ContentProcessorModule,
    AuthModule
  ],
  controllers: [ContentController, ImagesController],
  providers: [GitService, ContentService],
})
export class AppModule { }