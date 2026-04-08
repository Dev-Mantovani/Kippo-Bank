import { supabase } from '../lib/supabase';
import type { Usuario } from '../types';

export const UsuarioService = {
  /** Retorna o usuário atual com perfil, ou null se não autenticado */
  async obterSessao(): Promise<{ usuario: Usuario; onboardingCompleto: boolean } | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: perfil } = await supabase
      .from('users_profile')
      .select('nome, onboarding_completed')
      .eq('id', session.user.id)
      .maybeSingle();

    return {
      usuario: {
        id:    session.user.id,
        email: session.user.email!,
        nome:  perfil?.nome,
      },
      onboardingCompleto: perfil?.onboarding_completed ?? false,
    };
  },

  async sair(): Promise<void> {
    await supabase.auth.signOut();
  },

  async inscreverMudancaSessao(callback: (logado: boolean) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sessao) => {
      callback(!!sessao?.user);
    });
    return subscription;
  },
};
