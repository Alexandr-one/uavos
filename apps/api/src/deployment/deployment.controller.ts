import { Controller, Post, Body, HttpException, HttpStatus, UseGuards, Get } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('deploy')
@UseGuards(AuthGuard('jwt'))
export class DeploymentController {
    constructor(private readonly deploymentService: DeploymentService) { }

    @Get('preview-status')
    async getPreviewStatus() {
        try {
            const status = await this.deploymentService.previewStatus();
            return { success: true, ...status };
        } catch (error) {
            throw new HttpException(error.message || 'Failed to get preview status', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('preview-start')
    async startPreview() {
        try {
            const result = await this.deploymentService.previewStart();
            if (!result.success) throw new HttpException(result.message, HttpStatus.INTERNAL_SERVER_ERROR);
            return result;
        } catch (error) {
            throw new HttpException(error.message || 'Failed to start preview', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('preview-stop')
    async stopPreview() {
        try {
            const result = await this.deploymentService.previewStop();
            if (!result.success) throw new HttpException(result.message, HttpStatus.INTERNAL_SERVER_ERROR);
            return result;
        } catch (error) {
            throw new HttpException(error.message || 'Failed to stop preview', HttpStatus.INTERNAL_SERVER_ERROR);
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

    @Get('status')
    async getStatus() {
        return this.deploymentService.getStatus();
    }

}
