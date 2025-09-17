import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  
  @Controller('images')
  export class ImagesController {
    @Post('upload')
    @UseInterceptors(
      FileInterceptor('file', {
        storage: diskStorage({
          destination: './uploads/tmp',
          filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            callback(null, uniqueSuffix + extname(file.originalname));
          },
        }),
      }),
    )
    uploadImage(@UploadedFile() file: Express.Multer.File) {
      return {
        url: `http://localhost:3003/uploads/tmp/${file.filename}`,
      };
    }
  }
  