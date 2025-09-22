import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { GitService } from '@uavos/scripts';

@Module({
  imports: [],
  controllers: [ContentController],
  providers: [ContentService, GitService],
  exports: [ContentService],
})
export class ContentModule {}
