import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import {
  ReportesService,
} from './reportes.service.js';

import {
  HasRoles,
} from '../auth/jwt/has-roles.js';

import {
  JwtRole,
} from '../auth/jwt/jwt-role.js';

import {
  JwtAuthGuard,
} from '../auth/jwt/jwt.guard.js';

import {
  JwtRolesGuard,
} from '../auth/jwt/jwt-roles.guard.js';

@ApiTags('Reportes')
@ApiBearerAuth('access-token')
@Controller('reportes')
export class ReportesController {

  constructor(
    private readonly reportesService:
      ReportesService,
  ) {}

  @Get('operativos')
  @HasRoles(JwtRole.ADMINISTRADOR)
  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @ApiOperation({ summary: 'Consultar encomiendas por fecha de registro y sede de origen' })
  @ApiQuery({ name: 'fecha', example: '2026-11-24', required: true })
  @ApiQuery({ name: 'sedeId', type: Number, required: false })
  obtenerReporteOperativo(@Query('fecha') fecha: string, @Query('sedeId') sedeId?: string) {
    return this.reportesService.obtenerReporteOperativo(fecha, sedeId);
  }

  @ApiOperation({
    summary:
      'Obtener reportes estadísticos del sistema',
  })
  @ApiOkResponse({
    description:
      'Estadísticas generales de MANDA YA',
  })
  @HasRoles(
    JwtRole.ADMINISTRADOR,
  )
  @UseGuards(
    JwtAuthGuard,
    JwtRolesGuard,
  )
  @Get('estadisticas')
  obtenerEstadisticas() {

    return this.reportesService
      .obtenerEstadisticas();

  }

}
