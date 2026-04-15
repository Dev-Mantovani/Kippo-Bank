import { useState, useEffect, useRef } from 'react';
import { useTema } from '../../contexts/TemaContexto';
import type { Notificacao, UrgenciaNot, TipoNot } from '../../hooks/useNotificacoes';

interface Props {
  notificacoes: Notificacao[];
  aoClicar: (notif: Notificacao) => void;
}

const COR_URGENCIA: Record<UrgenciaNot, string> = {
  alta:  '#ef4444',
  media: '#f59e0b',
  baixa: '#3b82f6',
};

const BG_URGENCIA: Record<UrgenciaNot, string> = {
  alta:  '#fef2f2',
  media: '#fffbeb',
  baixa: '#eff6ff',
};

const EMOJI_TIPO: Record<TipoNot, string> = {
  fatura_fechando:  '📅',
  despesa_sem_cartao: '💳',
  limite_proximo:   '⚠️',
  despesa_pendente: '⏳',
};

const IconBell = () => (
  <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

export default function SinoNotificacoes({ notificacoes, aoClicar }: Props) {
  const { cores, tema } = useTema();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const qtd = notificacoes.length;
  const temAlta = notificacoes.some(n => n.urgencia === 'alta');

  // Fecha ao clicar fora
  useEffect(() => {
    if (!aberto) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aberto]);

  const btnStyle = {
    width: 38, height: 38, borderRadius: 11, border: 'none',
    background: aberto ? cores.bgTerciario : cores.bgTerciario,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: cores.textoSutil, transition: 'background .2s', flexShrink: 0 as const,
    position: 'relative' as const,
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Botão sino */}
      <button style={btnStyle} onClick={() => setAberto(v => !v)} title="Notificações">
        <IconBell />
        {qtd > 0 && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            minWidth: 16, height: 16, borderRadius: 99,
            background: temAlta ? '#ef4444' : '#f59e0b',
            color: '#fff', fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1,
            boxShadow: '0 0 0 2px ' + cores.bgPrimario,
          }}>
            {qtd > 9 ? '9+' : qtd}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {aberto && (
        <div style={{
          position: 'absolute', top: 46, right: 0,
          width: 320,
          background: cores.bgCard,
          border: `1px solid ${cores.borda}`,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,.18)',
          zIndex: 400,
          overflow: 'hidden',
        }}>
          {/* Cabeçalho */}
          <div style={{
            padding: '14px 16px 12px',
            borderBottom: `1px solid ${cores.borda}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontWeight: 700, fontSize: 14, color: cores.textoTitulo,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Notificações
            </span>
            {qtd > 0 && (
              <span style={{
                background: temAlta ? '#fef2f2' : '#fffbeb',
                color: temAlta ? '#ef4444' : '#f59e0b',
                borderRadius: 99, padding: '2px 8px',
                fontSize: 11, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {qtd} ativa{qtd > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Lista */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {qtd === 0 ? (
              <div style={{
                padding: '28px 16px', textAlign: 'center',
                color: cores.textoSutil, fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                Tudo em dia!
              </div>
            ) : (
              notificacoes.map(n => (
                <button
                  key={n.id}
                  onClick={() => { aoClicar(n); setAberto(false); }}
                  style={{
                    width: '100%', display: 'flex', gap: 12, alignItems: 'flex-start',
                    padding: '12px 16px', border: 'none', background: 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    borderBottom: `1px solid ${cores.borda}`,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = cores.bgTerciario}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Ícone */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: tema === 'claro'
                      ? BG_URGENCIA[n.urgencia]
                      : COR_URGENCIA[n.urgencia] + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {EMOJI_TIPO[n.tipo]}
                  </div>

                  {/* Texto */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: cores.textoTitulo,
                      fontFamily: "'DM Sans', sans-serif",
                      marginBottom: 2,
                    }}>
                      {n.titulo}
                    </div>
                    <div style={{
                      fontSize: 12, color: cores.textoSutil,
                      fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.4,
                    }}>
                      {n.mensagem}
                    </div>
                  </div>

                  {/* Pílula de urgência */}
                  <span style={{
                    flexShrink: 0, alignSelf: 'center',
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 99,
                    background: tema === 'claro'
                      ? BG_URGENCIA[n.urgencia]
                      : COR_URGENCIA[n.urgencia] + '22',
                    color: COR_URGENCIA[n.urgencia],
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: 'uppercase' as const,
                    letterSpacing: '.4px',
                  }}>
                    {n.urgencia}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
