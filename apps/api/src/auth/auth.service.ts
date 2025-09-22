import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserPayload } from './interfaces/user.interface';

@Injectable()
export class AuthService {
  private users: User[] = [
    {
      id: 1,
      username: 'admin',
      password: '$2b$10$GGp/ES2reQgThEBjsL7NTOWOV0pb3X36y4W49idYx/WFAm41HdrQO',
      email: 'admin@example.com',
    },
  ];
  // console.log(await bcrypt.hash('admin', 10));

  constructor(private jwtService: JwtService) { }

  async validateUser(username: string, password: string): Promise<any> {
    const user = this.users.find(u => u.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload: UserPayload = {
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