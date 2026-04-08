import { useState } from 'react';
import { useTema } from '../../contexts/TemaContexto';
import { useScrollLock } from '../../hooks/useScrollLock';
import { ContaService } from '../../services/ContaService';
import { validarConta, parsearValor } from '../../validators/transacaoValidator';
import type { Conta, TipoConta } from '../../types';
import { createPortal } from 'react-dom';

interface Props {
  idUsuario: string;
  conta: Conta | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}

const TIPOS_CONTA: { valor: TipoConta; rotulo: string; emoji: string; desc: string }[] = [
  { valor: 'corrente',    rotulo: 'Corrente',     emoji: '🏦', desc: 'Conta do dia a dia' },
  { valor: 'poupanca',    rotulo: 'Poupança',     emoji: '🐷', desc: 'Guardar dinheiro' },
  { valor: 'investimento',rotulo: 'Investimento', emoji: '📈', desc: 'Renda variável/fixa' },
];

const CORES_CONTA = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#820AD1', '#CC092F', '#FF6B00',
];

const BANCOS = [
  'Nubank', 'Itaú', 'Bradesco', 'Santander', 'Caixa',
  'Banco do Brasil', 'Inter', 'C6 Bank', 'XP', 'BTG', 'Sicoob', 'Outro',
];

export default function ModalConta({ idUsuario, conta, aoFechar, aoSalvar }: Props) {
  const { cores } = useTema();
  useScrollLock(true);

  const [nome,    setNome]    = useState(conta?.nome  ?? '');
  const [tipo,    setTipo]    = useState<TipoConta>(conta?.tipo  ?? 'corrente');
  const [saldo,   setSaldo]   = useState(conta?.saldo?.toString() ?? '0');
  const [cor,     setCor]     = useState(conta?.cor   ?? '#3b82f6');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (validarConta({ nome })) return;
    setSalvando(true);
    try {
      const payload = { nome: nome.trim(), tipo, saldo: parsearValor(saldo) || 0, cor };
      if (conta) {
        await ContaService.atualizar(conta.id, payload);
      } else {
        await ContaService.criar(idUsuario, payload);
      }
      aoSalvar();
    } finally {
      setSalvando(false);
    }
  };

  const podeSalvar = nome.trim() && !salvando;

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '.7px',
    textTransform: 'uppercase', color: cores.textoSutil,
    fontFamily: "'DM Sans',sans-serif", marginBottom: 6, display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px', borderRadius: 14,
    border: `1.5px solid ${cores.borda}`,
    background: cores.bgTerciario, color: cores.textoCorpo,
    fontSize: 16, fontFamily: "'DM Sans',sans-serif",
    outline: 'none', boxSizing: 'border-box',
    WebkitAppearance: 'none',
    transition: 'border-color .2s',
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div
        onClick={aoFechar}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999,
        background: cores.bgCard,
        borderRadius: '24px 24px 0 0',
        height: 'min(90dvh, 90vh)',
        maxHeight: 'min(90dvh, 90vh)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(0,0,0,.25)',
        animation: 'entrarSheet .3s cubic-bezier(.16,1,.3,1)',
        overflow: 'hidden',
      }}>

        {/* Cabeçalho fixo */}
        <div style={{
          flexShrink: 0, padding: '14px 20px 12px',
          borderBottom: `1px solid ${cores.borda}`,
          background: cores.bgCard,
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: cores.bgTerciario, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>
              🏦 {conta ? 'Editar Conta' : 'Nova Conta'}
            </div>
            <button
              onClick={aoFechar}
              style={{
                width: 36, height: 36, borderRadius: 12, border: 'none',
                background: cores.bgTerciario, cursor: 'pointer',
                color: cores.textoSutil, fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <div style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch' as any,
          padding: '20px 20px 8px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>

          {/* Preview da conta */}
          <div style={{
            background: `linear-gradient(135deg, ${cor}, ${cor}cc)`,
            borderRadius: 20, padding: '20px 22px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: `0 8px 24px ${cor}55`,
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
                {TIPOS_CONTA.find(t => t.valor === tipo)?.rotulo ?? 'Conta'}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
                {nome || 'Nome da conta'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontFamily: "'DM Sans',sans-serif" }}>Saldo</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>
                R$ {(parseFloat(saldo.replace(',', '.')) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome da conta</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {BANCOS.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setNome(b)}
                  style={{
                    padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                    background: nome === b ? cor : cores.bgTerciario,
                    color: nome === b ? '#fff' : cores.textoSutil,
                    fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                    transition: 'all .15s',
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
            <input
              style={inputStyle}
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ou digite o nome..."
              onFocus={e => e.target.style.borderColor = cor}
              onBlur={e => e.target.style.borderColor = cores.borda}
            />
          </div>

          {/* Tipo */}
          <div>
            <label style={labelStyle}>Tipo de conta</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {TIPOS_CONTA.map(t => {
                const sel = tipo === t.valor;
                return (
                  <button
                    key={t.valor}
                    type="button"
                    onClick={() => setTipo(t.valor)}
                    style={{
                      padding: '14px 8px', borderRadius: 16,
                      border: `2px solid ${sel ? cor : cores.borda}`,
                      background: sel ? `${cor}18` : cores.bgTerciario,
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all .18s',
                      transform: sel ? 'scale(1.04)' : 'scale(1)',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{t.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sel ? cor : cores.textoSutil, fontFamily: "'DM Sans',sans-serif", textAlign: 'center' }}>
                      {t.rotulo}
                    </span>
                    <span style={{ fontSize: 10, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", textAlign: 'center' }}>
                      {t.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saldo inicial */}
          <div>
            <label style={labelStyle}>Saldo atual (R$)</label>
            <input
              style={inputStyle}
              type="text"
              inputMode="decimal"
              value={saldo}
              onChange={e => setSaldo(e.target.value.replace(/[^0-9,.]/g, ''))}
              placeholder="0,00"
              onFocus={e => { e.target.select(); e.target.style.borderColor = cor; }}
              onBlur={e => e.target.style.borderColor = cores.borda}
            />
          </div>

          {/* Cor */}
          <div>
            <label style={labelStyle}>Cor</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {CORES_CONTA.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: c, border: 'none', padding: 0, cursor: 'pointer',
                    outline: cor === c ? `3px solid ${c}` : '3px solid transparent',
                    outlineOffset: 3,
                    transform: cor === c ? 'scale(1.22)' : 'scale(1)',
                    boxShadow: cor === c ? `0 0 0 5px ${c}30, 0 4px 12px ${c}55` : `0 2px 8px ${c}44`,
                    transition: 'all .18s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {cor === c && (
                    <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 4 }} />
        </div>

        {/* Rodapé fixo */}
        <div style={{
          flexShrink: 0, padding: '12px 20px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          borderTop: `1px solid ${cores.borda}`,
          background: cores.bgCard,
        }}>
          <button
            type="button"
            onClick={salvar}
            disabled={!podeSalvar}
            style={{
              width: '100%', padding: '17px', borderRadius: 16, border: 'none',
              cursor: podeSalvar ? 'pointer' : 'not-allowed',
              background: podeSalvar
                ? `linear-gradient(135deg, ${cor}, ${cor}cc)`
                : cores.bgTerciario,
              color: podeSalvar ? '#fff' : cores.textoSutil,
              fontSize: 16, fontWeight: 800,
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: podeSalvar ? `0 6px 20px ${cor}55` : 'none',
              transition: 'all .25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, minHeight: 54,
            }}
          >
            {salvando
              ? <><Spinner /> Salvando...</>
              : conta ? '✅ Salvar alterações' : '🏦 Adicionar Conta'
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes entrarSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>,
    document.body,
  );
}

function Spinner() {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      border: '2.5px solid rgba(255,255,255,.35)',
      borderTop: '2.5px solid #fff',
      animation: 'spin .7s linear infinite', flexShrink: 0,
    }} />
  );
}
