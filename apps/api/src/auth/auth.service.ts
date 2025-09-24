import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginResponseDto, UserDto, UserJwtDto } from '@uavos/shared-types';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Validate user
   * 
   * @param username 
   * @param password 
   * @returns UserDto | null
   */
  async validateUser(username: string, password: string): Promise<UserDto | null> {
    const user = await this.usersService.getUserByUsername(username);
    if (user && await bcrypt.compare(password, user.password ?? '')) {
      return user;
    }
    return null;
  }

  /**
   * Login
   * 
   * @param user 
   * @returns LoginResponseDto
   */
  async login(user: UserDto): Promise<LoginResponseDto> {
    const payload: UserJwtDto = {
      username: user.username,
      userId: user.id
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }
}