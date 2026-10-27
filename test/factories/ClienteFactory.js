import { connection } from '../../src/configs/Database.js';
import { garantirBancoDeTeste } from '../helpers/bancoTeste.js';

export class ClienteFactory {
  static async create(sobrescritas = {}) {
    garantirBancoDeTeste();
    const dados = {
      nome: 'Cliente Exemplo', cpf: '12345678000', cep: '13185880',
      logradouro: 'Rua de Teste', bairro: 'Centro', cidade: 'Sumaré',
      uf: 'SP', numero: '123', complemento: null, ...sobrescritas,
    };
    const [resultado] = await connection.execute(
      `INSERT INTO clientes (Nome, CPF, CEP, Logradouro, Bairro, Cidade, UF, Numero, Complemento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [dados.nome, dados.cpf, dados.cep, dados.logradouro, dados.bairro,
       dados.cidade, dados.uf, dados.numero, dados.complemento]
    );
    return { id: resultado.insertId, ...dados };
  }
}
