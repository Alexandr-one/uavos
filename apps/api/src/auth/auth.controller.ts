import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '@uavos/shared-types';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Login
   * @param loginDto 
   * @returns 
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      return { message: 'Invalid credentials' };
    }
    return this.authService.login(user);
  }

  /**
   * Check current User
   * @param req 
   * @returns 
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('check')
  checkAuth(@Request() req) {
    return { valid: true, user: req.user };
  }
}