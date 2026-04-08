import { supabase } from '../lib/supabase';
import { obterPeriodoFatura, formatarPeriodoFatura } from '../utils/fatura';
import type { Cartao, FaturaInfo } from '../types';

export const FaturaService = {
  /** Calcula a FaturaInfo de um cartão para um mês/ano */
  async calcular(
    userId: string,
    cartao: Cartao,
    mes: number,
    ano: number,
  ): Promise<FaturaInfo> {
    const periodo = obterPeriodoFatura(cartao.fechamento_dia ?? 10, mes, ano);

    const [{ data: txs }, { data: invoice }] = await Promise.all([
      supabase
        .from('transactions')
        .select('valor')
        .eq('user_id', userId)
        .eq('cartao_id', cartao.id)
        .eq('tipo', 'despesa')
        .gte('data', periodo.dataInicioStr)
        .lte('data', periodo.dataFimStr),

      supabase
        .from('card_invoices')
        .select('id, status')
        .eq('card_id', cartao.id)
        .eq('mes', mes)
        .eq('ano', ano)
        .maybeSingle(),
    ]);

    const total = (txs ?? []).reduce((s, t) => s + (t.valor as number), 0);

    return {
      total,
      status: ((invoice?.status as 'aberta' | 'paga') ?? 'aberta'),
      jaFechou: periodo.jaFechou,
      periodo: formatarPeriodoFatura(periodo),
      invoiceId: invoice?.id ?? null,
    };
  },

  /** Marca uma fatura como paga (cria ou atualiza o registro) */
  async marcarPaga(
    userId: string,
    cartaoId: string,
    mes: number,
    ano: number,
    invoiceId: string | null,
  ): Promise<void> {
    const pagamento = { status: 'paga', pago_em: new Date().toISOString() };

    if (invoiceId) {
      const { error } = await supabase
        .from('card_invoices')
        .update(pagamento)
        .eq('id', invoiceId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from('card_invoices')
        .insert({ user_id: userId, card_id: cartaoId, mes, ano, ...pagamento });
      if (error) throw new Error(error.message);
    }
  },
};
