import { Module } from '@nestjs/common';
import { GitSyncService } from './git-sync.service';

@Module({
  providers: [GitSyncService],
  exports: [GitSyncService],
})
export class GitSyncModule {}