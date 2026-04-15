import { useTema } from '../../contexts/TemaContexto';
import { useTamanhoTela } from '../../hooks/useTamanhoTela';
import { NOMES_MESES } from '../../utils/months';
import SinoNotificacoes from '../Notificacoes/SinoNotificacoes';
import type { Notificacao } from '../../hooks/useNotificacoes';

interface Props {
  nomeUsuario?: string;
  mesAtual: number;
  anoAtual: number;
  aoMesAnterior: () => void;
  aoProximoMes: () => void;
  aoSair: () => void;
  mostrarMeses?: boolean;
  aoAbrirMenu?: () => void;
  notificacoes?: Notificacao[];
  aoClicarNotificacao?: (notif: Notificacao) => void;
}

const IconMenu = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

export default function HeaderGlobal({
  nomeUsuario, mesAtual, anoAtual,
  aoMesAnterior, aoProximoMes, aoSair: _aoSair,
  mostrarMeses = true, aoAbrirMenu,
  notificacoes = [], aoClicarNotificacao = () => {},
}: Props) {
  const { cores, tema, alternarTema } = useTema();
  const { ehDesktop } = useTamanhoTela();

  const mesLabel     = `${NOMES_MESES[mesAtual-1].slice(0,3).toLowerCase()}/${String(anoAtual).slice(2)}`;
  const mesAntLabel  = mesAtual === 1
    ? `${NOMES_MESES[11].slice(0,3).toLowerCase()}/${anoAtual-1}`
    : `${NOMES_MESES[mesAtual-2].slice(0,3).toLowerCase()}/${String(anoAtual).slice(2)}`;
  const mesProxLabel = mesAtual === 12
    ? `${NOMES_MESES[0].slice(0,3).toLowerCase()}/${anoAtual+1}`
    : `${NOMES_MESES[mesAtual].slice(0,3).toLowerCase()}/${String(anoAtual).slice(2)}`;

  const btnIcon = {
    width: 38, height: 38, borderRadius: 11, border: 'none',
    background: cores.bgTerciario, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: cores.textoSutil, transition: 'background .2s', flexShrink: 0 as const,
  };

  // ── Desktop: barra fixa com meses centralizados ──────────────────
  if (ehDesktop) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 60, right: 0, zIndex: 200, height: 64,
        background: cores.bgPrimario,
        borderBottom: `1px solid ${cores.borda}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        transition: 'background .3s, border-color .3s',
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
          Olá, <span style={{ color: cores.textoTitulo }}>{nomeUsuario ?? 'Usuário'}</span> 👋
        </div>

        {mostrarMeses && (
          <div style={{ display: 'flex', background: cores.bgTerciario, borderRadius: 14, padding: 3, gap: 2 }}>
            {[
              { label: mesAntLabel,  ativo: false, acao: aoMesAnterior },
              { label: mesLabel,     ativo: true,  acao: () => {} },
              { label: mesProxLabel, ativo: false, acao: aoProximoMes },
            ].map(({ label, ativo, acao }) => (
              <button key={label} onClick={acao} style={{
                padding: '8px 22px', borderRadius: 11, border: 'none', cursor: 'pointer',
                background: ativo ? cores.bgCard : 'transparent',
                color: ativo ? cores.textoTitulo : cores.textoSutil,
                fontWeight: ativo ? 700 : 400,
                fontSize: ativo ? 14 : 13,
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: ativo ? cores.sombra : 'none',
                transition: 'all .2s ease',
              }}>{label}</button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={alternarTema} style={{ ...btnIcon, fontSize: 17 }} title={tema === 'claro' ? 'Modo escuro' : 'Modo claro'}>
            {tema === 'claro' ? '🌙' : '☀️'}
          </button>
          <SinoNotificacoes notificacoes={notificacoes} aoClicar={aoClicarNotificacao} />
        </div>
      </div>
    );
  }

  // ── Mobile: header com hamburguer ────────────────────────────────
  return (
    <div style={{
      position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, zIndex: 200,
      background: cores.bgPrimario,
      borderBottom: `1px solid ${cores.borda}`,
      transition: 'background .3s ease, border-color .3s ease',
    }}>
      {/* Linha do topo */}
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Botão hamburguer (≡) — esquerda */}
        <button
          onClick={aoAbrirMenu}
          style={{
            ...btnIcon,
            background: 'transparent',
            color: cores.textoTitulo,
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = cores.bgTerciario}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <IconMenu />
        </button>

        {/* Saudação — cresce e ocupa o espaço do meio */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", lineHeight: 1 }}>
            Bem-vindo de volta!
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginTop: 3, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Olá, {nomeUsuario ?? 'Usuário'}! 👋
          </div>
        </div>

        {/* Ações direita */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={alternarTema} style={{ ...btnIcon, fontSize: 17 }}>
            {tema === 'claro' ? '🌙' : '☀️'}
          </button>
          <SinoNotificacoes notificacoes={notificacoes} aoClicar={aoClicarNotificacao} />
        </div>
      </div>

      {/* Seletor de meses */}
      {mostrarMeses && (
        <div style={{ padding: '0 16px 13px' }}>
          <div style={{ display: 'flex', background: cores.bgTerciario, borderRadius: 14, padding: 3, gap: 2 }}>
            {[
              { label: mesAntLabel,  ativo: false, acao: aoMesAnterior },
              { label: mesLabel,     ativo: true,  acao: () => {} },
              { label: mesProxLabel, ativo: false, acao: aoProximoMes },
            ].map(({ label, ativo, acao }) => (
              <button key={label} onClick={acao} style={{
                flex: 1, padding: '8px 4px', borderRadius: 11, border: 'none', cursor: 'pointer',
                background: ativo ? cores.bgCard : 'transparent',
                color: ativo ? cores.textoTitulo : cores.textoSutil,
                fontWeight: ativo ? 700 : 400,
                fontSize: ativo ? 14 : 12,
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: ativo ? cores.sombra : 'none',
                transition: 'all .2s ease',
              }}>{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
