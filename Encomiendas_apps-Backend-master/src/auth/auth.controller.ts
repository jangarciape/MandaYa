
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ValidationPipe,
} from '@nestjs/common';

import {
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  AuthService,
} from './auth.service.js';

import {
  LoginAuthDto,
} from './dto/login-auth.dto.js';

import {
  RegisterAuthDto,
} from './dto/register-auth.dto.js';
import { GoogleLoginDto } from '../users/dto/google-login.dto.js';
import { GoogleLinkDto } from '../users/dto/google-link.dto.js';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService:
      AuthService,
  ) {}

  @ApiOperation({
    summary:
      'Registrar cliente',
    description:
      'Registra un usuario con rol CLIENTE automáticamente.',
  })
  @ApiBody({
    type:
      RegisterAuthDto,
  })
  @Post('register')
  register(
    @Body()
    user:
      RegisterAuthDto,
  ) {

    return this.authService
      .register(
        user,
      );

  }

  @ApiOperation({
    summary:
      'Crear primer administrador',
    description:
      'Solo funciona si todavía no existe ningún usuario ADMINISTRADOR.',
  })
  @ApiBody({
    type:
      RegisterAuthDto,
  })
  @Post('bootstrap-admin')
  bootstrapAdmin(
    @Body()
    user:
      RegisterAuthDto,
  ) {

    return this.authService
      .bootstrapAdmin(
        user,
      );

  }

  @ApiOperation({
    summary:
      'Iniciar sesión',
  })
  @ApiBody({
    type:
      LoginAuthDto,
  })
  @Post('login')
  login(
    @Body()
    loginData:
      LoginAuthDto,
  ) {

    return this.authService
      .login(
        loginData,
      );

  }

  @ApiOperation({
    summary:
      'Generar desafío de seguridad para Google',
    description:
      'Genera un nonce de un solo uso para el inicio de sesión con Google.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('google/challenge')
  googleChallenge() {

    return this.authService
      .googleChallenge();

  }

  @ApiOperation({
    summary:
      'Iniciar sesión con Google',
    description:
      'Registra automáticamente a los nuevos usuarios con rol CLIENTE o autentica a los clientes previamente vinculados.',
  })
  @ApiBody({
    type:
      GoogleLoginDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('google')
  googleLogin(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    loginData:
      GoogleLoginDto,
  ) {

    return this.authService
      .googleLogin(
        loginData,
      );

  }

  @ApiOperation({
    summary:
      'Vincular cuenta de Google',
    description:
      'Vincula una cuenta de Google con un cliente existente mediante su contraseña actual de MANDA YA y un nuevo ID Token.',
  })
  @ApiBody({
    type:
      GoogleLinkDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('google/link')
  googleLink(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    linkData:
      GoogleLinkDto,
  ) {

    return this.authService
      .googleLink(
        linkData,
      );

  }

}
