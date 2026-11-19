
import {
  ApiProperty,
} from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

import {
  GoogleLoginDto,
} from './google-login.dto.js';

export class GoogleLinkDto extends GoogleLoginDto {

  @ApiProperty({
    description:
      'Contraseña actual de MANDA YA',
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;

}
