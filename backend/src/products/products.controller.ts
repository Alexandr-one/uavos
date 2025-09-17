import { Controller, Post, Get, Param, Body, UseGuards, Req, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '@nestjs/passport';
import { GitService } from '../git/git.service';


@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService, private readonly gitService: GitService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllProducts() {
    try {
      const products = await this.productsService.getAllProducts();
      return {
        success: true,
        data: products,
        count: products.length
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
  async getProduct(@Param('slug') slug: string) {

    try {
      const product = await this.productsService.getProductBySlug(slug);
      return {
        success: true,
        data: product
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
  async pushProduct(@Body() productData: any) {
    try {
      const result = await this.productsService.pushProduct(productData);
      await this.gitService.commitAndPush(`Add product: ${productData.title}`);
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
  async deleteProduct(@Param('slug') slug: string) {
    try {
      const product = await this.productsService.deleteProduct(slug);
      await this.gitService.commitAndPush(`Delete product: ${slug}`);
      return {
        success: true,
        data: product
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
  async updateProduct(@Param('slug') slug: string, @Body() productData: any) {
    try {
      const result = await this.productsService.updateProduct(slug, productData);
      await this.gitService.commitAndPush(`Update product: ${productData.title}`);
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