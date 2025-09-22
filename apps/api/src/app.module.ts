import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { DeploymentModule } from './deployment/deployment.module';
import { GitSyncService, GitService } from '@uavos/scripts';
import { ImagesModule } from './images/images.module';
import { ContentModule } from './content/content.module';

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
    DeploymentModule,
    ImagesModule,
    AuthModule,
    ContentModule
  ],
  controllers: [],
  providers: [GitService, GitSyncService],
})
export class AppModule { }