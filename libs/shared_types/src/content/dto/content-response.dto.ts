import { ValidationResult } from '../../validation-result';

export class ContentResponseDto {
  constructor(
    public title: string,
    public slug: string,
    public body: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.title) errors.push('title is missing');
    if (!this.slug) errors.push('slug is missing');
    if (!this.body) errors.push('body is missing');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
