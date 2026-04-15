const { createClient } = require('@supabase/supabase-js');
const config = require('../config/environment');

class SupabaseTransacaoService {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
  }

  async buscarCartaoUsuario(idUsuario, nomeCartao) {
    try {
      const { data, error } = await this.supabase
        .from('cards')
        .select('id, nome')
        .eq('user_id', idUsuario)
        .ilike('nome', `%${nomeCartao}%`)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar cartão:', error);
        return null;
      }
      return data;
    } catch (erro) {
      console.error('Erro:', erro);
      return null;
    }
  }

  async criarTransacao(idUsuario, dados, cartaoId = null) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .insert({
          user_id: idUsuario,
          tipo: dados.tipo,
          titulo: dados.descricao,
          valor: dados.valor,
          categoria: dados.categoria,
          data: dados.dataCriacao.toISOString().split('T')[0],
          status: 'pago',
          recorrente: false,
          ...(cartaoId && { cartao_id: cartaoId }),
        })
        .select();

      if (error) {
        console.error('Erro Supabase:', error);
        return { sucesso: false, erro: error.message };
      }

      return { sucesso: true, transacao: data?.[0] };
    } catch (erro) {
      console.error('Erro ao criar transação:', erro);
      return { sucesso: false, erro: erro.message };
    }
  }

  async buscarUsuarioPorWhatsApp(numero) {
    try {
      const { data, error } = await this.supabase
        .from('users_profile')
        .select('id, nome')
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

  async buscarTransacoesMes(idUsuario, tipo) {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString().split('T')[0];
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      .toISOString().split('T')[0];

    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('titulo, valor, categoria, data')
        .eq('user_id', idUsuario)
        .eq('tipo', tipo)
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .order('data', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transações:', error);
        return [];
      }
      return data || [];
    } catch (erro) {
      console.error('Erro:', erro);
      return [];
    }
  }

  async buscarTransacoesPorCategoria(idUsuario, tipo, categoria) {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString().split('T')[0];
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      .toISOString().split('T')[0];

    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('titulo, valor, data')
        .eq('user_id', idUsuario)
        .eq('tipo', tipo)
        .eq('categoria', categoria)
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .order('data', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transações por categoria:', error);
        return [];
      }
      return data || [];
    } catch (erro) {
      console.error('Erro:', erro);
      return [];
    }
  }

  async buscarResumoMes(idUsuario, tipo, categoria) {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString().split('T')[0];
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      .toISOString().split('T')[0];

    try {
      const [{ data: totalMesData }, { data: totalCatData }] = await Promise.all([
        this.supabase.from('transactions').select('valor')
          .eq('user_id', idUsuario).eq('tipo', tipo)
          .gte('data', inicioMes).lte('data', fimMes),
        this.supabase.from('transactions').select('valor')
          .eq('user_id', idUsuario).eq('tipo', tipo).eq('categoria', categoria)
          .gte('data', inicioMes).lte('data', fimMes),
      ]);

      const totalMes = (totalMesData || []).reduce((acc, t) => acc + Number(t.valor), 0);
      const totalCategoria = (totalCatData || []).reduce((acc, t) => acc + Number(t.valor), 0);

      return { totalMes, totalCategoria };
    } catch (erro) {
      console.error('Erro ao buscar resumo:', erro);
      return { totalMes: 0, totalCategoria: 0 };
    }
  }
}

module.exports = new SupabaseTransacaoService();
