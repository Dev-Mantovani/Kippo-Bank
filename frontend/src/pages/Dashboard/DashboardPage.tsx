import { useState, useEffect, useCallback } from 'react';
import { useTema } from '../../contexts/TemaContexto';
import { useSessao } from '../../contexts/SessaoContexto';
import { TransacaoService } from '../../services/TransacaoService';
import { CartaoService } from '../../services/CartaoService';
import { ContaService } from '../../services/ContaService';
import { MembroService } from '../../services/MembroService';
import { FaturaService } from '../../services/FaturaService';
import { RecorrenteFacade } from '../../services/RecorrenteFacade';
import ModalConta from '../Contas/ContaModal';
import ModalCartao from '../Cartoes/CartaoModal';
<<<<<<< HEAD
import type { Transacao, Cartao, Conta, FaturaInfo } from '../../types';

=======
import type { Transacao } from '../../types';
import type { Cartao} from '../../types';
import type { Conta} from '../../types';
import type { FaturaInfo } from '../../types';
>>>>>>> ae246126b1b4018a03e0525320d226362b39f566
import type { MembroFamilia } from '../../types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });


// ─── Ícone chevron animado ────────────────────────────────────────
function IconChevron({ aberto }: { aberto: boolean }) {
  return (
    <svg
      width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      viewBox="0 0 24 24"
      style={{
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        transform: aberto ? 'rotate(180deg)' : 'rotate(0deg)',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Seção com toggle de colapso ─────────────────────────────────
interface SecaoProps {
  titulo: string;
  cores: any;
  aoAdicionar?: () => void;
  colapsavel?: boolean;
  aberto?: boolean;
  onToggle?: () => void;
  contador?: number;
  resumoColapsado?: React.ReactNode;
}

function Secao({ titulo, cores, aoAdicionar, colapsavel, aberto, onToggle, contador, resumoColapsado }: SecaoProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 12,
    }}>
      {colapsavel ? (
        <button
          onClick={onToggle}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            border: 'none', background: 'transparent', cursor: 'pointer',
            padding: '2px 0', textAlign: 'left', minWidth: 0,
          }}
        >
          {/* Título */}
          <span style={{ fontSize: 17, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
            {titulo}
          </span>

          {/* Badge contador */}
          {typeof contador === 'number' && contador > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: cores.azulPrimario,
              background: cores.azulFundo, padding: '2px 8px',
              borderRadius: 99, fontFamily: "'DM Sans',sans-serif", flexShrink: 0,
            }}>
              {contador}
            </span>
          )}

          {/* Resumo quando colapsado */}
          {!aberto && resumoColapsado && (
            <span style={{ minWidth: 0, overflow: 'hidden' }}>{resumoColapsado}</span>
          )}

          {/* Espaçador + chevron */}
          <span style={{ flex: 1 }} />
          <span style={{ color: cores.textoSutil, display: 'flex', alignItems: 'center' }}>
            <IconChevron aberto={aberto ?? true} />
          </span>
        </button>
      ) : (
        <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>
          {titulo}
        </div>
      )}

      {/* Botão + */}
      {aoAdicionar && (
        <button
          onClick={aoAdicionar}
          style={{
            width: 32, height: 32, borderRadius: 10, border: 'none',
            background: cores.azulFundo, color: cores.azulPrimario,
            fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, transition: 'all .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = cores.azulPrimario + '33'}
          onMouseLeave={e => e.currentTarget.style.background = cores.azulFundo}
        >
          +
        </button>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────
function EmptyState({ icone, texto, acao, rotuloBotao, cores }: {
  icone: string; texto: string; acao: () => void; rotuloBotao: string; cores: any;
}) {
  return (
    <div style={{ background: cores.bgCard, borderRadius: 20, border: `1px solid ${cores.borda}`, padding: '28px 20px', textAlign: 'center', marginBottom: 24, boxShadow: cores.sombra }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icone}</div>
      <div style={{ fontSize: 14, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginBottom: 14 }}>{texto}</div>
      <button onClick={acao} style={{ padding: '10px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 14px rgba(59,130,246,.4)' }}>
        + {rotuloBotao}
      </button>
    </div>
  );
}

function BtnAcao({ icone, onClick, bg }: { icone: string; onClick: () => void; bg: string }) {
  return (
    <button onClick={onClick} style={{ width: 30, height: 30, borderRadius: 9, border: 'none', background: bg, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .15s' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      {icone}
    </button>
  );
}

function BadgeStatus({ status, cores }: { status: string; cores: any }) {
  const ok = status === 'recebido' || status === 'pago';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: ok ? cores.verdeTexto : cores.amareloTexto, background: ok ? cores.verdeFundo : cores.amareloFundo, padding: '2px 8px', borderRadius: 99, fontFamily: "'DM Sans',sans-serif", marginTop: 2, display: 'inline-block' }}>
      {status}
    </span>
  );
}

// ─── Card de cartão ───────────────────────────────────────────────
interface CartaoCardProps {
  cartao: Cartao;
  fatura: FaturaInfo | null;
  cores: any;
  membros: MembroFamilia[];
  onEditar: () => void;
  onExcluir: () => void;
  onMarcarPaga: (cartaoId: string, invoiceId: string | null) => void;
  marcandoPago: boolean;
}

function CartaoCard({ cartao, fatura, cores, membros, onEditar, onExcluir, onMarcarPaga, marcandoPago }: CartaoCardProps) {
  if (!fatura) return null;

  const membro = membros.find(m => m.id === cartao.membro_id);
  const pct = Math.min((fatura.total / cartao.limite) * 100, 100);
  const corBarra = pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#22C55E';
  const fatPaga = fatura.status === 'paga';

  return (
    <div style={{ background: cores.bgCard, borderRadius: 20, border: `1px solid ${fatPaga ? '#22C55E44' : cores.borda}`, boxShadow: cores.sombra, padding: 16, transition: 'border-color .3s' }}>

      {/* ── Linha 1: ícone + nome + ações ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: cartao.cor || '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
          {cartao.nome.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>Cartão de crédito</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cartao.nome}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <BtnAcao icone="✏️" onClick={onEditar} bg={cores.bgTerciario} />
          <BtnAcao icone="🗑️" onClick={onExcluir} bg={cores.vermelhFundo} />
        </div>
      </div>

      {/* ── Linha 2: membro + status badge ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {membro && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              background: membro.cor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {membro.nome[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: membro.cor, fontFamily: "'DM Sans',sans-serif" }}>
              {membro.nome}
            </span>
          </div>
        )}
        {membro && (
          <span style={{ fontSize: 11, color: cores.bgTerciario }}>•</span>
        )}
        <div style={{ padding: '3px 10px', borderRadius: 99, background: fatPaga ? cores.verdeFundo : fatura.jaFechou ? cores.amareloFundo : cores.bgTerciario, border: `1px solid ${fatPaga ? '#22C55E55' : fatura.jaFechou ? '#F59E0B55' : cores.borda}` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: fatPaga ? cores.verdeTexto : fatura.jaFechou ? cores.amareloTexto : cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
            {fatPaga ? '✅ Paga' : fatura.jaFechou ? '🔔 Fechada' : '🔓 Aberta'}
          </span>
        </div>
      </div>

      {/* ── Linha 3: período ── */}
      <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        📅 <span style={{ fontWeight: 600, color: cores.textoCorpo }}>{fatura.periodo}</span>
        {cartao.fechamento_dia && <span>• Fecha dia {cartao.fechamento_dia}</span>}
      </div>

      {/* ── Valores ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>Fatura do período</div>
          <span style={{ fontSize: 16, fontWeight: 800, color: fatPaga ? cores.verdeTexto : cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>
            R$ {fmt(fatura.total)}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>Limite disponível</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
            R$ {fmt(cartao.limite - fatura.total)}
          </span>
        </div>
      </div>

      {/* ── Barra ── */}
      <div style={{ height: 8, background: cores.bgTerciario, borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: fatPaga ? 'linear-gradient(90deg,#22C55E,#4ADE80)' : `linear-gradient(90deg,${corBarra},${corBarra}bb)`, borderRadius: 99, transition: 'width .5s ease' }} />
      </div>
      <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", textAlign: 'right', marginBottom: fatura.jaFechou && !fatPaga ? 14 : 0 }}>
        {pct.toFixed(0)}% do limite (R$ {fmt(cartao.limite)})
      </div>

      {/* ── Botão pagar ── */}
      {fatura.jaFechou && !fatPaga && fatura.total > 0 && (
        <button
          onClick={() => onMarcarPaga(cartao.id, fatura.invoiceId)}
          disabled={marcandoPago}
          style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', cursor: marcandoPago ? 'not-allowed' : 'pointer', background: marcandoPago ? cores.bgTerciario : 'linear-gradient(135deg,#22C55E,#16A34A)', color: marcandoPago ? cores.textoSutil : '#fff', fontSize: 14, fontWeight: 800, fontFamily: "'DM Sans',sans-serif", boxShadow: marcandoPago ? 'none' : '0 4px 14px rgba(34,197,94,.4)', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {marcandoPago ? '⏳ Salvando...' : `✅ Marcar fatura como paga — R$ ${fmt(fatura.total)}`}
        </button>
      )}

      {fatPaga && (
        <div style={{ background: cores.verdeFundo, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✅</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: cores.verdeTexto, fontFamily: "'DM Sans',sans-serif" }}>
            Fatura paga! Limite totalmente disponível.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────
export default function PaginaDashboard() {
  const { idUsuario, mesAtual, anoAtual } = useSessao();
  const { cores } = useTema();

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [membros, setMembros] = useState<MembroFamilia[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [faturas, setFaturas] = useState<Record<string, FaturaInfo>>({});
  const [carregando, setCarregando] = useState(true);
  const [marcandoPago, setMarcandoPago] = useState<string | null>(null);

  // ── Colapso das seções (aberto por padrão) ────────────────────
  const [cartoesAberto, setCartoesAberto] = useState(true);
  const [contasAberto, setContasAberto] = useState(true);
  const [despesasAberto, setDespesasAberto] = useState(true);

  // Modais
  const [modalConta, setModalConta] = useState(false);
  const [modalCartao, setModalCartao] = useState(false);
  const [contaEditando, setContaEditando] = useState<Conta | null>(null);
  const [cartaoEditando, setCartaoEditando] = useState<Cartao | null>(null);

  useEffect(() => { carregarDados(); }, [idUsuario, mesAtual, anoAtual]);

  const calcularFatura = useCallback(async (cartao: Cartao): Promise<FaturaInfo> => {
    return FaturaService.calcular(idUsuario, cartao, mesAtual, anoAtual);
  }, [idUsuario, mesAtual, anoAtual]);

  const carregarDados = async () => {
    setCarregando(true);
    await RecorrenteFacade.sincronizarMes(idUsuario, anoAtual, mesAtual);

    const [txs, listaCartoes, listaContas, listaMembros] = await Promise.all([
      TransacaoService.listar(idUsuario, anoAtual, mesAtual),
      CartaoService.listar(idUsuario),
      ContaService.listar(idUsuario),
      MembroService.listar(idUsuario),
    ]);

    setTransacoes(txs);
    setCartoes(listaCartoes);
    setContas(listaContas);
    setMembros(listaMembros);

    if (listaCartoes.length > 0) {
      const pairs = await Promise.all(listaCartoes.map(async c => ({ id: c.id, fatura: await calcularFatura(c) })));
      const mapa: Record<string, FaturaInfo> = {};
      pairs.forEach(p => { mapa[p.id] = p.fatura; });
      setFaturas(mapa);
    }

    setCarregando(false);
  };

  const marcarFaturaPaga = async (cartaoId: string, invoiceId: string | null) => {
    setMarcandoPago(cartaoId);
    try {
      await FaturaService.marcarPaga(idUsuario, cartaoId, mesAtual, anoAtual, invoiceId);
      const cartao = cartoes.find(c => c.id === cartaoId);
      if (cartao) {
        const nova = await calcularFatura(cartao);
        setFaturas(prev => ({ ...prev, [cartaoId]: nova }));
      }
    } finally {
      setMarcandoPago(null);
    }
  };

  const excluirConta   = async (id: string) => { if (!window.confirm('Excluir esta conta?')) return;  await ContaService.excluir(id);   carregarDados(); };
  const excluirCartao  = async (id: string) => { if (!window.confirm('Excluir este cartão?')) return; await CartaoService.excluir(id);  carregarDados(); };

  const receitas = transacoes.filter(t => t.tipo === 'receita' && t.status === 'recebido').reduce((s, t) => s + t.valor, 0);
  const despesas = transacoes.filter(t => t.tipo === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);
  const saldo = receitas - despesas;

  // Totais para resumo colapsado
  const totalFaturas = cartoes.reduce((s, c) => s + (faturas[c.id]?.total ?? 0), 0);
  const totalSaldoContas = contas.reduce((s, c) => s + c.saldo, 0);

  const card = { background: cores.bgCard, borderRadius: 20, border: `1px solid ${cores.borda}`, boxShadow: cores.sombra };

  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${cores.bgTerciario}`, borderTop: `3px solid ${cores.azulPrimario}`, animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: cores.bgPrimario, minHeight: '100vh', transition: 'background .3s' }}>
      <div style={{ padding: '16px 16px 0' }}>

        {/* Cards receita + despesa */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {[
            { label: 'Receitas', valor: receitas, bg: cores.verdeFundo, iconBg: '#22C55E', textColor: cores.verdeTexto },
            { label: 'Despesas', valor: despesas, bg: cores.vermelhFundo, iconBg: '#EF4444', textColor: cores.vermelhoTexto },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 20, padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10, transition: 'background .3s' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>$</div>
              <div>
                <div style={{ fontSize: 11, color: c.textColor, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginTop: 1 }}>R$ {fmt(c.valor)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Saldo */}
        <div style={{ background: cores.azulFundo, borderRadius: 20, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, border: `1px solid ${cores.azulPrimario}33`, transition: 'background .3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: cores.azulPrimario, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🐷</div>
            <div style={{ fontSize: 13, color: cores.textoCorpo, fontFamily: "'DM Sans',sans-serif" }}>Saldo do mês</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: saldo >= 0 ? cores.verdeTexto : cores.vermelhoTexto, fontFamily: "'DM Sans',sans-serif" }}>
            R$ {fmt(saldo)}
          </div>
        </div>

        {/* ── CARTÕES ─────────────────────────────────────────── */}
        <Secao
          titulo="Meus cartões"
          cores={cores}
          aoAdicionar={() => { setCartaoEditando(null); setModalCartao(true); }}
          colapsavel
          aberto={cartoesAberto}
          onToggle={() => setCartoesAberto(v => !v)}
          contador={cartoes.length}
          resumoColapsado={
            cartoes.length > 0 ? (
              <span style={{ fontSize: 13, fontWeight: 700, color: cores.vermelhoTexto, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                R$ {fmt(totalFaturas)} em faturas
              </span>
            ) : undefined
          }
        />

        {/* Conteúdo dos cartões — animação de colapso */}
        <div style={{
          display: 'grid',
          gridTemplateRows: cartoesAberto ? '1fr' : '0fr',
          opacity: cartoesAberto ? 1 : 0,
          transition: 'grid-template-rows .32s cubic-bezier(.4,0,.2,1), opacity .22s ease',
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ paddingBottom: cartoesAberto ? 0 : 0 }}>
              {cartoes.length === 0 ? (
                <EmptyState icone="💳" texto="Nenhum cartão cadastrado" acao={() => { setCartaoEditando(null); setModalCartao(true); }} rotuloBotao="Adicionar cartão" cores={cores} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {cartoes.map(cartao => (
                    <CartaoCard
                      key={cartao.id}
                      cartao={cartao}
                      fatura={faturas[cartao.id] ?? null}
                      cores={cores}
                      membros={membros}
                      onEditar={() => { setCartaoEditando(cartao); setModalCartao(true); }}
                      onExcluir={() => excluirCartao(cartao.id)}
                      onMarcarPaga={marcarFaturaPaga}
                      marcandoPago={marcandoPago === cartao.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Separador quando cartões colapsados */}
        {!cartoesAberto && <div style={{ height: 20 }} />}

        {/* ── CONTAS ──────────────────────────────────────────── */}
        <Secao
          titulo="Minhas contas"
          cores={cores}
          aoAdicionar={() => { setContaEditando(null); setModalConta(true); }}
          colapsavel
          aberto={contasAberto}
          onToggle={() => setContasAberto(v => !v)}
          contador={contas.length}
          resumoColapsado={
            contas.length > 0 ? (
              <span style={{ fontSize: 13, fontWeight: 700, color: cores.verdeTexto, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                R$ {fmt(totalSaldoContas)} total
              </span>
            ) : undefined
          }
        />

        {/* Conteúdo das contas — animação de colapso */}
        <div style={{
          display: 'grid',
          gridTemplateRows: contasAberto ? '1fr' : '0fr',
          opacity: contasAberto ? 1 : 0,
          transition: 'grid-template-rows .32s cubic-bezier(.4,0,.2,1), opacity .22s ease',
        }}>
          <div style={{ overflow: 'hidden' }}>
            {contas.length === 0 ? (
              <EmptyState icone="🏦" texto="Nenhuma conta cadastrada" acao={() => { setContaEditando(null); setModalConta(true); }} rotuloBotao="Adicionar conta" cores={cores} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {contas.map(conta => (
                  <div key={conta.id} style={{ ...card, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: conta.cor || '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
                        {conta.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>Conta {conta.tipo}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>{conta.nome}</div>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: 8 }}>
                        <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>Saldo</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>R$ {fmt(conta.saldo)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <BtnAcao icone="✏️" onClick={() => { setContaEditando(conta); setModalConta(true); }} bg={cores.bgTerciario} />
                        <BtnAcao icone="🗑️" onClick={() => excluirConta(conta.id)} bg={cores.vermelhFundo} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {!contasAberto && <div style={{ height: 20 }} />}

        {/* ── TOP 5 MAIORES DESPESAS DO MÊS ───────────────────── */}
        {(() => {
          const top5 = [...transacoes]
            .filter(t => t.tipo === 'despesa')
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 5);

          if (top5.length === 0) return null;

          const ICONES_CAT: Record<string, string> = {
            Alimentação: '🍔', Moradia: '🏠', Transporte: '🚗', Saúde: '💊',
            Educação: '📚', Lazer: '🎮', Assinaturas: '📱', Contas: '⚡',
            Supermercado: '🛒', Combustível: '⛽', Roupas: '👗', Outros: '💸',
          };

          const maiorValor = top5[0].valor;
          const totalTop5 = top5.reduce((s, t) => s + t.valor, 0);

          return (
            <>
              {/* Cabeçalho com toggle */}
              <Secao
                titulo="Maiores despesas🔥 "
                cores={cores}
                colapsavel
                aberto={despesasAberto}
                onToggle={() => setDespesasAberto(v => !v)}
                contador={top5.length}
                resumoColapsado={
                  <span style={{ fontSize: 13, fontWeight: 700, color: cores.vermelhoTexto, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    R$ {fmt(totalTop5)} total
                  </span>
                }
              />

              {/* Conteúdo colapsável */}
              <div style={{
                display: 'grid',
                gridTemplateRows: despesasAberto ? '1fr' : '0fr',
                opacity: despesasAberto ? 1 : 0,
                transition: 'grid-template-rows .32s cubic-bezier(.4,0,.2,1), opacity .22s ease',
              }}>
                <div style={{ overflow: 'hidden' }}>
                  {/* Subtítulo e total */}
                  {despesasAberto && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontSize: 16, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginLeft: 25 }}>
                        Top 5 do mês
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: cores.vermelhoTexto, fontFamily: "'DM Sans',sans-serif" }}>
                        R$ {fmt(totalTop5)}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                    {top5.map((t, idx) => {
                      const pct = (t.valor / maiorValor) * 100;
                      return (
                        <div key={t.id} style={{ ...card, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Posição */}
                            <div style={{
                              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                              background: idx === 0 ? '#EF444420' : idx === 1 ? '#F9731618' : idx === 2 ? '#EAB30818' : cores.bgTerciario,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 800,
                              color: idx === 0 ? '#EF4444' : idx === 1 ? '#F97316' : idx === 2 ? '#CA8A04' : cores.textoSutil,
                              fontFamily: "'DM Sans',sans-serif",
                            }}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </div>

                            {/* Ícone categoria */}
                            <div style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: cores.vermelhFundo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>
                              {ICONES_CAT[t.categoria] ?? '💸'}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.titulo}
                                </span>
                                {t.recorrente && (
                                  <span style={{ fontSize: 10, color: cores.azulPrimario, background: cores.azulFundo, padding: '1px 6px', borderRadius: 99, fontWeight: 700, flexShrink: 0 }}>
                                    🔄
                                  </span>
                                )}
                              </div>

                              {/* Barra de proporção */}
                              <div style={{ height: 4, background: cores.bgTerciario, borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{
                                  width: `${pct}%`, height: '100%', borderRadius: 99,
                                  background: idx === 0
                                    ? 'linear-gradient(90deg,#EF4444,#F87171)'
                                    : idx === 1
                                      ? 'linear-gradient(90deg,#F97316,#FB923C)'
                                      : 'linear-gradient(90deg,#94A3B8,#CBD5E1)',
                                  transition: 'width .6s ease',
                                }} />
                              </div>

                              <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 3, display: 'flex', gap: 6 }}>
                                <span>{(t as any).membro?.nome}</span>
                                <span>•</span>
                                <span>{t.categoria}</span>
                              </div>
                            </div>

                            {/* Valor + status */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: 15, fontWeight: 800, color: cores.vermelhoTexto, fontFamily: "'DM Sans',sans-serif" }}>
                                R$ {fmt(t.valor)}
                              </div>
                              <BadgeStatus status={t.status} cores={cores} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {!despesasAberto && <div style={{ height: 20 }} />}
            </>
          );
        })()}

        <div style={{ height: 16 }} />
      </div>

      {/* Modais */}
      {modalConta && (
        <ModalConta
          idUsuario={idUsuario}
          conta={contaEditando}
          aoFechar={() => { setModalConta(false); setContaEditando(null); }}
          aoSalvar={() => { setModalConta(false); setContaEditando(null); carregarDados(); }}
        />
      )}
      {modalCartao && (
        <ModalCartao
          idUsuario={idUsuario}
          cartao={cartaoEditando}
          membros={membros}
          aoFechar={() => { setModalCartao(false); setCartaoEditando(null); }}
          aoSalvar={() => { setModalCartao(false); setCartaoEditando(null); carregarDados(); }}
        />
      )}
    </div>
  );
}
