/**
 * Parser de mensagens do WhatsApp
 * Extrai categoria e valor de mensagens como:
 * - "Gato R$ 50" → {tipo: 'despesa', categoria: 'Lazer', valor: 50}
 */

const CATEGORIAS_DESPESA = {
  aluguel: 'Aluguel',
  casa: 'Moradia',
  comida: 'Alimentação',
  alimentação: 'Alimentação',
  restaurante: 'Alimentação',
  pizza: 'Alimentação',
  mercado: 'Supermercado',
  compras: 'Supermercado',
  saúde: 'Saúde',
  farmácia: 'Saúde',
  médico: 'Saúde',
  contas: 'Contas',
  água: 'Contas',
  luz: 'Contas',
  energia: 'Contas',
  uber: 'Transporte',
  táxi: 'Transporte',
  transporte: 'Transporte',
  ônibus: 'Transporte',
  metrô: 'Transporte',
  combustível: 'Combustível',
  gasolina: 'Combustível',
  educação: 'Educação',
  curso: 'Educação',
  escola: 'Educação',
  roupas: 'Roupas',
  internet: 'Internet',
  assinatura: 'Assinaturas',
  netflix: 'Assinaturas',
  spotify: 'Assinaturas',
  diversão: 'Lazer',
  lazer: 'Lazer',
  cinema: 'Lazer',
  jogo: 'Lazer',
  gato: 'Lazer',
};

const CATEGORIAS_RECEITA = {
  salário: 'Salário',
  freelance: 'Freelance',
  investimento: 'Investimentos',
  bônus: 'Bônus',
};

function encontrarCategoria(texto, mapa) {
  const textoLimpo = texto.toLowerCase().trim();

  for (const [chave, categoria] of Object.entries(mapa)) {
    if (textoLimpo.includes(chave)) {
      return categoria;
    }
  }

  return null;
}

function extrairValor(texto) {
  let limpo = texto
    .replace(/R\$\s*/gi, '')
    .replace(/\breais\b/gi, '')
    .trim();

  const match = limpo.match(/[\d.,]+/);

  if (!match) return null;

  let numero = match[0];
  numero = numero.replace(',', '.');

  const valor = parseFloat(numero);
  return isNaN(valor) || valor <= 0 ? null : valor;
}

function parsarMensagem(mensagem, idUsuario) {
  if (!mensagem || typeof mensagem !== 'string') {
    return {
      parseado: false,
      motivo: 'Mensagem inválida',
      mensagem: 'Envie um texto válido',
    };
  }

  const texto = mensagem.trim();

  if (texto.length < 3) {
    return {
      parseado: false,
      motivo: 'Mensagem muito curta',
      mensagem: 'Tente: "Gato R$ 50" ou "Uber 25"',
    };
  }

  let categoria = encontrarCategoria(texto, CATEGORIAS_DESPESA);
  let tipo = 'despesa';

  if (!categoria) {
    categoria = encontrarCategoria(texto, CATEGORIAS_RECEITA);
    tipo = 'receita';
  }

  if (!categoria) {
    return {
      parseado: false,
      motivo: 'Categoria não identificada',
      mensagem: 'Não consegui identificar a categoria. Tente: "Gato R$ 50", "Uber 25", "Salário 5000"',
    };
  }

  const valor = extrairValor(texto);
  if (!valor) {
    return {
      parseado: false,
      motivo: 'Valor não encontrado',
      mensagem: 'Não consegui extrair um valor. Use: "R$ 50", "50 reais" ou só "50"',
    };
  }

  return {
    parseado: true,
    tipo,
    categoria,
    valor,
    descricao: texto,
    confianca: 0.95,
    idUsuario,
    dataCriacao: new Date(),
  };
}

module.exports = {
  parsarMensagem,
  extrairValor,
  encontrarCategoria,
};
