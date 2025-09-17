import { Module } from '@nestjs/common';
import { GitService } from './git.service';
import { ContentProcessorModule } from 'src/content-processor/content-processor.module';

@Module({
  imports: [ContentProcessorModule],
  providers: [GitService],
  exports: [GitService],
})
export class GitModule {}