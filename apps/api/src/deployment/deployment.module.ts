import { Module } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { DeploymentController } from './deployment.controller';
import { GitService } from 'src/git/git.service';

@Module({
  imports: [],
  controllers: [DeploymentController],
  providers: [DeploymentService, GitService],
  exports: [DeploymentService],
})
export class DeploymentModule { }