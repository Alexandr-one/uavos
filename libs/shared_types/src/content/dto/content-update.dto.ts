import { ImageDto } from '../../image/dto/image.dto';
import { ValidationResult } from '../../validation-result';

export class ContentUpdateDto {
  constructor(
    public title: string,
    public content: string,
    public images: ImageDto[] = [],
  ) {}

  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.title || this.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }

    if (!this.content || this.content.trim().length < 10) {
      errors.push('Content must be at least 10 characters long');
    }

    return { isValid: errors.length === 0, errors };
  }
}
