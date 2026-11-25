import test from 'node:test';
import assert from 'node:assert/strict';
import { hash } from 'bcrypt';
import { EncomiendaController } from '../dist/encomienda/encomienda.controller.js';
import { EncomiendaService } from '../dist/encomienda/encomienda.service.js';
import { randomBytes } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ValidationPipe } from '@nestjs/common';
import { JwtStrategy } from '../dist/auth/jwt/jwt.strategy.js';
import { JwtRole } from '../dist/auth/jwt/jwt-role.js';
import { ReportesController } from '../dist/reportes/reportes.controller.js';
import { ReportesService } from '../dist/reportes/reportes.service.js';
import { UbicacionTrasladoController } from '../dist/ubicacion-traslado/ubicacion-traslado.controller.js';
import { UbicacionTrasladoService } from '../dist/ubicacion-traslado/ubicacion-traslado.service.js';

test('HTTP del panel, mapa y ubicación durante el traslado', async () => {
  const secret = randomBytes(32).toString('hex');
  const tokens = new JwtService({secret});
  const chofer = tokens.sign({id: 7, role: JwtRole.MOVILIDAD});
  const admin = tokens.sign({id: 8, role: JwtRole.ADMINISTRADOR});
  const traslado = {id: 1, estado: 'EN_CURSO', conductor: {id: 7, name: 'Prueba'},
    ruta: {name: 'Ruta de prueba'}, vehiculo: {placa: 'TEST'}};
  let posicion, escrituras = 0;
  const ubicaciones = {findOne: async () => posicion, create: data => data,
    save: async data => { escrituras++; return posicion = {...data, id: 1, updated_at: new Date()}; }};
  const repo = {count: async () => 0, countBy: async () => 0,
    createQueryBuilder() { return this; }, select() {return this;}, where() {return this;},
    getRawOne: async () => ({total: 0})};
  const cliente = tokens.sign({id: 9, role: JwtRole.CLIENTE});
  const sede = {id: 1, name: 'Origen'};
  const envio = {id: 1, codigo_rastreo: 'MY-ABCDEF12', clave_rastreo_hash: await hash('1234',4),
    estado: 'EN_TRANSITO', sede_origen: sede, sede_destino: {id: 2, name: 'Destino'}, ultima_sede: sede};
  let asignado = false;
  const encomiendas = new EncomiendaService({findOne: async ({where}) => where.codigo_rastreo === envio.codigo_rastreo ? envio : null},
    null, null, null, null, {findByEncomienda: async () => ({historial: []})}, null,
    {find: async () => asignado ? [{traslado: {...traslado, ubicacion: posicion}}] : []});
  const module = await Test.createTestingModule({
    controllers: [EncomiendaController, ReportesController, UbicacionTrasladoController],
    providers: [{provide: EncomiendaService, useValue: encomiendas}, JwtStrategy, {provide: ConfigService, useValue: new ConfigService({JWT_SECRET: secret})},
      {provide: ReportesService, useValue: new ReportesService(repo, repo, repo, repo)},
      {provide: UbicacionTrasladoService, useValue: new UbicacionTrasladoService(ubicaciones, {findOne: async () => traslado})}]
  }).compile();
  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({transform: true, whitelist: true}));
  await app.listen(0, '127.0.0.1');
  try {
    const base = await app.getUrl();
    async function request(path, token, expected, body, method = body ? 'PUT' : 'GET') {

      const response = await fetch(base + path, {method, headers: {
        ...(token ? {Authorization: 'Bearer ' + token} : {}),
        ...(body ? {'Content-Type': 'application/json'} : {})}, body: body && JSON.stringify(body)});
      assert.equal(response.status, expected);
      const contentType = response.headers.get('content-type');
      assert.match(contentType, /^application\/json/);
      console.log(method, path, response.status, 'Content-Type:', contentType);
      return response.json();
    }
    const stats = '/reportes/estadisticas', gps = '/ubicacion-traslado/traslado/1';
    await request(stats, null, 401);
    await request(stats, chofer, 403);
    assert.equal((await request(stats, admin, 200)).totales.encomiendas, 0);
    await request(gps, chofer, 404);
    const coordenadas = {latitud: -12.05, longitud: -77.04};
    const rastrear = '/encomienda/rastrear', consulta = {codigoRastreo: envio.codigo_rastreo, clave: '1234'};
    await request(rastrear, cliente, 404, {...consulta, codigoRastreo: 'MY-FFFFFFFF'}, 'POST');
    const sinTraslado = await request(rastrear, cliente, 201, consulta, 'POST');
    assert.equal(sinTraslado.movilidad.tiene_ubicacion, false);
    asignado = true;
    const sinGps = await request(rastrear, cliente, 201, consulta, 'POST');
    assert.equal(sinGps.movilidad.tiene_ubicacion, false);
    const actualizado = await request(gps, chofer, 200, coordenadas);
    assert.equal(actualizado.ubicacion.latitud, coordenadas.latitud);
    const mapa = await request(gps, chofer, 200);
    assert.equal(mapa.ubicacion.longitud, coordenadas.longitud);
    const conGps = await request(rastrear, cliente, 201, consulta, 'POST');
    assert.equal(conGps.movilidad.tiene_ubicacion, true);
    assert.equal(conGps.movilidad.latitud, coordenadas.latitud);
    await request(rastrear, cliente, 400, {...consulta, clave: '9999'}, 'POST');
    traslado.estado = 'FINALIZADO';
    await request(gps, chofer, 400, coordenadas);
    assert.equal(escrituras, 1);
  } finally { await app.close(); }
});
