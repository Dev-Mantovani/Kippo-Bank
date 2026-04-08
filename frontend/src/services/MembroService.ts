import { supabase } from '../lib/supabase';
import type { MembroFamilia, MembroInput } from '../types';

export const MembroService = {
  async listar(userId: string): Promise<MembroFamilia[]> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return (data ?? []) as MembroFamilia[];
  },

  async criar(userId: string, dados: MembroInput): Promise<MembroFamilia> {
    const { data, error } = await supabase
      .from('family_members')
      .insert({ ...dados, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as MembroFamilia;
  },

  async atualizar(id: string, dados: Partial<MembroInput>): Promise<void> {
    const { error } = await supabase
      .from('family_members')
      .update(dados)
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async excluir(id: string): Promise<void> {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  /** Faz upload de avatar e retorna a URL pública */
  async uploadAvatar(userId: string, arquivo: File): Promise<string> {
    const ext  = arquivo.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: upError } = await supabase.storage
      .from('avatars')
      .upload(path, arquivo, { upsert: true });
    if (upError) throw new Error(upError.message);

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },
};
