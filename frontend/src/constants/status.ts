export interface StatusItem {
  valor: string;
  rotulo: string;
  cor: string;
  emoji: string;
}

export const STATUS_DESPESA: StatusItem[] = [
  { valor: 'pago',     rotulo: 'Pago',     cor: '#22c55e', emoji: '✅' },
  { valor: 'pendente', rotulo: 'Pendente', cor: '#f59e0b', emoji: '⏳' },
];

export const STATUS_RECEITA: StatusItem[] = [
  { valor: 'recebido', rotulo: 'Recebido', cor: '#22c55e', emoji: '✅' },
  { valor: 'pendente', rotulo: 'Pendente', cor: '#f59e0b', emoji: '⏳' },
];
