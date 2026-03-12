// utils/excluirTransacao.ts
import { supabase } from '../lib/supabase';

export type ModoExclusao = 'apenas_esta' | 'todas';

export async function excluirTransacao(
  transacao: {
    id: string;
    user_id: string;
    titulo: string;
    tipo: string;
    membro_id: string | null;
    recorrente: boolean;
    data: string;
  },
  modo: ModoExclusao = 'apenas_esta'
): Promise<void> {
  // Não recorrente ou modo apenas_esta → deleta só esta
  if (!transacao.recorrente || modo === 'apenas_esta') {
    await supabase.from('transactions').delete().eq('id', transacao.id);
    return;
  }

  // modo === 'todas' → deleta todas as recorrências com mesmo título + tipo + membro
  const { data: todasRecorrentes } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', transacao.user_id)
    .eq('titulo', transacao.titulo)
    .eq('tipo', transacao.tipo)
    .eq('membro_id', transacao.membro_id)
    .eq('recorrente', true);

  if (!todasRecorrentes || todasRecorrentes.length === 0) {
    await supabase.from('transactions').delete().eq('id', transacao.id);
    return;
  }

  const ids = todasRecorrentes.map((r) => r.id);
  await supabase.from('transactions').delete().in('id', ids);
}

// Verifica se a transação é a mais antiga (o original) da recorrência
export async function eTransacaoOriginal(transacao: {
  id: string;
  user_id: string;
  titulo: string;
  tipo: string;
  membro_id: string | null;
  recorrente: boolean;
}): Promise<boolean> {
  if (!transacao.recorrente) return false;

  const { data } = await supabase
    .from('transactions')
    .select('id, data')
    .eq('user_id', transacao.user_id)
    .eq('titulo', transacao.titulo)
    .eq('tipo', transacao.tipo)
    .eq('membro_id', transacao.membro_id)
    .eq('recorrente', true)
    .order('data', { ascending: true })
    .limit(1);

  return !!data && data.length > 0 && data[0].id === transacao.id;
}
