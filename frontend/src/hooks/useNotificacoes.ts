import { useMemo } from 'react';
import type { Cartao, Transacao } from '../types';

export type UrgenciaNot = 'alta' | 'media' | 'baixa';
export type TipoNot = 'fatura_fechando' | 'despesa_sem_cartao' | 'limite_proximo' | 'despesa_pendente';

export interface FiltroTransacao {
  tipo?: 'todos' | 'despesa' | 'receita';
  status?: string;
  semCartao?: boolean;
}

export interface Notificacao {
  id: string;
  tipo: TipoNot;
  titulo: string;
  mensagem: string;
  urgencia: UrgenciaNot;
  navegarPara: 'dashboard' | 'transacoes';
  filtro?: FiltroTransacao;
}

const ORDEM_URGENCIA: Record<UrgenciaNot, number> = { alta: 0, media: 1, baixa: 2 };

export function useNotificacoes(cartoes: Cartao[], transacoes: Transacao[]): Notificacao[] {
  return useMemo(() => {
    const notifs: Notificacao[] = [];
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();

    // ── 1. Fatura fechando (≤ 5 dias) ─────────────────────────────
    cartoes.forEach(c => {
      let diff = c.fechamento_dia - diaHoje;
      if (diff < 0) diff += diasNoMes; // já passou neste mês → próximo ciclo
      if (diff > 5) return;

      const urgencia: UrgenciaNot = diff <= 2 ? 'alta' : 'media';
      const quando = diff === 0 ? 'fecha hoje!' : diff === 1 ? 'fecha amanhã' : `fecha em ${diff} dias`;

      notifs.push({
        id: `fatura_${c.id}`,
        tipo: 'fatura_fechando',
        titulo: `Fatura ${c.nome}`,
        mensagem: `Dia ${c.fechamento_dia} — ${quando}`,
        urgencia,
        navegarPara: 'dashboard',
      });
    });

    // ── 2. Despesas sem cartão ─────────────────────────────────────
    const semCartao = transacoes.filter(t => t.tipo === 'despesa' && !t.cartao_id);
    if (semCartao.length > 0) {
      notifs.push({
        id: 'sem_cartao',
        tipo: 'despesa_sem_cartao',
        titulo: 'Despesas sem cartão',
        mensagem: `${semCartao.length} despesa${semCartao.length > 1 ? 's' : ''} sem cartão associado`,
        urgencia: 'media',
        navegarPara: 'transacoes',
        filtro: { tipo: 'despesa', semCartao: true },
      });
    }

    // ── 3. Limite próximo (> 80%) ──────────────────────────────────
    cartoes.forEach(c => {
      if (!c.limite) return;

      // Calcula o valor usado a partir das transações (campo c.usado é estático no banco)
      const usadoReal = transacoes
        .filter(t => t.cartao_id === c.id && t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);

      const pct = usadoReal / c.limite;
      if (pct < 0.8) return;

      notifs.push({
        id: `limite_${c.id}`,
        tipo: 'limite_proximo',
        titulo: `Limite ${c.nome}`,
        mensagem: `${Math.round(pct * 100)}% do limite utilizado`,
        urgencia: pct >= 0.9 ? 'alta' : 'media',
        navegarPara: 'dashboard',
      });
    });

    // ── 4. Despesas pendentes ──────────────────────────────────────
    const pendentes = transacoes.filter(t => t.tipo === 'despesa' && t.status === 'pendente');
    if (pendentes.length > 0) {
      notifs.push({
        id: 'pendentes',
        tipo: 'despesa_pendente',
        titulo: 'Despesas pendentes',
        mensagem: `${pendentes.length} despesa${pendentes.length > 1 ? 's' : ''} aguardando pagamento`,
        urgencia: 'baixa',
        navegarPara: 'transacoes',
        filtro: { tipo: 'despesa', status: 'pendente' },
      });
    }

    return notifs.sort((a, b) => ORDEM_URGENCIA[a.urgencia] - ORDEM_URGENCIA[b.urgencia]);
  }, [cartoes, transacoes]);
}
