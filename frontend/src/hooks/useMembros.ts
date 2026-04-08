import { useState, useEffect, useCallback } from 'react';
import { MembroService } from '../services/MembroService';
import type { MembroFamilia } from '../types';

interface UseMembrosResult {
  membros: MembroFamilia[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useMembros(userId: string): UseMembrosResult {
  const [membros,    setMembros]    = useState<MembroFamilia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await MembroService.listar(userId);
      setMembros(dados);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => { recarregar(); }, [recarregar]);

  return { membros, carregando, erro, recarregar };
}
