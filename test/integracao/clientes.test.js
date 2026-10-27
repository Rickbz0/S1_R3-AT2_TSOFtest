import { beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import app from '../../src/app.js';
import { connection } from '../../src/configs/Database.js';
import { ClienteFactory } from '../factories/ClienteFactory.js';
import { buscarPorId, contarRegistros, encerrarConexaoDeTeste, limparBancoDeTeste } from '../helpers/bancoTeste.js';
import { clienteValido, viacepFake } from '../helpers/api.js';

// Mock APENAS do serviço externo ViaCEP; Express + repositório + MySQL são reais.
vi.mock('axios', () => ({ default: { get: vi.fn() } }));

beforeEach(async () => {
  await limparBancoDeTeste();
  vi.mocked(axios.get).mockImplementation(async (url) => {
    const cep = String(url).match(/\/ws\/(\d{8})\/json\//)?.[1];
    if (!cep) throw new Error('URL de CEP inesperada');
    return viacepFake(cep);
  });
});
afterAll(encerrarConexaoDeTeste);

describe('Clientes | 9 casos de integração', () => {
  it('CT-001 | POST válido: 201 e persistência', async () => {
    const resposta = await request(app).post('/clientes').send(clienteValido());
    expect(resposta.status).toBe(201);
    expect(resposta.body.message).toBe('Cliente criado com sucesso');
    expect(resposta.body.data.insertId).toBeGreaterThan(0);
    const cliente = await buscarPorId('clientes', resposta.body.data.insertId);
    expect(cliente.Nome).toBe('Florisvaldo Junior');
    expect(cliente.CPF).toBe('12345678000');
    expect(cliente.CEP).toBe('13185880');
  });

  it('CT-002 | CEP com 4 dígitos: erro 500 e sem inserção (comportamento atual)', async () => {
    const resposta = await request(app).post('/clientes').send(clienteValido({ cep: '1234' }));
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('CEP inválido');
    expect(await contarRegistros('clientes')).toBe(0);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('CT-003 | CEP com máscara é normalizado para 8 dígitos', async () => {
    const resposta = await request(app).post('/clientes').send(clienteValido({ cep: '13185-880' }));
    expect(resposta.status).toBe(201);
    expect(axios.get).toHaveBeenCalledWith('https://viacep.com.br/ws/13185880/json/');
    const cliente = await buscarPorId('clientes', resposta.body.data.insertId);
    expect(cliente.CEP).toBe('13185880');
  });

  it('CT-004 | CPF formatado é persistido somente com dígitos', async () => {
    const resposta = await request(app).post('/clientes').send(clienteValido());
    expect(resposta.status).toBe(201);
    const cliente = await buscarPorId('clientes', resposta.body.data.insertId);
    expect(cliente.CPF).toBe('12345678000');
  });

  it('CT-005 | nome menor que 3 caracteres: rejeita', async () => {
    const resposta = await request(app).post('/clientes').send(clienteValido({ nome: 'AB' }));
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('Nome inválido');
    expect(await contarRegistros('clientes')).toBe(0);
  });

  it('CT-006 | nome ausente: rejeita', async () => {
    const { nome, ...semNome } = clienteValido();
    const resposta = await request(app).post('/clientes').send(semNome);
    expect(resposta.status).toBe(500);
    expect(resposta.body.error).toBe('Nome inválido');
    expect(await contarRegistros('clientes')).toBe(0);
  });

  it('CT-031 | GET lista clientes ordenados por Nome', async () => {
    await ClienteFactory.create({ nome: 'Zeca' });
    await ClienteFactory.create({ nome: 'Amanda', cpf: '11122233344' });
    const resposta = await request(app).get('/clientes');
    expect(resposta.status).toBe(200);
    expect(resposta.body.message).toBe('Clientes selecionados com sucesso');
    expect(resposta.body.data.map((c) => c.Nome)).toEqual(['Amanda', 'Zeca']);
  });

  it('CT-032 | DELETE remove cliente e retorna 200', async () => {
    const cliente = await ClienteFactory.create();
    const resposta = await request(app).delete(`/clientes/${cliente.id}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.message).toBe('Cliente deletado com sucesso');
    expect(await buscarPorId('clientes', cliente.id)).toBeNull();
  });

  it('CT-033 | PUT atualiza cliente e endereço consultado por CEP', async () => {
    const cliente = await ClienteFactory.create();
    const resposta = await request(app)
      .put(`/clientes?id=${cliente.id}`)
      .send(clienteValido({ nome: 'Cliente Atualizado', cep: '13185881', numero: '1234' }));
    expect(resposta.status).toBe(200);
    expect(resposta.body.data.affectedRows).toBe(1);
    const salvo = await buscarPorId('clientes', cliente.id);
    expect(salvo.Nome).toBe('Cliente Atualizado');
    expect(salvo.CEP).toBe('13185881');
    expect(salvo.Logradouro).toBe('Rua Atualizada');
    expect(salvo.Numero).toBe('1234');
  });
});
