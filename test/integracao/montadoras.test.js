import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { MontadoraFactory } from '../factories/MontadoraFactory.js';
import { buscarPorId, contarRegistros, encerrarConexaoDeTeste, limparBancoDeTeste } from '../helpers/bancoTeste.js';
import { montadoraValida } from '../helpers/api.js';

beforeEach(limparBancoDeTeste);
afterAll(encerrarConexaoDeTeste);

describe('Montadoras | 8 casos de integração', () => {
  it('CT-007 | POST válido: 201 e persistência', async () => {
    const resposta = await request(app).post('/montadoras').send(montadoraValida());
    expect(resposta.status).toBe(201);
    expect(resposta.body.message).toBe('Montadora criada com sucesso');
    const montadora = await buscarPorId('montadoras', resposta.body.data.insertId);
    expect(montadora).toMatchObject({ Nome: 'Ferrari', Pais: 'Itália' });
  });

  it('CT-008 | nome menor que 3 caracteres: rejeita', async () => {
    const resposta = await request(app).post('/montadoras').send(montadoraValida({ nome: 'AB' }));
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('Nome inválido');
    expect(await contarRegistros('montadoras')).toBe(0);
  });

  it('CT-009 | país ausente: rejeita', async () => {
    const resposta = await request(app).post('/montadoras').send(montadoraValida({ pais: '' }));
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('País inválido');
    expect(await contarRegistros('montadoras')).toBe(0);
  });

  it('CT-010 | PUT atualiza montadora existente', async () => {
    const montadora = await MontadoraFactory.create('Ferrari', 'Itália');
    const resposta = await request(app).put(`/montadoras?id=${montadora.id}`)
      .send(montadoraValida({ nome: 'Ferrari SA' }));
    expect(resposta.status).toBe(200);
    expect(resposta.body.data.affectedRows).toBe(1);
    expect((await buscarPorId('montadoras', montadora.id)).Nome).toBe('Ferrari SA');
  });

  it('CT-011 | PUT id inexistente: 404', async () => {
    const resposta = await request(app).put('/montadoras?id=999999').send(montadoraValida());
    expect(resposta.status).toBe(404);
    expect(resposta.body.message).toBe('Montadora não encontrada');
    expect(await contarRegistros('montadoras')).toBe(0);
  });

  it('CT-012 | DELETE existente: 200 e sem registro', async () => {
    const montadora = await MontadoraFactory.create();
    const resposta = await request(app).delete(`/montadoras/${montadora.id}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.message).toBe('Montadora deletada com sucesso');
    expect(await buscarPorId('montadoras', montadora.id)).toBeNull();
  });

  it('CT-013 | DELETE id inexistente: 404', async () => {
    const resposta = await request(app).delete('/montadoras/999999');
    expect(resposta.status).toBe(404);
    expect(resposta.body.message).toBe('Montadora não encontrada');
  });

  it('CT-014 | GET lista montadoras ordenadas por Nome', async () => {
    await MontadoraFactory.create('Ferrari', 'Itália');
    await MontadoraFactory.create('Toyota', 'Japão');
    await MontadoraFactory.create('BMW', 'Alemanha');
    const resposta = await request(app).get('/montadoras');
    expect(resposta.status).toBe(200);
    expect(resposta.body.data.map((m) => m.Nome)).toEqual(['BMW', 'Ferrari', 'Toyota']);
  });
});
