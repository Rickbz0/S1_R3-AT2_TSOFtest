import { connection } from '../../src/configs/Database.js';
import { garantirBancoDeTeste } from '../helpers/bancoTeste.js';

export class VeiculoFactory {
  static async create(idMontadora, idCliente, sobrescritas = {}) {
    garantirBancoDeTeste();
    const dados = {
      idMontadora, idCliente, modelo: 'Palio', placa: 'ABC-1234',
      ano: 2010, cor: 'Preto', valor: 20000, ...sobrescritas,
    };
    const [resultado] = await connection.execute(
      `INSERT INTO veiculos (IdMontadora, IdCliente, Modelo, Placa, Ano, Cor, Valor)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [dados.idMontadora, dados.idCliente, dados.modelo, dados.placa,
       dados.ano, dados.cor, dados.valor]
    );
    return { id: resultado.insertId, ...dados };
  }
}
