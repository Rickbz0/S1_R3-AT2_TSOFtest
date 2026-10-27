# Automóveis — casos de teste e integração

Este pacote implementa os **33 casos CT-001 a CT-033** do PDF fornecido:
- **9** casos de Clientes, **8** de Montadoras e **13** de Veículos: **30 integrações reais** HTTP (Supertest) → Express → Repository → **MySQL**.
- **3** casos de utilitários (CT-028 a CT-030): testes **unitários** (e mock do ViaCEP).

Apenas o **ViaCEP é simulado**, para não depender da internet. Não é um mock do banco de dados.

## Preparação (Windows / VS Code)

1. Abra esta pasta no VS Code e, no terminal, execute `npm install`.
2. Inicie seu MySQL local e, no **MySQL Workbench**, execute `docs/sql-test.sql`. O script cria `loja_motors_test` e **remove os registros dessa base de testes**. Não rode no banco real.
3. Copie `.env.test.example` para `.env.test`, alterando `DB_USER`, `DB_PASSWORD`, `DB_HOST` e `DB_PORT` para os dados de seu MySQL. **Deixe `DB_DATABASE=loja_motors_test`.**
4. Execute `npm test` para rodar os 33 testes. O relatório do terminal mostra aprovado ou falhou.
5. Para rodar apenas os 3 testes unitários: `npm test -- test/unit/utilitarios.test.js` (não precisa de MySQL).
6. Para rodar somente Clientes: `npm test -- test/integracao/clientes.test.js`. Da mesma forma, `montadoras.test.js` ou `veiculos.test.js`.

> IMPORTANTE: Antes de cada caso de integração, os dados das tabelas `veiculos`, `clientes` e `montadoras` são **apagados somente de `loja_motors_test`** para isolar cada execução. Os testes têm uma trava que impede rodar em outro nome de banco. **Não configure essa base com dados pessoais/importantes**.

## Onde estão os casos

| Arquivo | IDs | Tipo |
|---|---|---|
| `test/integracao/clientes.test.js` | 001–006, 031–033 | Integração |
| `test/integracao/montadoras.test.js` | 007–014 | Integração |
| `test/integracao/veiculos.test.js` | 015–027 | Integração |
| `test/unit/utilitarios.test.js` | 028–030 | Unitário com mock |

Os testes verificam código HTTP, mensagens, erros, dados cadastrados/alterados/excluídos e a leitura correta das relações.

## Atenção às respostas HTTP

O código **original** responde com **500** para erros de validação (ex.: nome inválido), então os testes refletem o comportamento atual e as expectativas do PDF. Em uma API REST, costuma ser preferível retornar **400** (validação) ou **422**. **Não alteramos a lógica da API** neste pacote, para que os testes documentem fielmente o comportamento fornecido.

O PDF CT-030 menciona conexão externa, mas a versão implementada simula a resposta de CEP inexistente para garantir repetibilidade. Registre isso na planilha como **Mock do serviço externo**.

## Registrar evidências

Atualize a planilha `.xlsx` com o status após executar os testes na **sua máquina**. Não marque como Aprovado sem ver a execução de verdade.

Correções do código inicial de testes: imports errados, factories incompletas, teste existente buscando `body.id` quando a API devolve `body.data.insertId`, e limpeza sem proteção de banco.
