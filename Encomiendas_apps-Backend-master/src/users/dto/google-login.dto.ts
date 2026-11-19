
import {
  ApiProperty,
} from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class GoogleLoginDto {

  @ApiProperty({
    description:
      'ID Token obtenido de Google Credential Manager',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12000)
  idToken: string;

}
