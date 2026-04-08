/**
 * transacaoValidator — Strategy Pattern de validação
 *
 * Centraliza as regras de validação dos formulários de transação.
 * Cada função retorna null (válido) ou uma string de erro.
 *
 * Princípios:
 *  - SRP: validação separada da lógica de UI e de persistência
 *  - OCP: novos campos são adicionados sem alterar os modais
 */

interface CamposDespesa {
  titulo: string;
  valor: string;
  membroId: string;
}

interface CamposReceita {
  titulo: string;
  valor: string;
  membroId: string;
}

interface CamposConta {
  nome: string;
}

interface CamposCartao {
  nome: string;
  limite: string;
}

interface CamposMembro {
  nome: string;
}

/** Valida o formulário de despesa. Retorna mensagem de erro ou null. */
export function validarDespesa(campos: CamposDespesa): string | null {
  if (!campos.titulo.trim())   return 'Informe um título para a despesa.';
  if (!campos.valor)           return 'Informe o valor da despesa.';
  if (!campos.membroId)        return 'Selecione o responsável pela despesa.';

  const valorNum = parseFloat(campos.valor.replace(',', '.'));
  if (isNaN(valorNum) || valorNum <= 0) return 'O valor deve ser maior que zero.';

  return null;
}

/** Valida o formulário de receita. Retorna mensagem de erro ou null. */
export function validarReceita(campos: CamposReceita): string | null {
  if (!campos.titulo.trim())   return 'Informe um título para a receita.';
  if (!campos.valor)           return 'Informe o valor da receita.';
  if (!campos.membroId)        return 'Selecione o responsável pela receita.';

  const valorNum = parseFloat(campos.valor.replace(',', '.'));
  if (isNaN(valorNum) || valorNum <= 0) return 'O valor deve ser maior que zero.';

  return null;
}

/** Valida o formulário de conta. Retorna mensagem de erro ou null. */
export function validarConta(campos: CamposConta): string | null {
  if (!campos.nome.trim()) return 'Informe o nome da conta.';
  return null;
}

/** Valida o formulário de cartão. Retorna mensagem de erro ou null. */
export function validarCartao(campos: CamposCartao): string | null {
  if (!campos.nome.trim()) return 'Informe o nome do cartão.';
  if (!campos.limite)      return 'Informe o limite do cartão.';

  const limiteNum = parseFloat(campos.limite.replace(',', '.'));
  if (isNaN(limiteNum) || limiteNum <= 0) return 'O limite deve ser maior que zero.';

  return null;
}

/** Valida o formulário de membro. Retorna mensagem de erro ou null. */
export function validarMembro(campos: CamposMembro): string | null {
  if (!campos.nome.trim()) return 'Informe o nome do membro.';
  return null;
}

/** Converte string de valor monetário em número */
export function parsearValor(valor: string): number {
  return parseFloat(valor.replace(',', '.'));
}
