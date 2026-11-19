import {
  Injectable,
} from '@nestjs/common';
import {
  PassportStrategy,
} from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';
import {
  jwtConstants,
} from './jwt.constants.js';

@Injectable()
export class JwtStrategy
  extends PassportStrategy(Strategy) {

  constructor(
    config: ConfigService,
  ) {

    super({

      jwtFromRequest:
        ExtractJwt
          .fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey:
        config.get<string>('JWT_SECRET', 'manda_ya_security_key_2026'),

    });
  }

  async validate(
    payload: any,
  ) {

    return {

      userId:
        payload.id,

      name:
        payload.name,

      email:
        payload.email,

      role:
        payload.role,

      sedeId:
        payload.sedeId ?? null,

    };
  }
}