import { ImageDto } from "../../image/dto/image.dto";

export class ContentFetchDto {
    constructor(
      public id: string,
      public slug: string,
      public title: string,
      public content: string,
      public images?: ImageDto[],
      public extra?: { [key: string]: any },
      public folderPath?: string,
      public metadata?:  { [key: string]: any },
    ) {}
  }