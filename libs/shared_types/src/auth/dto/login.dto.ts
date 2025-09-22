export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class LoginDto {
  constructor(
    public username: string,
    public password: string
  ) {}

  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.username || this.username.trim().length === 0) {
      errors.push('Username is required');
    }

    if (!this.password || this.password.length === 0) {
      errors.push('Password is required');
    }

    if (this.username && this.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (this.password && this.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}