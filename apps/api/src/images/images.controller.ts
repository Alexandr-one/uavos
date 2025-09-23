import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseGuards, 
  UseInterceptors, 
  Body, 
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ImagesService } from './images.service';
import { UploadImageDto, UploadImageResponseDto } from '@uavos/shared-types';

@Controller('images')
@UseGuards(AuthGuard('jwt'))
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: new ImagesService().getStorageOptions() }))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ): Promise<UploadImageResponseDto> {
    const dto = new UploadImageDto(body.articleId);
    const validation = dto.validate();

    if (!validation.isValid) {
      throw new BadRequestException(validation.errors);
    }

    const response = new UploadImageResponseDto(
      this.imagesService.getFileUrl(file.filename),
    );

    return response;
  }
}
