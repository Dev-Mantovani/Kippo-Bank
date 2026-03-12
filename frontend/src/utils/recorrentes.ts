import { supabase } from '../lib/supabase';

// Guard para evitar execuções simultâneas (race condition entre re-renders)
const emExecucao = new Set<string>();

export async function criarTransacoesRecorrentesMes(
  idUsuario: string,
  ano: number,
  mes: number,
) {
  const chave = `${idUsuario}-${ano}-${mes}`;

  // Se já está rodando para este usuário/mês, ignora
  if (emExecucao.has(chave)) return;
  emExecucao.add(chave);

  try {
    // Busca apenas recorrentes de meses ANTERIORES ao atual
    // para não pegar as duplicatas que já estão no mês corrente
    const dataInicioMesAtual = `${ano}-${String(mes).padStart(2, '0')}-01`;

    const { data: recorrentes } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', idUsuario)
      .eq('recorrente', true)
      .lt('data', dataInicioMesAtual); // apenas de meses anteriores

    if (!recorrentes || recorrentes.length === 0) return;

    // Deduplica por título + tipo + membro_id
    const recorrentesUnicas = recorrentes.reduce((acumulador: any[], atual) => {
      const jaTemIgual = acumulador.find(
        (r) =>
          r.titulo === atual.titulo &&
          r.tipo === atual.tipo &&
          r.membro_id === atual.membro_id,
      );
      if (!jaTemIgual) acumulador.push(atual);
      return acumulador;
    }, []);

    const dataFimMesAtual = new Date(ano, mes, 0).toISOString().split('T')[0];

    for (const recorrente of recorrentesUnicas) {
      // Usa limit(1) — funciona mesmo com múltiplas linhas (maybeSingle falha nesses casos)
      const { data: existentes } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', idUsuario)
        .eq('titulo', recorrente.titulo)
        .eq('tipo', recorrente.tipo)
        .eq('membro_id', recorrente.membro_id)
        .gte('data', dataInicioMesAtual)
        .lte('data', dataFimMesAtual)
        .limit(1);

      if (!existentes || existentes.length === 0) {
        const diaOriginal = parseInt(recorrente.data.split('-')[2]);
        const ultimoDiaMes = new Date(ano, mes, 0).getDate();
        const dia = Math.min(diaOriginal, ultimoDiaMes);
        const novaData = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        await supabase.from('transactions').insert({
          user_id: idUsuario,
          tipo: recorrente.tipo,
          titulo: recorrente.titulo,
          valor: recorrente.valor,
          categoria: recorrente.categoria,
          membro_id: recorrente.membro_id,
          conta_id: recorrente.conta_id,
          cartao_id: recorrente.cartao_id,
          recorrente: true,
          status: 'pendente',
          data: novaData,
        });
      }
    }
  } catch (erro) {
    console.error('Erro ao criar recorrentes:', erro);
  } finally {
    emExecucao.delete(chave);
  }
}
