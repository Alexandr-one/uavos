import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('images')
@UseGuards(AuthGuard('jwt'))
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: new ImagesService().getStorageOptions() }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return {
      url: this.imagesService.getFileUrl(file.filename),
    };
  } 
}
