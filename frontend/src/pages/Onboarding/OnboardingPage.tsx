import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import AvatarPicker from '../../components/AvatarPicker/AvatarPicker';
import type { TipoFamilia, TipoRelacao } from '../../types';

interface Props {
  idUsuario: string;
  aoConcluir: () => void;
}

const CORES_AVATAR = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#a855f7', '#84cc16',
];

const TODAS_RELACOES: { valor: TipoRelacao; rotulo: string; emoji: string }[] = [
  { valor: 'eu',      rotulo: 'Eu',       emoji: '😊' },
  { valor: 'pai',     rotulo: 'Pai',      emoji: '👨' },
  { valor: 'mae',     rotulo: 'Mãe',      emoji: '👩' },
  { valor: 'conjuge', rotulo: 'Cônjuge',  emoji: '💑' },
  { valor: 'filho',   rotulo: 'Filho(a)', emoji: '👶' },
  { valor: 'irmao',   rotulo: 'Irmão(ã)', emoji: '🧑' },
  { valor: 'outro',   rotulo: 'Outro',    emoji: '👤' },
];

const RELACOES_OUTROS = TODAS_RELACOES.filter(r => r.valor !== 'eu');

const TIPOS_FAMILIA: { valor: TipoFamilia; rotulo: string; icone: string; desc: string }[] = [
  { valor: 'sozinho',       rotulo: 'Sozinho(a)',   icone: '👤', desc: 'Só eu' },
  { valor: 'casado',        rotulo: 'Casado(a)',    icone: '💑', desc: 'Com cônjuge' },
  { valor: 'morando_junto', rotulo: 'Junto(a)',     icone: '👫', desc: 'Morando junto' },
  { valor: 'familia',       rotulo: 'Família',      icone: '👨‍👩‍👧‍👦', desc: 'Com filhos' },
];

interface MembroForm {
  nome: string;
  relacao: TipoRelacao;
  cor: string;
  fotoPreview: string | null;
  arquivo: File | null;
}

const membroVazio = (): MembroForm => ({
  nome: '', relacao: 'conjuge', cor: '#6366f1',
  fotoPreview: null, arquivo: null,
});

