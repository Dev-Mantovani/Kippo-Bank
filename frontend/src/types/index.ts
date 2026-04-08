// ─── Enums / Union types ───────────────────────────────────────────
export type TipoFamilia   = 'sozinho' | 'casado' | 'morando_junto' | 'familia';
export type TipoStatus    = 'pago' | 'pendente' | 'recebido';
export type TipoTransacao = 'receita' | 'despesa';
export type TipoConta     = 'corrente' | 'poupanca' | 'investimento';
export type TipoRelacao   = 'conjuge' | 'filho' | 'mae' | 'pai' | 'irmao' | 'outro';
export type ModoEdicao    = 'apenas_esta' | 'todas';
export type ModoExclusao  = 'apenas_esta' | 'todas';

// ─── Entidades (retornadas pelo banco) ────────────────────────────
export interface Usuario {
  id: string;
  email: string;
  nome?: string;
}

export interface MembroFamilia {
  id: string;
  user_id: string;
  nome: string;
  relacao: TipoRelacao;
  cor: string;
  avatar_url?: string | null;
}

export interface Conta {
  id: string;
  user_id: string;
  nome: string;
  tipo: TipoConta;
  saldo: number;
  cor: string;
}

export interface Cartao {
  id: string;
  user_id: string;
  nome: string;
  limite: number;
  usado: number;
  cor: string;
  fechamento_dia: number;
  membro_id?: string | null;
}

export interface Transacao {
  id: string;
  user_id: string;
  tipo: TipoTransacao;
  titulo: string;
  valor: number;
  categoria: string;
  membro_id: string;
  membro?: MembroFamilia;
  conta_id?: string | null;
  cartao_id?: string | null;
  recorrente: boolean;
  status: TipoStatus;
  data: string;
}

// ─── Input types (para criar / editar) ────────────────────────────

/** Campos necessários para criar uma transação (sem id, sem user_id) */
export interface TransacaoInput {
  tipo: TipoTransacao;
  titulo: string;
  valor: number;
  categoria: string;
  status: TipoStatus;
  membro_id: string;
  data: string;
  recorrente: boolean;
  conta_id?: string | null;
  cartao_id?: string | null;
}

/** Campos necessários para criar um membro */
export interface MembroInput {
  nome: string;
  relacao: TipoRelacao;
  cor: string;
  avatar_url?: string | null;
}

/** Campos necessários para criar uma conta */
export interface ContaInput {
  nome: string;
  tipo: TipoConta;
  saldo: number;
  cor: string;
}

/** Campos necessários para criar um cartão */
export interface CartaoInput {
  nome: string;
  limite: number;
  cor: string;
  fechamento_dia: number;
  membro_id?: string | null;
}

// ─── Tipos auxiliares ──────────────────────────────────────────────

export interface FaturaInfo {
  total: number;
  status: 'aberta' | 'paga';
  jaFechou: boolean;
  periodo: string;
  invoiceId: string | null;
}

export interface PeriodoMes {
  dataInicioStr: string;
  dataFimStr: string;
}
