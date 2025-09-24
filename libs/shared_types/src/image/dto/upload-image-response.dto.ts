import { ValidationResult } from '../../validation-result';

export class UploadImageResponseDto {
    constructor(
      public url: string,
      public path?: string,
      public filename?: string
    ) {}
  
    validate(): ValidationResult {
      const errors: string[] = [];
  
      if (!this.url || this.url.trim().length === 0) {
        errors.push('url is required');
      }
  
      if (this.url && !/^https?:\/\//.test(this.url)) {
        errors.push('url must be a valid http/https link');
      }
  
      return {
        isValid: errors.length === 0,
        errors,
      };
    }
  }
  