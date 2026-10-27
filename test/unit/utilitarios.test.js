import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { limparNumero } from '../../src/utils/limparNumero.js';
import { consultarCep } from '../../src/utils/consultarCep.js';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

describe('Utilitários | 3 casos do documento (testes unitários com mock)', () => {
  it('CT-028 | limparNumero remove caracteres não numéricos', () => {
    expect(limparNumero('(19) 99999-9999')).toBe('19999999999');
  });

  it('CT-029 | limparNumero(null) retorna texto vazio', () => {
    expect(limparNumero(null)).toBe('');
  });

  it('CT-030 | consultarCep informa quando ViaCEP não encontra CEP', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { erro: true } });
    await expect(consultarCep('99999999')).rejects.toThrow('CEP não encontrado');
    expect(axios.get).toHaveBeenCalledWith('https://viacep.com.br/ws/99999999/json/');
  });
});
