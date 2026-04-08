export interface CategoriaItem {
  valor: string;
  emoji: string;
}

export const CATEGORIAS_DESPESA: CategoriaItem[] = [
  { valor: 'Alimentação',  emoji: '🍔' },
  { valor: 'Moradia',      emoji: '🏠' },
  { valor: 'Transporte',   emoji: '🚗' },
  { valor: 'Saúde',        emoji: '💊' },
  { valor: 'Educação',     emoji: '📚' },
  { valor: 'Lazer',        emoji: '🎮' },
  { valor: 'Assinaturas',  emoji: '📱' },
  { valor: 'Contas',       emoji: '⚡' },
  { valor: 'Supermercado', emoji: '🛒' },
  { valor: 'Combustível',  emoji: '⛽' },
  { valor: 'Roupas',       emoji: '👗' },
  { valor: 'Outros',       emoji: '💸' },
];

export const CATEGORIAS_RECEITA: CategoriaItem[] = [
  { valor: 'Salário',       emoji: '💰' },
  { valor: 'Freelance',     emoji: '💼' },
  { valor: 'Investimentos', emoji: '📈' },
  { valor: 'Bônus',         emoji: '🎁' },
  { valor: 'Aluguel',       emoji: '🏠' },
  { valor: 'Outros',        emoji: '💵' },
];

export const TODAS_CATEGORIAS: CategoriaItem[] = [
  ...CATEGORIAS_RECEITA,
  ...CATEGORIAS_DESPESA.filter(d => !CATEGORIAS_RECEITA.some(r => r.valor === d.valor)),
];

/** Mapa categoria → emoji (para uso em listas e filtros) */
export const ICONES_CATEGORIA: Record<string, string> = Object.fromEntries(
  TODAS_CATEGORIAS.map(c => [c.valor, c.emoji])
);

/** Mapa categoria → cor (para gráficos e relatórios) */
export const CORES_CATEGORIA: Record<string, string> = {
  Aluguel:      '#FFD93D',
  Moradia:      '#FFD93D',
  Alimentação:  '#6BCB77',
  Supermercado: '#6BCB77',
  Saúde:        '#FF6B6B',
  Contas:       '#FF6B6B',
  Transporte:   '#4D96FF',
  Combustível:  '#4D96FF',
  Educação:     '#A78BFA',
  Roupas:       '#C77DFF',
  Internet:     '#8B7355',
  Assinaturas:  '#FF9F43',
  Streamings:   '#FF9F43',
  Lazer:        '#26C6DA',
  Outros:       '#9CA3AF',
  Freelance:    '#34D399',
  Investimentos:'#059669',
  'Bônus':      '#F59E0B',
  'Salário':    '#10B981',
};

export const VALORES_CATEGORIAS_DESPESA = CATEGORIAS_DESPESA.map(c => c.valor);
export const VALORES_CATEGORIAS_RECEITA = CATEGORIAS_RECEITA.map(c => c.valor);
