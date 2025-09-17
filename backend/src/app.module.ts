import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { GitService } from './git/git.service';
import { ArticlesController } from './articles/articles.controller';
import { ImagesController } from './images/images.controller';
import { GitSyncModule } from './git/git-sync/git-sync.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesService } from './articles/articles.service';
import { GitModule } from './git/git.module';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';

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
    AuthModule
  ],
  controllers: [ArticlesController, ProductsController, ImagesController],
  providers: [GitService, ProductsService, ArticlesService],
})
export class AppModule {}