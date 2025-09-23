import { ValidationResult } from '../../validation-result';

export class UploadImageDto {
  constructor(
    public articleId: string,
  ) {}

  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.articleId || this.articleId.trim().length === 0) {
      errors.push('articleId is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
  