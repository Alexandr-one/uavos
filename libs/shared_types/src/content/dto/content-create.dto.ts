import { ValidationResult } from '../../validation-result';
import { ImageData } from '../interfaces/content.interface';

export class ContentCreateDto {
  constructor(
    public title: string,
    public content: string,
    public images: ImageData[] = [],
    public category?: string, 
    public author?: string 
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
