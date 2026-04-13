const { createClient } = require('@supabase/supabase-js');
const config = require('../config/environment');

class SupabaseTransacaoService {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
  }

  /**
   * Salva uma transação parseada pelo bot
   */
  async criarTransacao(idUsuario, dados) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .insert({
          id_usuario: idUsuario,
          tipo: dados.tipo,
          categoria: dados.categoria,
          valor: dados.valor,
          descricao: dados.descricao,
          data: dados.dataCriacao.toISOString().split('T')[0],
          status: 'pago',
          origem: 'whatsapp_bot',
          confianca_ia: dados.confianca,
          recorrente: false,
        })
        .select();

      if (error) {
        console.error('Erro Supabase:', error);
        return { sucesso: false, erro: error.message };
      }

      return {
        sucesso: true,
        transacao: data?.[0],
      };
    } catch (erro) {
      console.error('Erro ao criar transação:', erro);
      return { sucesso: false, erro: erro.message };
    }
  }

  /**
   * Busca usuário por número de WhatsApp
   */
  async buscarUsuarioPorWhatsApp(numero) {
    try {
      const { data, error } = await this.supabase
        .from('users_profile')
        .select('id')
        .eq('whatsapp_number', numero)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar usuário:', error);
        return null;
      }

      return data;
    } catch (erro) {
      console.error('Erro:', erro);
      return null;
    }
  }
}

module.exports = new SupabaseTransacaoService();
