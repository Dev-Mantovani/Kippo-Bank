/**
 * utils/fatura.ts
 *
 * Lógica de períodos de fatura para cartões de crédito.
 *
 * Regra:
 *   A fatura do mês M com fechamento no dia D cobre o período:
 *     início → dia D+1 do mês M-1
 *     fim    → dia D   do mês M
 *
 * Exemplo: fechamento dia 15, mês de referência = Março
 *   início = 16/Fev
 *   fim    = 15/Mar
 */

export interface PeriodoFatura {
  dataInicioStr: string; // 'YYYY-MM-DD'
  dataFimStr:    string; // 'YYYY-MM-DD'
  jaFechou:      boolean; // hoje > dataFim
  mesRef:        number;
  anoRef:        number;
}

export function obterPeriodoFatura(
  fechamentoDia: number,
  mes: number, // 1-12, mês de referência no seletor
  ano: number,
): PeriodoFatura {
  // Fim da fatura: dia fechamentoDia do mês selecionado
  const dataFim = new Date(ano, mes - 1, fechamentoDia);

  // Início da fatura: dia fechamentoDia + 1 do mês anterior
  // Usando dia 0 do mês atual = último dia do mês anterior simplifica o cálculo
  // mas aqui queremos exatamente fechamentoDia + 1:
  const dataInicio = new Date(ano, mes - 2, fechamentoDia + 1);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const fimNorm = new Date(dataFim);
  fimNorm.setHours(0, 0, 0, 0);

  return {
    dataInicioStr: dataInicio.toISOString().split('T')[0],
    dataFimStr:    dataFim.toISOString().split('T')[0],
    jaFechou:      hoje > fimNorm,
    mesRef:        mes,
    anoRef:        ano,
  };
}

/**
 * Retorna o mês/ano vigente de fatura de um cartão baseado na data de hoje.
 * Se hoje ainda não passou o fechamentoDia, estamos dentro do mês atual.
 * Se passou, estamos na fatura do próximo mês.
 */
export function obterMesVigenteFatura(fechamentoDia: number): { mes: number; ano: number } {
  const hoje = new Date();
  const diaHoje = hoje.getDate();

  if (diaHoje <= fechamentoDia) {
    return { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() };
  } else {
    const proximo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    return { mes: proximo.getMonth() + 1, ano: proximo.getFullYear() };
  }
}

/**
 * Formata o período de fatura para exibição.
 * Ex: "16 Fev → 15 Mar 2026"
 */
export function formatarPeriodoFatura(periodo: PeriodoFatura): string {
  const inicio = new Date(periodo.dataInicioStr + 'T12:00:00');
  const fim    = new Date(periodo.dataFimStr    + 'T12:00:00');

  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const dI = inicio.getDate();
  const mI = meses[inicio.getMonth()];
  const dF = fim.getDate();
  const mF = meses[fim.getMonth()];
  const aF = fim.getFullYear();

  return `${dI} ${mI} → ${dF} ${mF} ${aF}`;
}
