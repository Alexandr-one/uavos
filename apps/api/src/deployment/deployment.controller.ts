import { Controller, Post, Body, HttpException, HttpStatus, UseGuards, Get } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { AuthGuard } from '@nestjs/passport';
import { DeploymentResponseDto, DeploymentStatusRequestDto } from '@uavos/shared-types';

@Controller('deploy')
@UseGuards(AuthGuard('jwt'))
export class DeploymentController {
    constructor(private readonly deploymentService: DeploymentService) { }

    /**
     * Trying to get 
     * @returns DeploymentResponseDto
     */
    @Get('preview-status')
    async previewStatus(): Promise<DeploymentResponseDto> {
        try {
            return await this.deploymentService.previewStatus();
        } catch (error) {
            throw new HttpException(error.message || 'Failed to get preview status', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Trying to start preview
     * @returns DeploymentResponseDto
     */
    @Post('preview-start')
    async previewStart():  Promise<DeploymentResponseDto> {
        try {
            const result = await this.deploymentService.previewStart();
            if (!result.success) throw new HttpException(result.message ?? 'error', HttpStatus.INTERNAL_SERVER_ERROR);
            
            return result;
        } catch (error) {
            throw new HttpException(error.message || 'Failed to start preview', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Stop Current Preview
     * @returns 
     */
    @Post('preview-stop')
    async previewStop() {
        try {
            const result = await this.deploymentService.previewStop();
            if (!result.success) throw new HttpException(result.message ?? 'error', HttpStatus.INTERNAL_SERVER_ERROR);
            return result;
        } catch (error) {
            throw new HttpException(error.message || 'Failed to stop preview', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Publish tag
     * @returns DeploymentResponseDto
     */
    @Post('publish')
    async publish(): Promise<DeploymentResponseDto> {
        try {
            const result = await this.deploymentService.publish();
            if (!result.success) {
                throw new HttpException(result.message ?? 'error', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return result;
        } catch (error) {
            throw new HttpException(
                error.message || 'Publish failed',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Rollback 
     * @param tag 
     * @returns DeploymentResponseDto
     */
    @Post('rollback')
    async rollback(@Body('tag') tag: string): Promise<DeploymentResponseDto> {
        try {
            if (!tag) {
                throw new HttpException('Tag is required for rollback', HttpStatus.BAD_REQUEST);
            }

            const result = await this.deploymentService.rollback(tag);
            if (!result.success) {
                throw new HttpException(result.message ?? 'error', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return result;
        } catch (error) {
            throw new HttpException(error.message || 'Rollback failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all tags
     * @returns 
     */
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

    /**
     * Get Current Workflow Status
     * @returns DeploymentStatusRequestDto
     */
    @Get('status')
    async getStatus(): Promise<DeploymentStatusRequestDto>  {
        return this.deploymentService.getStatus();
    }
}
