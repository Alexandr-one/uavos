import { Controller, Post, Body, HttpException, HttpStatus, Get } from '@nestjs/common';
import { DeploymentService } from './deployment.service';

@Controller('api/deploy')
export class DeploymentController {
    constructor(private readonly deploymentService: DeploymentService) { }

    @Post('preview')
    async createPreview() {
        try {
            const result = await this.deploymentService.createPreview();
            if (!result.success) {
                throw new HttpException(result.message, HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return result;
        } catch (error) {
            throw new HttpException(
                error.message || 'Preview deployment failed',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('publish')
    async publish() {
        try {
            const result = await this.deploymentService.publish();
            if (!result.success) {
                throw new HttpException(result.message, HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return result;
        } catch (error) {
            throw new HttpException(
                error.message || 'Publish failed',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('rollback')
    async rollback(@Body('tag') tag: string) {
        try {
            if (!tag) {
                throw new HttpException('Tag is required for rollback', HttpStatus.BAD_REQUEST);
            }

            const result = await this.deploymentService.rollback(tag);
            if (!result.success) {
                throw new HttpException(result.message, HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return result;
        } catch (error) {
            throw new HttpException(error.message || 'Rollback failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('tags')
    async getTags() {
        try {
            const tags = await this.deploymentService.showTags();
            return { success: true, tags }; 
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch tags',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

}
