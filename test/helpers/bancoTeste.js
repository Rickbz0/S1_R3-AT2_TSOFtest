import { connection } from '../../src/configs/Database.js';

export function garantirBancoDeTeste() {
  if (process.env.NODE_ENV !== 'test' || process.env.DB_DATABASE !== 'loja_motors_test') {
    throw new Error('SEGURANÇA: execute somente com NODE_ENV=test e DB_DATABASE=loja_motors_test');
  }
}

export async function limparBancoDeTeste() {
  garantirBancoDeTeste();
  // Apaga apenas os dados do banco de teste; respeita a ordem das chaves estrangeiras.
  await connection.execute('DELETE FROM veiculos');
  await connection.execute('DELETE FROM clientes');
  await connection.execute('DELETE FROM montadoras');
}

export async function contarRegistros(tabela) {
  garantirBancoDeTeste();
  const tabelasPermitidas = ['clientes', 'montadoras', 'veiculos'];
  if (!tabelasPermitidas.includes(tabela)) throw new Error('Tabela inválida');
  const [[registro]] = await connection.query(`SELECT COUNT(*) AS total FROM ${tabela}`);
  return registro.total;
}

export async function buscarPorId(tabela, id) {
  garantirBancoDeTeste();
  const tabelasPermitidas = ['clientes', 'montadoras', 'veiculos'];
  if (!tabelasPermitidas.includes(tabela)) throw new Error('Tabela inválida');
  const [registros] = await connection.execute(`SELECT * FROM ${tabela} WHERE Id = ?`, [id]);
  return registros[0] ?? null;
}

export async function encerrarConexaoDeTeste() {
  garantirBancoDeTeste();
  await connection.end();
}
