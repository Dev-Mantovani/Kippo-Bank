import { useState, useEffect, useCallback } from 'react';
import { ContaService } from '../services/ContaService';
import type { Conta } from '../types';

interface UseContasResult {
  contas: Conta[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useContas(userId: string): UseContasResult {
  const [contas,     setContas]     = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await ContaService.listar(userId);
      setContas(dados);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => { recarregar(); }, [recarregar]);

  return { contas, carregando, erro, recarregar };
}
