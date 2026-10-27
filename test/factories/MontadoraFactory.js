import { connection } from '../../src/configs/Database.js';
import { garantirBancoDeTeste } from '../helpers/bancoTeste.js';

export class MontadoraFactory {
  static async create(nome = 'Toyota', pais = 'Japão') {
    garantirBancoDeTeste();
    const [resultado] = await connection.execute(
      'INSERT INTO montadoras (Nome, Pais) VALUES (?, ?)', [nome, pais]
    );
    return { id: resultado.insertId, nome, pais };
  }
}