export default function PaginaOnboarding({ idUsuario, aoConcluir }: Props) {
  const { cores } = useTema();
  const [passo,       setPasso]       = useState(1);
  const [salvando,    setSalvando]    = useState(false);

  // Passo 1 — perfil do dono
  const [nome,            setNome]            = useState('');
  const [corDono,         setCorDono]         = useState('#6366f1');
  const [relacaoDono,     setRelacaoDono]     = useState<TipoRelacao>('eu');
  const [wppDono,         setWppDono]         = useState('');
  const [fotoPreviewDono, setFotoPreviewDono] = useState<string | null>(null);
  const [arquivoDono,     setArquivoDono]     = useState<File | null>(null);

  // Passo 2 — tipo de família
  const [tipoFamilia, setTipoFamilia] = useState<TipoFamilia>('familia');

  // Passo 3 — outros membros
  const [membros, setMembros] = useState<MembroForm[]>([]);
  const [form,    setForm]    = useState<MembroForm>(membroVazio());

  /* ── helpers do formulário de membro ── */
  const atualizarForm = (campos: Partial<MembroForm>) =>
    setForm(prev => ({ ...prev, ...campos }));

  const adicionarMembro = () => {
    if (!form.nome.trim()) return;
    setMembros(prev => [...prev, { ...form }]);
    setForm(membroVazio());
  };

  const removerMembro = (i: number) =>
    setMembros(prev => prev.filter((_, idx) => idx !== i));

  /* ── upload de foto ── */
  const uploadAvatar = async (arquivo: File, prefixo: string): Promise<string | null> => {
    const ext    = arquivo.name.split('.').pop() ?? 'jpg';
    const caminho = `${idUsuario}/${prefixo}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(caminho, arquivo, { upsert: true, cacheControl: '3600' });
    if (error) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(caminho);
    return data.publicUrl;
  };

  /* ── finalizar onboarding ── */
  const finalizar = async () => {
    setSalvando(true);
    try {
      // Atualiza perfil do usuário
      await supabase
        .from('users_profile')
        .update({ nome: nome.trim(), family_type: tipoFamilia, onboarding_completed: true })
        .eq('id', idUsuario);

      // Insere o dono como primeiro membro
      const avatarDono = arquivoDono ? await uploadAvatar(arquivoDono, 'dono') : null;
      const wppFormatado = wppDono.replace(/\D/g, '') || null;
      await supabase.from('family_members').insert({
        user_id:          idUsuario,
        nome:             nome.trim(),
        relacao:          relacaoDono,
        cor:              corDono,
        avatar_url:       avatarDono,
        whatsapp_number:  wppFormatado,
      });

      // Insere os demais membros
      for (const m of membros) {
        const avatarUrl = m.arquivo ? await uploadAvatar(m.arquivo, 'membro') : null;
        await supabase.from('family_members').insert({
          user_id:    idUsuario,
          nome:       m.nome.trim(),
          relacao:    m.relacao,
          cor:        m.cor,
          avatar_url: avatarUrl,
        });
      }

      aoConcluir();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  /* ── estilos comuns ── */
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', borderRadius: 13,
    border: `1.5px solid ${cores.borda}`,
    background: cores.bgTerciario, color: cores.textoCorpo,
    fontSize: 16, fontFamily: "'DM Sans',sans-serif",
    outline: 'none', boxSizing: 'border-box',
    WebkitAppearance: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '.7px',
    textTransform: 'uppercase', color: cores.textoSutil,
    fontFamily: "'DM Sans',sans-serif", marginBottom: 7, display: 'block',
  };

  const coresAvatarPicker = {
    bgCard: cores.bgCard, bgSecundario: cores.bgSecundario,
    bgTerciario: cores.bgTerciario, borda: cores.borda,
    textoCorpo: cores.textoCorpo, textoSutil: cores.textoSutil,
    textoTitulo: cores.textoTitulo, vermelhFundo: cores.vermelhFundo,
    vermelhoTexto: cores.vermelhoTexto,
  };

  return (
    <div style={{
      minHeight: '100dvh', background: cores.bgPrimario,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '24px 16px 40px',
      fontFamily: "'DM Sans',sans-serif",
    }}>
      {/* Indicador de passos */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{
            height: 5, borderRadius: 99,
            width: passo >= n ? 28 : 16,
            background: passo >= n ? '#3b82f6' : cores.bgTerciario,
            transition: 'all .3s',
          }} />
        ))}
      </div>

      <div style={{
        width: '100%', maxWidth: 420,
        background: cores.bgCard, borderRadius: 28,
        padding: '28px 20px',
        border: `1px solid ${cores.borda}`,
        boxShadow: '0 8px 32px rgba(0,0,0,.08)',
        display: 'flex', flexDirection: 'column', gap: 22,
      }}>

        {/* ══ PASSO 1: Seu perfil ══ */}
        {passo === 1 && (
          <>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: cores.textoTitulo, lineHeight: 1.2 }}>
                👋 Seu perfil
              </div>
              <div style={{ fontSize: 14, color: cores.textoSutil, marginTop: 6 }}>
                Você será o primeiro membro da sua família no app
              </div>
            </div>

            {/* Avatar + cor */}
            <div style={{
              background: `linear-gradient(135deg, ${corDono}11, ${corDono}06)`,
              border: `1.5px solid ${corDono}30`,
              borderRadius: 22, padding: '20px 16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            }}>
              <AvatarPicker
                nome={nome}
                cor={corDono}
                fotoAtual={fotoPreviewDono}
                aoSelecionarArquivo={(arquivo, preview) => { setArquivoDono(arquivo); setFotoPreviewDono(preview); }}
                aoRemoverFoto={() => { setArquivoDono(null); setFotoPreviewDono(null); }}
                tamanho={96}
                coresUI={coresAvatarPicker}
              />

              {/* Paleta de cores */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {CORES_AVATAR.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCorDono(c)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: c, border: 'none', padding: 0, cursor: 'pointer',
                      outline: corDono === c ? `3px solid ${c}` : '3px solid transparent',
                      outlineOffset: 3,
                      transform: corDono === c ? 'scale(1.22)' : 'scale(1)',
                      boxShadow: corDono === c ? `0 0 0 5px ${c}30` : 'none',
                      transition: 'all .15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {corDono === c && (
                      <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Nome */}
            <div>
              <label style={labelStyle}>Seu nome</label>
              <input
                style={{ ...inputStyle, borderColor: nome ? corDono + '60' : cores.borda }}
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: André"
                autoFocus
                onFocus={e => e.target.style.borderColor = corDono}
                onBlur={e => e.target.style.borderColor = nome ? corDono + '60' : cores.borda}
              />
            </div>

            {/* Relação */}
            <div>
              <label style={labelStyle}>Sua relação na família</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                {TODAS_RELACOES.map(r => {
                  const sel = relacaoDono === r.valor;
                  return (
                    <button
                      key={r.valor}
                      type="button"
                      onClick={() => setRelacaoDono(r.valor)}
                      style={{
                        padding: '10px 4px', borderRadius: 13,
                        border: `2px solid ${sel ? corDono : cores.borda}`,
                        background: sel ? `${corDono}18` : cores.bgTerciario,
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        transition: 'all .15s',
                        transform: sel ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <span style={{ fontSize: 20, lineHeight: 1 }}>{r.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: sel ? corDono : cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
                        {r.rotulo}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label style={labelStyle}>
                WhatsApp <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, opacity: .7 }}>(opcional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>📱</span>
                <input
                  value={wppDono}
                  onChange={e => setWppDono(e.target.value)}
                  placeholder="Ex: 11987654321"
                  inputMode="numeric"
                  style={{
                    ...inputStyle,
                    padding: '13px 42px 13px 42px',
                    borderColor: wppDono ? corDono + '60' : cores.borda,
                  }}
                  onFocus={e => e.target.style.borderColor = corDono}
                  onBlur={e => e.target.style.borderColor = wppDono ? corDono + '60' : cores.borda}
                />
                {wppDono && (
                  <button
                    type="button"
                    onClick={() => setWppDono('')}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 26, height: 26, borderRadius: 8,
                      border: 'none', background: cores.bgSecundario,
                      cursor: 'pointer', color: cores.textoSutil,
                      fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >×</button>
                )}
              </div>
              <div style={{ fontSize: 11, color: cores.textoSutil, marginTop: 5 }}>
                Com DDD, só números. Usado para registrar gastos pelo WhatsApp.
              </div>
            </div>

            <button
              onClick={() => setPasso(2)}
              disabled={!nome.trim()}
              style={{
                padding: '16px', borderRadius: 16, border: 'none',
                cursor: nome.trim() ? 'pointer' : 'not-allowed',
                background: nome.trim()
                  ? `linear-gradient(135deg, ${corDono}, ${corDono}cc)`
                  : cores.bgTerciario,
                color: nome.trim() ? '#fff' : cores.textoSutil,
                fontSize: 16, fontWeight: 800,
                boxShadow: nome.trim() ? `0 6px 20px ${corDono}55` : 'none',
                transition: 'all .2s',
              }}
            >
              Continuar →
            </button>
          </>
        )}

        {/* ══ PASSO 2: Tipo família ══ */}
        {passo === 2 && (
          <>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: cores.textoTitulo, lineHeight: 1.2 }}>
                🏠 Como é a sua família?
              </div>
              <div style={{ fontSize: 14, color: cores.textoSutil, marginTop: 6 }}>
                Selecione o que melhor descreve você
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TIPOS_FAMILIA.map(opcao => {
                const sel = tipoFamilia === opcao.valor;
                return (
                  <button
                    key={opcao.valor}
                    type="button"
                    onClick={() => setTipoFamilia(opcao.valor)}
                    style={{
                      padding: '16px 10px',
                      borderRadius: 18,
                      border: `2px solid ${sel ? '#3b82f6' : cores.borda}`,
                      background: sel ? '#3b82f618' : cores.bgTerciario,
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 6,
                      transition: 'all .18s',
                      transform: sel ? 'scale(1.03)' : 'scale(1)',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{opcao.icone}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: sel ? '#3b82f6' : cores.textoCorpo }}>
                      {opcao.rotulo}
                    </span>
                    <span style={{ fontSize: 11, color: cores.textoSutil }}>{opcao.desc}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setPasso(1)}
                style={{
                  flex: 1, padding: '15px', borderRadius: 14, border: `1.5px solid ${cores.borda}`,
                  background: 'transparent', color: cores.textoSutil,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                ← Voltar
              </button>
              <button
                onClick={() => setPasso(3)}
                style={{
                  flex: 2, padding: '15px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                  color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(59,130,246,.4)',
                }}
              >
                Continuar →
              </button>
            </div>
          </>
        )}

        {/* ══ PASSO 3: Outros membros ══ */}
        {passo === 3 && (
          <>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: cores.textoTitulo, lineHeight: 1.2 }}>
                👨‍👩‍👧 Outros membros
              </div>
              <div style={{ fontSize: 14, color: cores.textoSutil, marginTop: 6 }}>
                Quem mais divide as finanças com você? (opcional)
              </div>
            </div>

            {/* Chip do dono já adicionado */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: `${corDono}12`,
              borderRadius: 14,
              border: `1.5px solid ${corDono}30`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: fotoPreviewDono ? '#000' : corDono,
                overflow: 'hidden',
                boxShadow: `0 0 0 2px ${corDono}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {fotoPreviewDono
                  ? <img src={fotoPreviewDono} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{nome[0]?.toUpperCase()}</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: cores.textoTitulo }}>{nome}</div>
                <div style={{ fontSize: 12, color: corDono, fontWeight: 600 }}>
                  {TODAS_RELACOES.find(r => r.valor === relacaoDono)?.emoji}{' '}
                  {TODAS_RELACOES.find(r => r.valor === relacaoDono)?.rotulo}
                </div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#22c55e',
                background: '#22c55e18', padding: '3px 10px', borderRadius: 99,
              }}>
                ✓ Adicionado
              </div>
            </div>

            {/* Lista de membros já adicionados */}
            {membros.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {membros.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: cores.bgTerciario,
                    borderRadius: 14,
                    border: `1px solid ${cores.borda}`,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      overflow: 'hidden', flexShrink: 0,
                      background: m.fotoPreview ? '#000' : m.cor,
                      boxShadow: `0 0 0 2px ${m.cor}44`,
                    }}>
                      {m.fotoPreview
                        ? <img src={m.fotoPreview} alt={m.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>
                            {m.nome[0].toUpperCase()}
                          </div>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: cores.textoTitulo }}>{m.nome}</div>
                      <div style={{ fontSize: 12, color: m.cor, fontWeight: 600 }}>
                        {RELACOES_OUTROS.find(r => r.valor === m.relacao)?.emoji}{' '}
                        {RELACOES_OUTROS.find(r => r.valor === m.relacao)?.rotulo}
                      </div>
                    </div>
                    <button
                      onClick={() => removerMembro(i)}
                      style={{
                        width: 30, height: 30, borderRadius: 9, border: 'none',
                        background: cores.vermelhFundo, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="13" height="13" fill="none" stroke={cores.vermelhoTexto} strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário de novo membro */}
            <div style={{
              background: cores.bgSecundario ?? cores.bgTerciario,
              borderRadius: 22, padding: '20px 16px',
              border: `1.5px solid ${form.cor}30`,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: cores.textoSutil, textAlign: 'center' }}>
                + Adicionar outro membro
              </div>

              <AvatarPicker
                nome={form.nome}
                cor={form.cor}
                fotoAtual={form.fotoPreview}
                aoSelecionarArquivo={(arquivo, preview) => atualizarForm({ arquivo, fotoPreview: preview })}
                aoRemoverFoto={() => atualizarForm({ arquivo: null, fotoPreview: null })}
                tamanho={80}
                coresUI={coresAvatarPicker}
              />

              <div>
                <label style={labelStyle}>Nome do membro</label>
                <input
                  style={inputStyle}
                  value={form.nome}
                  onChange={e => atualizarForm({ nome: e.target.value })}
                  placeholder="Ex: Maria"
                />
              </div>

              <div>
                <label style={labelStyle}>Relação</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
                  {RELACOES_OUTROS.map(r => {
                    const sel = form.relacao === r.valor;
                    return (
                      <button
                        key={r.valor}
                        type="button"
                        onClick={() => atualizarForm({ relacao: r.valor })}
                        style={{
                          padding: '9px 4px',
                          borderRadius: 12,
                          border: `2px solid ${sel ? form.cor : cores.borda}`,
                          background: sel ? `${form.cor}18` : cores.bgTerciario,
                          cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                          transition: 'all .15s',
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{r.emoji}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: sel ? form.cor : cores.textoSutil }}>
                          {r.rotulo}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Cor do avatar</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CORES_AVATAR.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => atualizarForm({ cor: c })}
                      style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: c, border: 'none', padding: 0,
                        cursor: 'pointer',
                        outline: form.cor === c ? `3px solid ${c}` : '3px solid transparent',
                        outlineOffset: 3,
                        transform: form.cor === c ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: form.cor === c ? `0 0 0 5px ${c}30` : 'none',
                        transition: 'all .15s',
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={adicionarMembro}
                disabled={!form.nome.trim()}
                style={{
                  padding: '14px', borderRadius: 14, border: 'none',
                  cursor: form.nome.trim() ? 'pointer' : 'not-allowed',
                  background: form.nome.trim() ? form.cor : cores.bgTerciario,
                  color: form.nome.trim() ? '#fff' : cores.textoSutil,
                  fontSize: 14, fontWeight: 800,
                  boxShadow: form.nome.trim() ? `0 4px 16px ${form.cor}44` : 'none',
                  transition: 'all .2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar membro
              </button>
            </div>

            {/* Rodapé */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={finalizar}
                disabled={salvando}
                style={{
                  padding: '16px', borderRadius: 16, border: 'none',
                  cursor: salvando ? 'not-allowed' : 'pointer',
                  background: salvando
                    ? cores.bgTerciario
                    : 'linear-gradient(135deg,#22c55e,#16a34a)',
                  color: salvando ? cores.textoSutil : '#fff',
                  fontSize: 16, fontWeight: 800,
                  boxShadow: salvando ? 'none' : '0 6px 20px rgba(34,197,94,.4)',
                  transition: 'all .2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {salvando
                  ? <><Spinner /> Salvando...</>
                  : membros.length > 0
                    ? `🎉 Finalizar (${membros.length + 1} membros)`
                    : '🎉 Finalizar configuração'
                }
              </button>

              <button
                onClick={() => setPasso(2)}
                style={{
                  padding: '12px', borderRadius: 14, border: 'none',
                  background: 'transparent', color: cores.textoSutil,
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                ← Voltar
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
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
