import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@Injectable()
export class ImagesService {
  // Upload dir for temporary files
  private readonly uploadDir = './uploads/tmp';

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Return Storage Options
   * @returns 
   */
  getStorageOptions() {
    return diskStorage({
      destination: this.uploadDir,
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, uniqueSuffix + extname(file.originalname));
      },
    });
  }

  /**
   * 
   * @param filename 
   * @returns string
   */
  getFileUrl(filename: string): string {
    return `${process.env.API_HOST}/uploads/tmp/${filename}`;
  }
}
