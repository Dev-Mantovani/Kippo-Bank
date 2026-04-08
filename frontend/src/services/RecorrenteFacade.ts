/**
 * RecorrenteFacade — Facade Pattern
 *
 * Coordena a lógica de criação automática de transações recorrentes.
 * Separa o acesso ao banco (via supabase) da lógica de negócio
 * (deduplicação, ajuste de datas).
 *
 * Princípios aplicados:
 *  - SRP: cada função privada tem uma única responsabilidade
 *  - Facade: esconde a complexidade do processo atrás de um método simples
 *  - DIP: usa supabase via import centralizado, não direto nos componentes
 */

import { supabase } from '../lib/supabase';

// Guard para evitar execuções simultâneas (race condition entre re-renders)
const emExecucao = new Set<string>();

// ─── Funções puras auxiliares (fáceis de testar unitariamente) ─────

/**
 * Deduplica transações por título + tipo + membro_id,
 * mantendo apenas a primeira ocorrência de cada grupo.
 */
function deduplicar(transacoes: any[]): any[] {
  return transacoes.reduce((acc: any[], atual) => {
    const jaExiste = acc.some(
      r =>
        r.titulo    === atual.titulo &&
        r.tipo      === atual.tipo   &&
        r.membro_id === atual.membro_id,
    );
    if (!jaExiste) acc.push(atual);
    return acc;
  }, []);
}

/**
 * Ajusta o dia da transação original para caber no mês destino
 * (ex: dia 31 → dia 28 em fevereiro).
 */
function ajustarDataParaMes(dataOriginal: string, ano: number, mes: number): string {
  const diaOriginal = parseInt(dataOriginal.split('-')[2]);
  const ultimoDiaMes = new Date(ano, mes, 0).getDate();
  const dia = Math.min(diaOriginal, ultimoDiaMes);
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// ─── Facade público ────────────────────────────────────────────────

export const RecorrenteFacade = {
  /**
   * Garante que todas as transações recorrentes existam no mês/ano indicado.
   * Se já existem, não duplica. Idempotente.
   */
  async sincronizarMes(userId: string, ano: number, mes: number): Promise<void> {
    const chave = `${userId}-${ano}-${mes}`;
    if (emExecucao.has(chave)) return;
    emExecucao.add(chave);

    try {
      const dataInicioMesAtual = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const dataFimMesAtual    = new Date(ano, mes, 0).toISOString().split('T')[0];

      // Busca recorrentes de MESES ANTERIORES (evita pegar as que já estão no mês atual)
      const { data: recorrentes } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('recorrente', true)
        .lt('data', dataInicioMesAtual);

      if (!recorrentes || recorrentes.length === 0) return;

      const unicas = deduplicar(recorrentes);

      for (const t of unicas) {
        // Verifica se já existe uma transação com o mesmo grupo neste mês
        const { data: existentes } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('titulo', t.titulo)
          .eq('tipo', t.tipo)
          .eq('membro_id', t.membro_id)
          .gte('data', dataInicioMesAtual)
          .lte('data', dataFimMesAtual)
          .limit(1);

        if (!existentes || existentes.length === 0) {
          await supabase.from('transactions').insert({
            user_id:   userId,
            tipo:      t.tipo,
            titulo:    t.titulo,
            valor:     t.valor,
            categoria: t.categoria,
            membro_id: t.membro_id,
            conta_id:  t.conta_id,
            cartao_id: t.cartao_id,
            recorrente: true,
            status:    'pendente',
            data:      ajustarDataParaMes(t.data, ano, mes),
          });
        }
      }
    } catch (erro) {
      console.error('[RecorrenteFacade] Erro ao sincronizar mês:', erro);
    } finally {
      emExecucao.delete(chave);
    }
  },
};
