import type { TipoRelacao } from '../types';

export interface RelacaoItem {
  valor: TipoRelacao;
  rotulo: string;
  emoji: string;
}

export const RELACOES: RelacaoItem[] = [
  { valor: 'eu',      rotulo: 'Eu',       emoji: '😊' },
  { valor: 'conjuge', rotulo: 'Cônjuge',  emoji: '💑' },
  { valor: 'filho',   rotulo: 'Filho(a)', emoji: '👶' },
  { valor: 'mae',     rotulo: 'Mãe',      emoji: '👩' },
  { valor: 'pai',     rotulo: 'Pai',      emoji: '👨' },
  { valor: 'irmao',   rotulo: 'Irmão(ã)', emoji: '🧑' },
  { valor: 'outro',   rotulo: 'Outro',    emoji: '👤' },
];

export const ROTULOS_RELACAO: Record<TipoRelacao, string> = Object.fromEntries(
  RELACOES.map(r => [r.valor, r.rotulo])
) as Record<TipoRelacao, string>;

export const EMOJIS_RELACAO: Record<TipoRelacao, string> = Object.fromEntries(
  RELACOES.map(r => [r.valor, r.emoji])
) as Record<TipoRelacao, string>;
