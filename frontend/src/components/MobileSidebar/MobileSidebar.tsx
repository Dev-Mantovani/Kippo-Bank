import { useEffect } from 'react';
import { useTema } from '../../contexts/TemaContexto';

type Tela = 'dashboard' | 'transacoes' | 'relatorios' | 'membros';

interface Props {
  aberto: boolean;
  telaAtiva: Tela;
  definirTela: (t: Tela) => void;
  nomeUsuario?: string;
  aoFechar: () => void;
  aoSair: () => void;
}

const IconHome = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconList = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconChart = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconUsers = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconLogout = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const ITENS: { id: Tela; icone: React.ReactNode; rotulo: string }[] = [
  { id: 'dashboard',  icone: <IconHome />,  rotulo: 'Dashboard' },
  { id: 'transacoes', icone: <IconList />,  rotulo: 'Transações' },
  { id: 'relatorios', icone: <IconChart />, rotulo: 'Relatórios' },
  { id: 'membros',    icone: <IconUsers />, rotulo: 'Família' },
];

export default function MobileSidebar({ aberto, telaAtiva, definirTela, nomeUsuario, aoFechar, aoSair }: Props) {
  const { cores, tema, alternarTema } = useTema();

  // Trava o scroll do body quando o menu está aberto
  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [aberto]);

  const handleNavegar = (tela: Tela) => {
    definirTela(tela);
    aoFechar();
  };

  return (
    <>
      {/* Overlay escuro */}
      <div
        onClick={aoFechar}
        style={{
          position: 'fixed', inset: 0, zIndex: 800,
          background: 'rgba(0,0,0,.55)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          opacity: aberto ? 1 : 0,
          pointerEvents: aberto ? 'auto' : 'none',
          transition: 'opacity .28s ease',
        }}
      />

      {/* Painel lateral */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 900,
        width: 272,
        background: cores.bgCard,
        borderRight: `1px solid ${cores.borda}`,
        display: 'flex', flexDirection: 'column',
        transform: aberto ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        boxShadow: aberto ? '8px 0 40px rgba(0,0,0,.18)' : 'none',
        overflowY: 'auto',
      }}>

        {/* Cabeçalho do sidebar */}
        <div style={{
          padding: '22px 16px 16px',
          borderBottom: `1px solid ${cores.borda}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#FFB6C1,#FF69B4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 800, color: '#fff',
              boxShadow: '0 2px 10px rgba(255,105,180,.45)',
            }}>
              {(nomeUsuario?.[0] ?? 'U').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", lineHeight: 1 }}>
                Bem-vindo de volta!
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginTop: 3, lineHeight: 1 }}>
                {nomeUsuario ?? 'Usuário'}
              </div>
            </div>
          </div>

          {/* Botão fechar (X) */}
          <button
            onClick={aoFechar}
            style={{
              width: 36, height: 36, borderRadius: 12,
              border: 'none', background: cores.bgTerciario,
              cursor: 'pointer', color: cores.textoSutil, fontSize: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = cores.borda}
            onMouseLeave={e => e.currentTarget.style.background = cores.bgTerciario}
          >
            ×
          </button>
        </div>

        {/* Itens de navegação */}
        <nav style={{ flex: 1, padding: '14px 12px 0' }}>
          {ITENS.map(item => {
            const ativo = telaAtiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavegar(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px',
                  border: 'none', cursor: 'pointer',
                  width: '100%', textAlign: 'left',
                  borderRadius: 14, marginBottom: 4,
                  background: ativo
                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                    : 'transparent',
                  color: ativo ? '#fff' : cores.textoSutil,
                  boxShadow: ativo ? '0 4px 16px rgba(59,130,246,.38)' : 'none',
                  transition: 'all .15s ease',
                  fontFamily: "'DM Sans',sans-serif",
                }}
                onMouseEnter={e => { if (!ativo) e.currentTarget.style.background = cores.bgTerciario; }}
                onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {item.icone}
                </span>
                <span style={{ fontSize: 15, fontWeight: ativo ? 700 : 500 }}>
                  {item.rotulo}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Rodapé: tema + sair */}
        <div style={{ padding: '12px 12px 28px', borderTop: `1px solid ${cores.borda}`, marginTop: 12 }}>
          {/* Alternar tema */}
          <button
            onClick={alternarTema}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              width: '100%', textAlign: 'left',
              borderRadius: 14, marginBottom: 4,
              color: cores.textoSutil,
              fontFamily: "'DM Sans',sans-serif",
              transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = cores.bgTerciario}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tema === 'claro' ? '🌙' : '☀️'}</span>
            <span style={{ fontSize: 15, fontWeight: 500 }}>
              {tema === 'claro' ? 'Modo escuro' : 'Modo claro'}
            </span>
          </button>

          {/* Sair */}
          <button
            onClick={aoSair}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              width: '100%', textAlign: 'left',
              borderRadius: 14, color: '#EF4444',
              fontFamily: "'DM Sans',sans-serif",
              transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFF1F2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}><IconLogout /></span>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}
