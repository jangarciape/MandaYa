import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { JwtStrategy } from '../dist/auth/jwt/jwt.strategy.js';
import { JwtRole } from '../dist/auth/jwt/jwt-role.js';
import { TrasladoEncomiendaController } from '../dist/traslado-encomienda/traslado-encomienda.controller.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { TrasladoEncomiendaService } from '../dist/traslado-encomienda/traslado-encomienda.service.js';
import { TrasladosService } from '../dist/traslados/traslados.service.js';

const sedes = [1, 2, 3].map(id => ({ id, name: 'Sede ' + id, active: true }));
function viaje(id, recorrido) {
  return { id, estado: 'PROGRAMADO', conductor: { id: 4, active: true },
    vehiculo: { id: 6, active: true, capacidad_kg: 100 },
    ruta: { active: true, sedes: recorrido.map((sede, orden) => ({ orden, sede })) } };
}

test('dos tramos mantienen un solo envío y ambos detalles de traslado', async t => {
  const [origen, escala, destino] = sedes;
  const viajes = [viaje(1, [origen, escala]), viaje(2, [escala, destino])];
  const envio = { id: 9, peso_kg: 2, ultima_sede: origen, sede_destino: destino, estado: 'EN_ALMACEN' };
  const detalles = [];
  const detalleRepo = {
    create: data => data,
    save: async data => { if (!Array.isArray(data)) detalles.push(data); return data; },
    findOne: async ({where}) => detalles.find(d => d.encomienda.id === where.encomienda.id &&
      (where.traslado ? d.traslado.id === where.traslado.id : !d.descargado_at)),
    find: async ({where}) => { const filtro = Array.isArray(where) ? where[0] : where;
      return detalles.filter(d => !d.descargado_at && d.traslado.id === filtro.traslado.id &&
        (!filtro.sede_descarga_id || d.sede_descarga_id === filtro.sede_descarga_id)); }
  };
  const servicio = new TrasladoEncomiendaService(detalleRepo,
    {findOne: async ({where}) => viajes.find(v => v.id === where.id)},
    {findOne: async () => envio, save: async data => data},
    {findOneBy: async ({id}) => sedes.find(s => s.id === id)});
  const secret = randomBytes(32).toString('hex');
  const jwt = new JwtService({secret});
  const module = await Test.createTestingModule({controllers: [TrasladoEncomiendaController],
    providers: [JwtStrategy, {provide: ConfigService, useValue: new ConfigService({JWT_SECRET: secret})},
      {provide: TrasladoEncomiendaService, useValue: servicio}]}).compile();
  const app = module.createNestApplication();
  await app.listen(0, '127.0.0.1');
  t.after(() => app.close());
  async function enviar(viajeId, sedeId, datos) {
    const method = datos ? 'POST' : 'PUT';
    const path = '/traslado-encomienda' + (datos ? '' : '/traslado/' + viajeId + '/sede/' + sedeId + '/descargar');
    const token = jwt.sign({id: 4, sedeId, role: datos ? JwtRole.ALMACEN : JwtRole.MOVILIDAD});
    const res = await fetch((await app.getUrl()) + path, {method,
      headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'}, body: datos && JSON.stringify(datos)});
    assert.equal(res.status, datos ? 201 : 200);
    assert.match(res.headers.get('content-type'), /^application\/json/);
    const body = await res.json();
    if (datos) assert.equal(body.encomienda.id, 9); else assert.equal(body.cantidad_descargada, 1);
    console.log(method, path, res.status, res.headers.get('content-type'));
  }
  await enviar(1, 1, {encomiendaId: 9, trasladoId: 1, sedeDescargaId: 2});
  viajes[0].estado = 'EN_CURSO';
  await enviar(1, 2);
  assert.equal(envio.estado, 'EN_ALMACEN');
  assert.equal(envio.ultima_sede.id, 2);
  await enviar(2, 2, {encomiendaId: 9, trasladoId: 2});
  viajes[1].estado = 'EN_CURSO';
  await enviar(2, 3);
  assert.equal(envio.estado, 'EN_SEDE_DESTINO');
  assert.deepEqual(detalles.map(d => d.sede_descarga_id), [2, 3]);
  assert.ok(detalles.every(d => d.descargado_at instanceof Date));
});

test('paradas en orden y confirmación de retorno a la primera sede', async () => {
  const v = viaje(1, sedes);
  v.estado = 'EN_CURSO';
  const servicio = new TrasladosService({findOne: async () => v,
    update: async (_, datos) => { Object.assign(v, datos); return { affected: 1 }; } });
  await assert.rejects(servicio.confirmarParada(1, 3, 4), e => e.getStatus() === 400);
  await assert.rejects(servicio.confirmarParada(1, 2, 8), e => e.getStatus() === 403);
  await servicio.confirmarParada(1, 2, 4);
  await servicio.confirmarParada(1, 3, 4);
  v.estado = 'FINALIZADO';
  const resultado = await servicio.retornarASedeCentral(1, 4);
  assert.equal(resultado.sede_central.id, 1);
  assert.ok(v.retorno_confirmado_at instanceof Date);
  const primero = v.retorno_confirmado_at;
  await servicio.retornarASedeCentral(1, 4);
  assert.equal(v.retorno_confirmado_at, primero);
});
