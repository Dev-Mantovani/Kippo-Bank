import { supabase } from '../lib/supabase';

export type ModoEdicao = 'apenas_esta' | 'todas';

export async function editarTransacao(
  transacao: { id: string; titulo: string; membro_id: string; data: string; user_id: string },
  payload: Record<string, unknown>,
  modo: ModoEdicao,
): Promise<void> {
  if (modo === 'apenas_esta') {
    await supabase.from('transactions').update(payload).eq('id', transacao.id);
  } else {
    // Para o modo "todas", NÃO propaga `data` nem `status`:
    // - `data`: cada ocorrência tem sua data no mês correto
    // - `status`: cada mês começa como "pendente" e o usuário marca como pago no momento certo
    const payloadFuturo = { ...payload };
    delete payloadFuturo['data'];
    delete payloadFuturo['status'];

    await supabase
      .from('transactions')
      .update(payloadFuturo)
      .eq('user_id', transacao.user_id)
      .eq('titulo', transacao.titulo)
      .eq('membro_id', transacao.membro_id)
      .eq('recorrente', true)
      .gte('data', transacao.data);
  }
}
