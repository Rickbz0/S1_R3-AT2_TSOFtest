import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { ClienteFactory } from '../factories/ClienteFactory.js';
import { MontadoraFactory } from '../factories/MontadoraFactory.js';
import { VeiculoFactory } from '../factories/VeiculoFactory.js';
import { buscarPorId, contarRegistros, encerrarConexaoDeTeste, limparBancoDeTeste } from '../helpers/bancoTeste.js';
import { veiculoValido } from '../helpers/api.js';

beforeEach(limparBancoDeTeste);
afterAll(encerrarConexaoDeTeste);

async function entidadesVinculadas() {
  const montadora = await MontadoraFactory.create();
  const cliente = await ClienteFactory.create();
  return { montadora, cliente };
}

describe('Veículos | 13 casos de integração', () => {
  it('CT-015 | POST válido: 201 e vínculo persistido', async () => {
    const { montadora, cliente } = await entidadesVinculadas();
    const resposta = await request(app).post('/veiculos').send(veiculoValido(montadora.id, cliente.id));
    expect(resposta.status).toBe(201);
    expect(resposta.body.message).toBe('Veículo criado com sucesso');
    const salvo = await buscarPorId('veiculos', resposta.body.data.insertId);
    expect(salvo.Modelo).toBe('Palio');
    expect(salvo.IdMontadora).toBe(montadora.id);
    expect(salvo.IdCliente).toBe(cliente.id);
  });

  it('CT-016 | idMontadora=0: rejeita', async () => {
    const { cliente } = await entidadesVinculadas();
    const resposta = await request(app).post('/veiculos').send(veiculoValido(0, cliente.id));
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('ID da montadora inválido');
    expect(await contarRegistros('veiculos')).toBe(0);
  });

  it('CT-017 | idCliente=0: rejeita', async () => {
    const { montadora } = await entidadesVinculadas();
    const resposta = await request(app).post('/veiculos').send(veiculoValido(montadora.id, 0));
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('ID do cliente inválido');
    expect(await contarRegistros('veiculos')).toBe(0);
  });

  it('CT-018 | modelo vazio: rejeita', async () => {
    const { montadora, cliente } = await entidadesVinculadas();
    const resposta = await request(app).post('/veiculos').send(veiculoValido(montadora.id, cliente.id, { modelo: '' }));
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('Modelo inválido');
    expect(await contarRegistros('veiculos')).toBe(0);
  });

  it('CT-019 | placa menor que 5 caracteres: rejeita', async () => {
    const { montadora, cliente } = await entidadesVinculadas();
    const resposta = await request(app).post('/veiculos').send(veiculoValido(montadora.id, cliente.id, { placa: 'ABC1' }));
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('Placa inválida');
    expect(await contarRegistros('veiculos')).toBe(0);
  });

  it('CT-020 | ano no limite inferior 1886: aceita', async () => {
    const { montadora, cliente } = await entidadesVinculadas();
    const resposta = await request(app).post('/veiculos').send(veiculoValido(montadora.id, cliente.id, { ano: 1886 }));
    expect(resposta.status).toBe(201);
    expect((await buscarPorId('veiculos', resposta.body.data.insertId)).Ano).toBe(1886);
  });

  it('CT-021 | ano 1885: rejeita', async () => {
    const { montadora, cliente } = await entidadesVinculadas();
    const resposta = await request(app).post('/veiculos').send(veiculoValido(montadora.id, cliente.id, { ano: 1885 }));
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('Ano inválido');
    expect(await contarRegistros('veiculos')).toBe(0);
  });

  it('CT-022 | ano atual+1 (limite superior): aceita', async () => {
    const { montadora, cliente } = await entidadesVinculadas();
    const anoLimite = new Date().getFullYear() + 1;
    const resposta = await request(app).post('/veiculos').send(veiculoValido(montadora.id, cliente.id, { ano: anoLimite }));
    expect(resposta.status).toBe(201);
    expect((await buscarPorId('veiculos', resposta.body.data.insertId)).Ano).toBe(anoLimite);
  });

  it('CT-023 | ano atual+2: rejeita', async () => {
    const { montadora, cliente } = await entidadesVinculadas();
    const resposta = await request(app).post('/veiculos').send(veiculoValido(montadora.id, cliente.id, { ano: new Date().getFullYear() + 2 }));
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('Ano inválido');
    expect(await contarRegistros('veiculos')).toBe(0);
  });

  it('CT-024 | valor zero: rejeita', async () => {
    const { montadora, cliente } = await entidadesVinculadas();
    const resposta = await request(app).post('/veiculos').send(veiculoValido(montadora.id, cliente.id, { valor: 0 }));
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('Valor inválido');
    expect(await contarRegistros('veiculos')).toBe(0);
  });

  it('CT-025 | PUT atualiza veículo existente', async () => {
    const { montadora, cliente } = await entidadesVinculadas();
    const veiculo = await VeiculoFactory.create(montadora.id, cliente.id);
    const resposta = await request(app).put(`/veiculos?id=${veiculo.id}`)
      .send(veiculoValido(montadora.id, cliente.id, { modelo: 'Palio GT', placa: 'ABC-2356' }));
    expect(resposta.status).toBe(200);
    expect(resposta.body.data.affectedRows).toBe(1);
    const salvo = await buscarPorId('veiculos', veiculo.id);
    expect(salvo.Modelo).toBe('Palio GT');
    expect(salvo.Placa).toBe('ABC-2356');
  });

  it('CT-026 | DELETE veículo: 200 e sem registro', async () => {
    const { montadora, cliente } = await entidadesVinculadas();
    const veiculo = await VeiculoFactory.create(montadora.id, cliente.id);
    const resposta = await request(app).delete(`/veiculos/${veiculo.id}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.message).toBe('Veículo deletado com sucesso');
    expect(await buscarPorId('veiculos', veiculo.id)).toBeNull();
  });

  it('CT-027 | GET integra cliente e montadora, ordenando por Modelo', async () => {
    const { montadora, cliente } = await entidadesVinculadas();
    await VeiculoFactory.create(montadora.id, cliente.id, { modelo: 'Palio' });
    await VeiculoFactory.create(montadora.id, cliente.id, { modelo: 'Argo', placa: 'ABC-9999' });
    const resposta = await request(app).get('/veiculos');
    expect(resposta.status).toBe(200);
    expect(resposta.body.data.map((v) => v.Modelo)).toEqual(['Argo', 'Palio']);
    for (const v of resposta.body.data) {
      expect(v.Montadora).toBe('Toyota');
      expect(v.Cliente).toBe('Cliente Exemplo');
      expect(v.IdMontadora).toBe(montadora.id);
      expect(v.IdCliente).toBe(cliente.id);
    }
  });
});
