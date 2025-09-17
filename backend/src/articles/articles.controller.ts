import { Controller, Post, Get, Param, Body, UseGuards, Req, Delete } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { AuthGuard } from '@nestjs/passport';
import { GitService } from '../git/git.service';
import path from 'path';


@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService, private readonly gitService: GitService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllArticles() {
    try {
      const articles = await this.articlesService.getAllArticles();
      return {
        success: true,
        data: articles,
        count: articles.length
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':slug')
  async getArticle(@Param('slug') slug: string) {
    try {
      const article = await this.articlesService.getArticleBySlug(slug);
      return {
        success: true,
        data: article
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('push')
  async pushArticle(@Body() articleData: any) {
    try {
      const result = await this.articlesService.pushArticle(articleData);
      await this.gitService.commitAndPush(`Add article: ${articleData.title}`);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        details: 'Check your GitHub token and repository permissions'
      };
    }
  } 

  @UseGuards(AuthGuard('jwt'))
  @Delete('delete/:slug')
  async deleteArticle(@Param('slug') slug: string) {
    try {
      const article = await this.articlesService.deleteArticle(slug);
      await this.gitService.commitAndPush(`Delete article: ${slug}`);
      return {
        success: true,
        data: article
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('update/:slug')
  async updateArticle(@Param('slug') slug: string, @Body() articleData: any) {
    try {
      const result = await this.articlesService.updateArticle(slug, articleData);
      await this.gitService.commitAndPush(`Update article: ${articleData.title}`);
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