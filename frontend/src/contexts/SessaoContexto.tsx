/**
 * SessaoContexto — Interface Segregation Principle
 *
 * Antes: idUsuario, mesAtual, anoAtual eram passados via props para TODAS
 * as pages, mesmo as que não precisavam dos três.
 *
 * Depois: cada componente consome apenas o que precisa via hook useSessao().
 * Nenhum prop drilling desnecessário.
 */

import { createContext, useContext } from 'react';

interface SessaoContexto {
  idUsuario: string;
  mesAtual: number;
  anoAtual: number;
  trocarMes: (novoMes: number, novoAno: number) => void;
}

export const SessaoContexto = createContext<SessaoContexto | null>(null);

export function useSessao(): SessaoContexto {
  const ctx = useContext(SessaoContexto);
  if (!ctx) throw new Error('useSessao deve ser usado dentro de <ProvedorSessao>');
  return ctx;
}
