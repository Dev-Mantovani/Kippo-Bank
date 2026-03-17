import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import { useScrollLock } from '../../hooks/useScrollLock';
import type { Cartao } from '../../types';
import { createPortal } from 'react-dom';

interface Props {
  idUsuario: string;
  cartao: Cartao | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}

const CORES_CARTAO = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#2C3E50', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#820AD1', '#CC092F', '#FF6200',
];

const BANCOS_CARTAO = [
  'Nubank', 'Itaú', 'Bradesco', 'Santander',
  'Caixa', 'Inter', 'C6 Bank', 'BTG', 'XP', 'Outro',
];

const DIAS_FECHAMENTO = Array.from({ length: 28 }, (_, i) => i + 1);
const DIAS_RAPIDOS = [1, 5, 8, 10, 12, 15, 18, 20, 25, 28];

export default function ModalCartao({ idUsuario, cartao, aoFechar, aoSalvar }: Props) {
  const { cores } = useTema();
  useScrollLock(true);

  const [nome,          setNome]          = useState(cartao?.nome           ?? '');
  const [limite,        setLimite]        = useState(cartao?.limite?.toString() ?? '');
  const [cor,           setCor]           = useState(cartao?.cor             ?? '#1a1a2e');
  const [fechamentoDia, setFechamentoDia] = useState(cartao?.fechamento_dia  ?? 10);
  const [salvando,      setSalvando]      = useState(false);

  const salvar = async () => {
    if (!nome.trim() || !limite) return;
    setSalvando(true);
    try {
      const payload = {
        user_id:        idUsuario,
        nome:           nome.trim(),
        limite:         parseFloat(limite.replace(',', '.')) || 0,
        usado:          0, // calculado dinamicamente pelas transações
        cor,
        fechamento_dia: fechamentoDia,
      };
      if (cartao) {
        await supabase.from('cards').update(payload).eq('id', cartao.id);
      } else {
        await supabase.from('cards').insert(payload);
      }
      aoSalvar();
    } finally {
      setSalvando(false);
    }
  };

  const podeSalvar = nome.trim() && limite && !salvando;
  const limiteNum  = parseFloat(limite.replace(',', '.')) || 0;

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
    WebkitAppearance: 'none', transition: 'border-color .2s',
  };
  const accentColor = '#3b82f6';

  return createPortal(
    <>
      <div onClick={aoFechar} style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999, background: cores.bgCard, borderRadius: '24px 24px 0 0', height: 'min(90dvh, 90vh)', maxHeight: 'min(90dvh, 90vh)', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,.25)', animation: 'entrarSheet .3s cubic-bezier(.16,1,.3,1)', overflow: 'hidden' }}>

        {/* Cabeçalho */}
        <div style={{ flexShrink: 0, padding: '14px 20px 12px', borderBottom: `1px solid ${cores.borda}`, background: cores.bgCard }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: cores.bgTerciario, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>
              💳 {cartao ? 'Editar Cartão' : 'Novo Cartão'}
            </div>
            <button onClick={aoFechar} style={{ width: 36, height: 36, borderRadius: 12, border: 'none', background: cores.bgTerciario, cursor: 'pointer', color: cores.textoSutil, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' as any, padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Preview do cartão */}
          <div style={{ background: cor, borderRadius: 20, padding: '22px 22px 18px', position: 'relative', overflow: 'hidden', minHeight: 130, boxShadow: '0 12px 32px rgba(0,0,0,.35)' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
            <div style={{ width: 36, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#f5d87b,#c8971a)', marginBottom: 18 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>
                  {nome || 'Nome do Cartão'}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
                  Fecha dia {fechamentoDia} • Fatura automática
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', fontFamily: "'DM Sans',sans-serif" }}>Limite</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>
                  R$ {limiteNum.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{ background: cores.azulFundo, borderRadius: 14, padding: '12px 16px', border: `1px solid ${cores.azulPrimario}33`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: cores.azulPrimario, fontFamily: "'DM Sans',sans-serif" }}>
                Fatura calculada automaticamente
              </div>
              <div style={{ fontSize: 12, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 2, lineHeight: 1.4 }}>
                O valor da fatura é somado a partir das despesas lançadas com este cartão no período de fechamento.
              </div>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome do cartão</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {BANCOS_CARTAO.map(b => (
                <button key={b} type="button" onClick={() => setNome(b)} style={{ padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', background: nome === b ? accentColor : cores.bgTerciario, color: nome === b ? '#fff' : cores.textoSutil, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", transition: 'all .15s' }}>
                  {b}
                </button>
              ))}
            </div>
            <input style={inputStyle} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ou digite o nome..." onFocus={e => e.target.style.borderColor = accentColor} onBlur={e => e.target.style.borderColor = cores.borda} />
          </div>

          {/* Limite */}
          <div>
            <label style={labelStyle}>Limite total (R$)</label>
            <input style={inputStyle} type="text" inputMode="decimal" value={limite} onChange={e => setLimite(e.target.value.replace(/[^0-9,.]/g, ''))} placeholder="5.000,00" onFocus={e => { e.target.select(); e.target.style.borderColor = accentColor; }} onBlur={e => e.target.style.borderColor = cores.borda} />
          </div>

          {/* Dia fechamento */}
          <div>
            <label style={labelStyle}>Dia de fechamento da fatura</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {DIAS_RAPIDOS.map(d => (
                <button key={d} type="button" onClick={() => setFechamentoDia(d)} style={{ width: 46, height: 46, borderRadius: 14, border: `2px solid ${fechamentoDia === d ? accentColor : cores.borda}`, background: fechamentoDia === d ? `${accentColor}18` : cores.bgTerciario, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: fechamentoDia === d ? accentColor : cores.textoSutil, fontFamily: "'DM Sans',sans-serif", transition: 'all .15s' }}>
                  {d}
                </button>
              ))}
            </div>
            <select style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }} value={fechamentoDia} onChange={e => setFechamentoDia(Number(e.target.value))}>
              {DIAS_FECHAMENTO.map(d => <option key={d} value={d}>Dia {d}</option>)}
            </select>
          </div>

          {/* Cor */}
          <div>
            <label style={labelStyle}>Cor do cartão</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {CORES_CARTAO.map(c => (
                <button key={c} type="button" onClick={() => setCor(c)} style={{ width: 36, height: 36, borderRadius: 10, background: c, border: 'none', padding: 0, cursor: 'pointer', outline: cor === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 3, transform: cor === c ? 'scale(1.2)' : 'scale(1)', boxShadow: cor === c ? `0 0 0 5px ${c}30, 0 4px 12px ${c}55` : '0 2px 8px rgba(0,0,0,.25)', transition: 'all .18s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

        {/* Rodapé */}
        <div style={{ flexShrink: 0, padding: '12px 20px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', borderTop: `1px solid ${cores.borda}`, background: cores.bgCard }}>
          <button type="button" onClick={salvar} disabled={!podeSalvar} style={{ width: '100%', padding: '17px', borderRadius: 16, border: 'none', cursor: podeSalvar ? 'pointer' : 'not-allowed', background: podeSalvar ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : cores.bgTerciario, color: podeSalvar ? '#fff' : cores.textoSutil, fontSize: 16, fontWeight: 800, fontFamily: "'DM Sans',sans-serif", boxShadow: podeSalvar ? '0 6px 20px rgba(59,130,246,.45)' : 'none', transition: 'all .25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 54 }}>
            {salvando ? <><Spinner /> Salvando...</> : cartao ? '✅ Salvar alterações' : '💳 Adicionar Cartão'}
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
  return <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,.35)', borderTop: '2.5px solid #fff', animation: 'spin .7s linear infinite', flexShrink: 0 }} />;
}
