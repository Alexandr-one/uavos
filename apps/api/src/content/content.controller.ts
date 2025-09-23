import { Controller, Post, Get, Param, Body, UseGuards, Req, Delete } from '@nestjs/common';
import { ContentService } from './content.service';
import { AuthGuard } from '@nestjs/passport';
import { GitService } from '@uavos/scripts';

@Controller('content')
@UseGuards(AuthGuard('jwt'))
export class ContentController {
  constructor(private readonly contentService: ContentService, private readonly gitService: GitService) { }

  @Get()
  async getAllContent() {
    try {
      const contentItems = await this.contentService.getAllContent();
      return {
        success: true,
        data: contentItems,
        count: contentItems.length
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  @Get(':slug')
  async getContent(@Param('slug') slug: string) {
    try {
      const content = await this.contentService.getContentBySlug(slug);
      return {
        success: true,
        data: content
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Post('push')
  async pushContent(@Body() contentData: any) {
    try {
      const result = await this.contentService.pushContent(contentData);
      await this.gitService.commitAndPush(`Add content: ${contentData.title}`);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        details: 'Check your GitHub token and repository permissions'
      };
    }
  }

  @Delete('delete/:slug')
  async deleteContent(@Param('slug') slug: string) {
    try {
      const content = await this.contentService.deleteContent(slug);
      await this.gitService.commitAndPush(`Delete content: ${slug}`);
      return {
        success: true,
        data: content
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Post('update/:slug')
  async updateContent(@Param('slug') slug: string, @Body() contentData: any) {
    try {
      const result = await this.contentService.updateContent(slug, contentData);
      await this.gitService.commitAndPush(`Update content: ${contentData.title}`);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        details: 'Check your GitHub token and repository permissions'
      };
    }
  }
}