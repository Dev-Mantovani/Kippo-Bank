import { useState, useEffect, useCallback } from 'react';
import { CartaoService } from '../services/CartaoService';
import type { Cartao } from '../types';

interface UseCartoesResult {
  cartoes: Cartao[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

export function useCartoes(userId: string): UseCartoesResult {
  const [cartoes,    setCartoes]    = useState<Cartao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await CartaoService.listar(userId);
      setCartoes(dados);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => { recarregar(); }, [recarregar]);

  return { cartoes, carregando, erro, recarregar };
}
