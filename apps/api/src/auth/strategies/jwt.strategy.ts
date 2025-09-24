import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Get jwt token from header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // with expiration
      ignoreExpiration: false,
      // secret token
      secretOrKey: process.env.SECRET_KEY ?? 'root',
    });
  }

  /**
   * Validation Payload
   * @param payload 
   * @returns 
   */
  async validate(payload: any) {
    return { userId: payload.userId, username: payload.username };
  }
}