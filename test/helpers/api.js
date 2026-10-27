export const clienteValido = (sobrescritas = {}) => ({
  nome: 'Florisvaldo Junior', cpf: '123.456.780-00',
  cep: '13185880', numero: '123', complemento: 'teste', ...sobrescritas,
});

export const montadoraValida = (sobrescritas = {}) => ({
  nome: 'Ferrari', pais: 'Itália', ...sobrescritas,
});

export const veiculoValido = (idMontadora, idCliente, sobrescritas = {}) => ({
  idMontadora, idCliente, modelo: 'Palio', placa: 'ABC-1234',
  ano: 2010, cor: 'Preto', valor: 20000, ...sobrescritas,
});

export const viacepFake = (cep) => ({ data: {
  cep: cep === '13185881' ? '13185-881' : '13185-880',
  logradouro: cep === '13185881' ? 'Rua Atualizada' : 'Rua de Teste',
  bairro: 'Centro', localidade: 'Sumaré', uf: 'SP',
}});
