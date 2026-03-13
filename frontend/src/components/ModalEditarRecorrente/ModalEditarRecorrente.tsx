import { useState } from 'react';

type Props = {
  transacao: { titulo: string; valor: number; tipo: string };
  onConfirmar: (modo: 'apenas_esta' | 'todas') => Promise<void>;
  onCancelar: () => void;
};

export function ModalEditarRecorrente({ transacao, onConfirmar, onCancelar }: Props) {
  const [carregando, setCarregando] = useState(false);
  const [selecionado, setSelecionado] = useState<'apenas_esta' | 'todas' | null>(null);

  const handleConfirmar = async () => {
    if (!selecionado) return;
    setCarregando(true);
    await onConfirmar(selecionado);
    setCarregando(false);
  };

  const cor = '#3b82f6'; // azul para edição

  return (
    <div style={estilos.overlay}>
      <div style={estilos.modal}>
        <div style={estilos.iconeContainer}>
          <span style={estilos.icone}>✏️</span>
        </div>

        <h2 style={estilos.titulo}>Editar transação recorrente</h2>
        <p style={estilos.subtitulo}>
          <strong>{transacao.titulo}</strong> é recorrente. Deseja editar apenas este mês ou todas as ocorrências futuras?
        </p>

        <div style={estilos.opcoesContainer}>
          {/* Apenas este mês */}
          <button
            style={{
              ...estilos.opcao,
              ...(selecionado === 'apenas_esta' ? { background: '#eff6ff', borderColor: cor } : {}),
            }}
            onClick={() => setSelecionado('apenas_esta')}
          >
            <div style={estilos.opcaoHeader}>
              <span style={estilos.opcaoIcone}>📅</span>
              <span style={estilos.opcaoTitulo}>Apenas este mês</span>
              {selecionado === 'apenas_esta' && (
                <span style={{ color: cor, fontWeight: 700, fontSize: 16 }}>✓</span>
              )}
            </div>
            <p style={estilos.opcaoDesc}>Somente esta ocorrência será alterada.</p>
          </button>

          {/* Todas as recorrências */}
          <button
            style={{
              ...estilos.opcao,
              ...(selecionado === 'todas' ? { background: '#eff6ff', borderColor: cor } : {}),
            }}
            onClick={() => setSelecionado('todas')}
          >
            <div style={estilos.opcaoHeader}>
              <span style={estilos.opcaoIcone}>🔄</span>
              <span style={estilos.opcaoTitulo}>Esta e as futuras</span>
              {selecionado === 'todas' && (
                <span style={{ color: cor, fontWeight: 700, fontSize: 16 }}>✓</span>
              )}
            </div>
            <p style={estilos.opcaoDesc}>Atualiza este mês e todos os meses seguintes.</p>
          </button>
        </div>

        <div style={estilos.botoes}>
          <button style={estilos.btnCancelar} onClick={onCancelar} disabled={carregando}>
            Cancelar
          </button>
          <button
            style={{
              ...estilos.btnConfirmar,
              ...(!selecionado ? estilos.btnDesabilitado : { background: cor }),
            }}
            onClick={handleConfirmar}
            disabled={!selecionado || carregando}
          >
            {carregando ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const estilos: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000, padding: '16px', backdropFilter: 'blur(3px)',
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '20px', padding: '28px 24px',
    width: '100%', maxWidth: '380px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  iconeContainer: { display: 'flex', justifyContent: 'center' },
  icone: { fontSize: '40px' },
  titulo: { margin: 0, fontSize: '18px', fontWeight: 700, color: '#1a1a2e', textAlign: 'center' },
  subtitulo: { margin: 0, fontSize: '14px', color: '#666', textAlign: 'center', lineHeight: '1.5' },
  opcoesContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  opcao: {
    background: '#f8f9fa', border: '2px solid #e9ecef',
    borderRadius: '14px', padding: '14px 16px',
    cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.15s ease', width: '100%',
  },
  opcaoHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  opcaoIcone: { fontSize: '18px' },
  opcaoTitulo: { fontSize: '14px', fontWeight: 600, color: '#1a1a2e', flex: 1 },
  opcaoDesc: { margin: 0, fontSize: '12px', color: '#888', lineHeight: '1.4', paddingLeft: '26px' },
  botoes: { display: 'flex', gap: '10px', marginTop: '4px' },
  btnCancelar: {
    flex: 1, padding: '13px', borderRadius: '12px',
    border: '2px solid #e9ecef', background: '#fff',
    color: '#666', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },
  btnConfirmar: {
    flex: 1, padding: '13px', borderRadius: '12px',
    border: 'none', background: '#3b82f6',
    color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },
  btnDesabilitado: { background: '#d1d5db', cursor: 'not-allowed' },
};
