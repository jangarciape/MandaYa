import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt/jwt.strategy.js';
import { jwtConstants } from './jwt/jwt.constants.js';
import { User } from '../users/user.entity.js';
import { Rol } from '../roles/rol.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Rol,
    ]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', jwtConstants.secret),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN', '6h')) as any,
        },
      }),
    }),
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    AuthService,
    JwtStrategy,
  ],
})
export class AuthModule {}