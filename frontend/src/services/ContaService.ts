import { supabase } from '../lib/supabase';
import type { Conta, ContaInput } from '../types';

export const ContaService = {
  async listar(userId: string): Promise<Conta[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return (data ?? []) as Conta[];
  },

  async criar(userId: string, dados: ContaInput): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .insert({ ...dados, user_id: userId });
    if (error) throw new Error(error.message);
  },

  async atualizar(id: string, dados: Partial<ContaInput>): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .update(dados)
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async excluir(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};
