import { supabase } from '../lib/supabase';
import type { Cartao, CartaoInput } from '../types';

export const CartaoService = {
  async listar(userId: string): Promise<Cartao[]> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return (data ?? []) as Cartao[];
  },

  async criar(userId: string, dados: CartaoInput): Promise<void> {
    const { error } = await supabase
      .from('cards')
      .insert({ ...dados, user_id: userId, usado: 0 });
    if (error) throw new Error(error.message);
  },

  async atualizar(id: string, dados: Partial<CartaoInput>): Promise<void> {
    const { error } = await supabase
      .from('cards')
      .update(dados)
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async excluir(id: string): Promise<void> {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};
