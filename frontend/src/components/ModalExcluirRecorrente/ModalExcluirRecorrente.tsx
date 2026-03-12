// components/ModalExcluirRecorrente.tsx
import { useState } from 'react';

type Props = {
  transacao: {
    titulo: string;
    valor: number;
    tipo: string;
  };
  onConfirmar: (modo: 'apenas_esta' | 'todas') => Promise<void>;
  onCancelar: () => void;
};

export function ModalExcluirRecorrente({ transacao, onConfirmar, onCancelar }: Props) {
  const [carregando, setCarregando] = useState(false);
  const [selecionado, setSelecionado] = useState<'apenas_esta' | 'todas' | null>(null);

  const handleConfirmar = async () => {
    if (!selecionado) return;
    setCarregando(true);
    await onConfirmar(selecionado);
    setCarregando(false);
  };

  return (
    <div style={estilos.overlay}>
      <div style={estilos.modal}>
        {/* Ícone */}
        <div style={estilos.iconeContainer}>
          <span style={estilos.icone}>🔁</span>
        </div>

        {/* Título */}
        <h2 style={estilos.titulo}>Excluir transação recorrente</h2>
        <p style={estilos.subtitulo}>
          <strong>{transacao.titulo}</strong> é uma transação recorrente.
          Deseja realmente excluir?
        </p>

        {/* Opções */}
        <div style={estilos.opcoesContainer}>

          <button
            style={{
              ...estilos.opcao,
              ...(selecionado === 'todas' ? estilos.opcaoSelecionadaPerigo : {}),
            }}
            onClick={() => setSelecionado('todas')}
          >
            <div style={estilos.opcaoHeader}>
              <span style={estilos.opcaoIcone}>🗑️</span>
              <span style={estilos.opcaoTitulo}>Todas as recorrências</span>
              {selecionado === 'todas' && <span style={estilos.checkPerigo}>✓</span>}
            </div>
            <p style={estilos.opcaoDesc}>
              Remove este e todos os meses futuros. A recorrência é encerrada.
            </p>
          </button>
        </div>

        {/* Botões */}
        <div style={estilos.botoes}>
          <button
            style={estilos.btnCancelar}
            onClick={onCancelar}
            disabled={carregando}
          >
            Cancelar
          </button>
          <button
            style={{
              ...estilos.btnConfirmar,
              ...(selecionado === 'todas' ? estilos.btnConfirmarPerigo : {}),
              ...(!selecionado ? estilos.btnDesabilitado : {}),
            }}
            onClick={handleConfirmar}
            disabled={!selecionado || carregando}
          >
            {carregando ? 'Excluindo...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const estilos: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
    backdropFilter: 'blur(2px)',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '28px 24px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  iconeContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  icone: {
    fontSize: '40px',
  },
  titulo: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  subtitulo: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    lineHeight: '1.5',
  },
  opcoesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  opcao: {
    background: '#f8f9fa',
    border: '2px solid #e9ecef',
    borderRadius: '14px',
    padding: '14px 16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    width: '100%',
  },
  opcaoSelecionada: {
    background: '#f0fdf4',
    borderColor: '#22c55e',
  },
  opcaoSelecionadaPerigo: {
    background: '#fff5f5',
    borderColor: '#ef4444',
  },
  opcaoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  opcaoIcone: {
    fontSize: '18px',
  },
  opcaoTitulo: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
    flex: 1,
  },
  check: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: '16px',
  },
  checkPerigo: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: '16px',
  },
  opcaoDesc: {
    margin: 0,
    fontSize: '12px',
    color: '#888',
    lineHeight: '1.4',
    paddingLeft: '26px',
  },
  botoes: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px',
  },
  btnCancelar: {
    flex: 1,
    padding: '13px',
    borderRadius: '12px',
    border: '2px solid #e9ecef',
    background: '#fff',
    color: '#666',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnConfirmar: {
    flex: 1,
    padding: '13px',
    borderRadius: '12px',
    border: 'none',
    background: '#22c55e',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnConfirmarPerigo: {
    background: '#ef4444',
  },
  btnDesabilitado: {
    background: '#d1d5db',
    cursor: 'not-allowed',
  },
};
