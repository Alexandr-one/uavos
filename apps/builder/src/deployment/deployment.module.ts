import { Module } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { ContentProcessorModule } from '../content-processor/content-processor.module';

@Module({
  imports: [ContentProcessorModule],
  controllers: [],
  providers: [DeploymentService],
  exports: [DeploymentService],
})
export class DeploymentModule { }