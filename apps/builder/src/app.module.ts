import { Module } from '@nestjs/common';
import { DeploymentModule } from './deployment/deployment.module';
import { ContentProcessorModule } from './content-processor/content-processor.module';
import { ContentProcessorService } from './content-processor/content-processor.service';
import { DeploymentService } from './deployment/deployment.service';

@Module({
  imports: [
    DeploymentModule,
    ContentProcessorModule
  ],
  controllers: [],
  providers: [ContentProcessorService, DeploymentService],
})
export class AppModule {}
