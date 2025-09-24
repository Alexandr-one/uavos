export class ContentObjectDto {
    constructor(
      public success: boolean,
      public message: string,
      public folderPath?: string,
    ) {}
  }