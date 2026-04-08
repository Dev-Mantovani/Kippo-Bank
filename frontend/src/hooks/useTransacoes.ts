import { useState, useEffect, useCallback } from 'react';
import { TransacaoService } from '../services/TransacaoService';
import { RecorrenteFacade } from '../services/RecorrenteFacade';
import type { Transacao } from '../types';

interface UseTransacoesOptions {
  /** Se true, sincroniza recorrentes antes de carregar (padrão: true) */
  sincronizarRecorrentes?: boolean;
}

interface UseTransacoesResult {
  transacoes: Transacao[];
  carregando: boolean;
  erro: string | null;
  recarregar: (skipRecorrentes?: boolean) => Promise<void>;
}

/**
 * Hook Observer — encapsula o ciclo de busca de transações.
 * Elimina o padrão repetido useEffect + useState em cada page.
 *
 * Princípios:
 *  - SRP: responsável apenas por buscar e manter estado de transações
 *  - DIP: usa TransacaoService (abstração), não supabase diretamente
 */
export function useTransacoes(
  userId: string,
  mes: number,
  ano: number,
  opcoes: UseTransacoesOptions = {},
): UseTransacoesResult {
  const { sincronizarRecorrentes = true } = opcoes;

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregando,  setCarregando]  = useState(true);
  const [erro,        setErro]        = useState<string | null>(null);

  const recarregar = useCallback(async (skipRecorrentes = false) => {
    setCarregando(true);
    setErro(null);
    try {
      if (sincronizarRecorrentes && !skipRecorrentes) {
        await RecorrenteFacade.sincronizarMes(userId, ano, mes);
      }
      const dados = await TransacaoService.listar(userId, ano, mes);
      setTransacoes(dados);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [userId, mes, ano, sincronizarRecorrentes]);

  useEffect(() => { recarregar(); }, [recarregar]);

  return { transacoes, carregando, erro, recarregar };
}
