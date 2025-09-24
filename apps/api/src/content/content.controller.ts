import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContentService } from './content.service';
import { GitService } from '@uavos/scripts';

import {
  ContentUpdateDto,
  ContentCreateDto,
  ContentResponseDto,
  ContentFetchDto,
  ContentObjectDto,
} from '@uavos/shared-types';

/**
 * Controller for managing content.
 * All routes are protected with JWT authentication.
 */
@Controller('content')
@UseGuards(AuthGuard('jwt'))
export class ContentController {
  constructor(
    private readonly contentService: ContentService, // Service handling content operations
    private readonly gitService: GitService,         // Service for Git operations (commit & push)
  ) {}

  /**
   * Get all content items.
   * @returns ContentResponseDto<any[]>
   */
  @Get()
  async getAllContent(): Promise<ContentResponseDto<ContentFetchDto[]>> {
    try {
      const contentItems = await this.contentService.getAllContent();
      return new ContentResponseDto(true, contentItems, undefined, contentItems.length);
    } catch (error) {
      return new ContentResponseDto(false, [], error.message);
    }
  }

  /**
   * Get a single content item by its slug.
   * @param slug unique identifier of the content
   * @returns ContentResponseDto<any>
   */
  @Get(':slug')
  async getContent(@Param('slug') slug: string): Promise<ContentResponseDto<ContentFetchDto|null>> {
    try {
      const content = await this.contentService.getContentBySlug(slug);
      return new ContentResponseDto(true, content);
    } catch (error) {
      return new ContentResponseDto(false, null, error.message);
    }
  }

  /**
   * Create and push new content.
   * Input is validated using ContentCreateDto.
   * @param contentData new content data
   * @returns ContentResponseDto<any>
   */
  @Post('push')
  async pushContent(@Body() contentData: any): Promise<ContentResponseDto<ContentObjectDto|null>> {
    try {
      // Wrap request data into DTO
      const dto = new ContentCreateDto(
        contentData.title,
        contentData.content,
        contentData.images,
        contentData.category,
        contentData.author,
      );

      // Validate DTO
      const validation = dto.validate();
      if (!validation.isValid) {
        throw new BadRequestException(validation.errors);
      }

      // Save content and push to Git
      const result = await this.contentService.pushContent(dto);
      await this.gitService.commitAndPush(`Add content: ${dto.title}`);

      return new ContentResponseDto(true, result);
    } catch (error) {
      return new ContentResponseDto(false, null, error.message);
    }
  }

  /**
   * Delete content by slug.
   * @param slug unique identifier of the content
   * @returns
   */
  @Delete('delete/:slug')
  async deleteContent(@Param('slug') slug: string): Promise<ContentResponseDto<string>> {
    try {
      await this.contentService.deleteContent(slug);
      await this.gitService.commitAndPush(`Delete content: ${slug}`);

      return new ContentResponseDto(true, `Content "${slug}" deleted successfully`);
    } catch (error) {
      return new ContentResponseDto(false, error.message);
    }
  }

  /**
   * Update content by slug.
   * Input is validated using ContentUpdateDto.
   * @param slug unique identifier of the content
   * @param contentData updated content data
   * @returns ContentResponseDto<any>
   */
  @Post('update/:slug')
  async updateContent(
    @Param('slug') slug: string,
    @Body() contentData: any,
  ): Promise<ContentResponseDto<ContentObjectDto|null>> {
    const dto = new ContentUpdateDto(contentData.title, contentData.content, contentData.images);

    // Validate DTO
    const validation = dto.validate();
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors);
    }

    try {
      // Update content and push to Git
      const result = await this.contentService.updateContent(slug, dto);
      await this.gitService.commitAndPush(`Update content: ${dto.title}`);

      return new ContentResponseDto(true, result);
    } catch (error) {
      return new ContentResponseDto(false, null, error.message);
    }
  }
}
