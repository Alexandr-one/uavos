import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { DeploymentModule } from './deployment/deployment.module';
import { GitSyncService, GitService } from '@uavos/scripts';
import { ImagesModule } from './images/images.module';
import { ContentModule } from './content/content.module';
import { ThrottlerModule } from '@nestjs/throttler';

/**
 * Main application module - root module that imports all feature modules
 */
@Module({
  imports: [
    // Rate limiting configuration
    ThrottlerModule.forRoot([{
      ttl: 60,        // Time window in seconds
      limit: 5,       // Max requests per window
    }]),

    // Serve static files from uploads directory
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Serve static files from content directory  
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'content'),
      serveRoot: '/content',
    }),

    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Feature modules
    DeploymentModule,
    ImagesModule,
    AuthModule,
    ContentModule
  ],
  
  controllers: [],
  
  // Global services
  providers: [GitService, GitSyncService],
})
export class AppModule { }