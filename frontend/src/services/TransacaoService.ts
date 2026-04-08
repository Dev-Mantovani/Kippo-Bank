import { supabase } from '../lib/supabase';
import type { Transacao, TransacaoInput, ModoEdicao, ModoExclusao } from '../types';

export const TransacaoService = {
  /** Lista transações de um mês/ano com o membro embutido */
  async listar(userId: string, ano: number, mes: number): Promise<Transacao[]> {
    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const fim    = new Date(ano, mes, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('transactions')
      .select('*, membro:family_members(*)')
      .eq('user_id', userId)
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Transacao[];
  },

  /** Cria uma nova transação */
  async criar(userId: string, dados: TransacaoInput): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .insert({ ...dados, user_id: userId });
    if (error) throw new Error(error.message);
  },

  /** Atualiza uma transação pelo id */
  async atualizar(id: string, dados: Partial<TransacaoInput>): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update(dados)
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  /** Exclui uma transação pelo id */
  async excluir(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  /** Exclui todas as recorrências de um grupo (mesmo título + tipo + membro) */
  async excluirGrupoRecorrente(
    userId: string,
    titulo: string,
    tipo: string,
    membroId: string | null,
  ): Promise<void> {
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('titulo', titulo)
      .eq('tipo', tipo)
      .eq('membro_id', membroId)
      .eq('recorrente', true);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return;

    const ids = data.map(r => r.id);
    const { error: delError } = await supabase
      .from('transactions')
      .delete()
      .in('id', ids);
    if (delError) throw new Error(delError.message);
  },

  /** Atualiza todas as ocorrências futuras de uma recorrência */
  async atualizarRecorrentesFuturos(
    transacao: Pick<Transacao, 'user_id' | 'titulo' | 'membro_id' | 'data'>,
    dados: Partial<TransacaoInput>,
  ): Promise<void> {
    // Não propaga data nem status — cada mês tem a sua
    const payload = { ...dados };
    delete (payload as Record<string, unknown>)['data'];
    delete (payload as Record<string, unknown>)['status'];

    const { error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('user_id', transacao.user_id)
      .eq('titulo', transacao.titulo)
      .eq('membro_id', transacao.membro_id)
      .eq('recorrente', true)
      .gte('data', transacao.data);

    if (error) throw new Error(error.message);
  },

  /** Verifica se esta é a transação recorrente mais antiga do grupo */
  async eOriginal(transacao: Pick<Transacao, 'id' | 'user_id' | 'titulo' | 'tipo' | 'membro_id' | 'recorrente'>): Promise<boolean> {
    if (!transacao.recorrente) return false;

    const { data, error } = await supabase
      .from('transactions')
      .select('id, data')
      .eq('user_id', transacao.user_id)
      .eq('titulo', transacao.titulo)
      .eq('tipo', transacao.tipo)
      .eq('membro_id', transacao.membro_id)
      .eq('recorrente', true)
      .order('data', { ascending: true })
      .limit(1);

    if (error) throw new Error(error.message);
    return !!data && data.length > 0 && data[0].id === transacao.id;
  },

  /** Edita uma transação aplicando a estratégia correta */
  async editar(
    transacao: Pick<Transacao, 'id' | 'user_id' | 'titulo' | 'membro_id' | 'data'>,
    dados: Partial<TransacaoInput>,
    modo: ModoEdicao,
  ): Promise<void> {
    if (modo === 'apenas_esta') {
      await TransacaoService.atualizar(transacao.id, dados);
    } else {
      await TransacaoService.atualizarRecorrentesFuturos(transacao, dados);
    }
  },

  /** Exclui uma transação aplicando a estratégia correta */
  async excluirComModo(
    transacao: Pick<Transacao, 'id' | 'user_id' | 'titulo' | 'tipo' | 'membro_id' | 'recorrente'>,
    modo: ModoExclusao,
  ): Promise<void> {
    if (!transacao.recorrente || modo === 'apenas_esta') {
      await TransacaoService.excluir(transacao.id);
    } else {
      await TransacaoService.excluirGrupoRecorrente(
        transacao.user_id,
        transacao.titulo,
        transacao.tipo,
        transacao.membro_id,
      );
    }
  },
};
