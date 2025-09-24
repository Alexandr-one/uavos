export class ImageDto {
    constructor(
        public url: string,
        public path?: string,
        public filename?: string,
        public originalName?: string,
    ) {}
  }