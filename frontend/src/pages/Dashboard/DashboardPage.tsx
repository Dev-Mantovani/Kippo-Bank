import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { criarTransacoesRecorrentesMes } from '../../utils/recorrentes';
import { obterPeriodoMes } from '../../utils/months';
import { obterPeriodoFatura, formatarPeriodoFatura } from '../../utils/fatura';
import { useTema } from '../../contexts/TemaContexto';
import ModalConta from '../Contas/ContaModal';
import ModalCartao from '../Cartoes/CartaoModal';
import type { Transacao, Cartao, Conta } from '../../types';

interface Props { idUsuario: string; mesAtual: number; anoAtual: number; }

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

// ─── Tipos internos ───────────────────────────────────────────────
interface FaturaInfo {
  total:     number;
  status:    'aberta' | 'paga';
  jaFechou:  boolean;
  periodo:   string;
  invoiceId: string | null;
}

// ─── Componentes auxiliares ───────────────────────────────────────

function Secao({ titulo, cores, aoAdicionar }: { titulo: string; cores: any; aoAdicionar?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>{titulo}</div>
      {aoAdicionar && (
        <button onClick={aoAdicionar} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: cores.azulFundo, color: cores.azulPrimario, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s' }}
          onMouseEnter={e => e.currentTarget.style.background = cores.azulPrimario + '33'}
          onMouseLeave={e => e.currentTarget.style.background = cores.azulFundo}>
          +
        </button>
      )}
    </div>
  );
}

function EmptyState({ icone, texto, acao, rotuloBotao, cores }: { icone: string; texto: string; acao: () => void; rotuloBotao: string; cores: any }) {
  return (
    <div style={{ background: cores.bgCard, borderRadius: 20, border: `1px solid ${cores.borda}`, padding: '28px 20px', textAlign: 'center', marginBottom: 24, boxShadow: cores.sombra }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icone}</div>
      <div style={{ fontSize: 14, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginBottom: 14 }}>{texto}</div>
      <button onClick={acao} style={{ padding: '10px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 14px rgba(59,130,246,.4)', transition: 'opacity .2s' }}>
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

// ─── Componente do cartão com fatura dinâmica ─────────────────────
interface CartaoCardProps {
  cartao:          Cartao;
  fatura:          FaturaInfo | null;
  cores:           any;
  onEditar:        () => void;
  onExcluir:       () => void;
  onMarcarPaga:    (cartaoId: string, invoiceId: string | null) => void;
  marcandoPago:    boolean;
}

function CartaoCard({ cartao, fatura, cores, onEditar, onExcluir, onMarcarPaga, marcandoPago }: CartaoCardProps) {
  if (!fatura) return null;

  const pct = Math.min((fatura.total / cartao.limite) * 100, 100);
  const corBarra = pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#22C55E';
  const fatPaga  = fatura.status === 'paga';

  return (
    <div style={{ background: cores.bgCard, borderRadius: 20, border: `1px solid ${fatPaga ? '#22C55E44' : cores.borda}`, boxShadow: cores.sombra, padding: 16, transition: 'border-color .3s' }}>
      {/* Linha topo: avatar + nome + ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: cartao.cor || '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
          {cartao.nome.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>Cartão de crédito</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>{cartao.nome}</div>
        </div>

        {/* Badge status fatura */}
        <div style={{ padding: '4px 10px', borderRadius: 99, background: fatPaga ? cores.verdeFundo : fatura.jaFechou ? cores.amareloFundo : cores.bgTerciario, border: `1px solid ${fatPaga ? '#22C55E55' : fatura.jaFechou ? '#F59E0B55' : cores.borda}` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: fatPaga ? cores.verdeTexto : fatura.jaFechou ? cores.amareloTexto : cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
            {fatPaga ? '✅ Paga' : fatura.jaFechou ? '🔔 Fechada' : '🔓 Aberta'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <BtnAcao icone="✏️" onClick={onEditar}  bg={cores.bgTerciario} />
          <BtnAcao icone="🗑️" onClick={onExcluir} bg={cores.vermelhFundo} />
        </div>
      </div>

      {/* Período de fatura */}
      <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        📅 Período: <span style={{ fontWeight: 600, color: cores.textoCorpo }}>{fatura.periodo}</span>
        {cartao.fechamento_dia && <span style={{ color: cores.textoSutil }}> • Fecha dia {cartao.fechamento_dia}</span>}
      </div>

      {/* Valores */}
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

      {/* Barra de uso */}
      <div style={{ height: 8, background: cores.bgTerciario, borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: fatPaga ? `linear-gradient(90deg,#22C55E,#4ADE80)` : `linear-gradient(90deg,${corBarra},${corBarra}bb)`, borderRadius: 99, transition: 'width .5s ease' }} />
      </div>
      <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", textAlign: 'right', marginBottom: fatura.jaFechou && !fatPaga ? 14 : 0 }}>
        {pct.toFixed(0)}% do limite (R$ {fmt(cartao.limite)})
      </div>

      {/* Botão Marcar como Paga — só aparece quando fatura fechou e ainda não foi paga */}
      {fatura.jaFechou && !fatPaga && fatura.total > 0 && (
        <button
          onClick={() => onMarcarPaga(cartao.id, fatura.invoiceId)}
          disabled={marcandoPago}
          style={{
            width: '100%', padding: '13px', borderRadius: 14, border: 'none',
            cursor: marcandoPago ? 'not-allowed' : 'pointer',
            background: marcandoPago ? cores.bgTerciario : 'linear-gradient(135deg,#22C55E,#16A34A)',
            color: marcandoPago ? cores.textoSutil : '#fff',
            fontSize: 14, fontWeight: 800,
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: marcandoPago ? 'none' : '0 4px 14px rgba(34,197,94,.4)',
            transition: 'all .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {marcandoPago
            ? '⏳ Salvando...'
            : `✅ Marcar fatura como paga — R$ ${fmt(fatura.total)}`}
        </button>
      )}

      {/* Confirmação se já paga */}
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
export default function PaginaDashboard({ idUsuario, mesAtual, anoAtual }: Props) {
  const { cores } = useTema();

  const [transacoes,  setTransacoes]  = useState<Transacao[]>([]);
  const [cartoes,     setCartoes]     = useState<Cartao[]>([]);
  const [contas,      setContas]      = useState<Conta[]>([]);
  const [faturas,     setFaturas]     = useState<Record<string, FaturaInfo>>({});
  const [carregando,  setCarregando]  = useState(true);
  const [marcandoPago, setMarcandoPago] = useState<string | null>(null); // card id

  // Modais
  const [modalConta,     setModalConta]     = useState(false);
  const [modalCartao,    setModalCartao]    = useState(false);
  const [contaEditando,  setContaEditando]  = useState<Conta | null>(null);
  const [cartaoEditando, setCartaoEditando] = useState<Cartao | null>(null);

  useEffect(() => { carregarDados(); }, [idUsuario, mesAtual, anoAtual]);

  // ── Calcula a fatura de um cartão para o período selecionado ────
  const calcularFatura = useCallback(async (cartao: Cartao): Promise<FaturaInfo> => {
    const periodo = obterPeriodoFatura(cartao.fechamento_dia ?? 10, mesAtual, anoAtual);

    // Busca transações com este cartão no período de fatura
    const { data: txs } = await supabase
      .from('transactions')
      .select('valor')
      .eq('user_id', idUsuario)
      .eq('cartao_id', cartao.id)
      .eq('tipo', 'despesa')
      .gte('data', periodo.dataInicioStr)
      .lte('data', periodo.dataFimStr);

    const total = (txs ?? []).reduce((s, t) => s + t.valor, 0);

    // Busca o status da fatura (aberta/paga) na tabela card_invoices
    const { data: invoice } = await supabase
      .from('card_invoices')
      .select('id, status')
      .eq('card_id', cartao.id)
      .eq('mes', mesAtual)
      .eq('ano', anoAtual)
      .maybeSingle();

    return {
      total,
      status:    (invoice?.status ?? 'aberta') as 'aberta' | 'paga',
      jaFechou:  periodo.jaFechou,
      periodo:   formatarPeriodoFatura(periodo),
      invoiceId: invoice?.id ?? null,
    };
  }, [idUsuario, mesAtual, anoAtual]);

  // ── Carregamento principal ──────────────────────────────────────
  const carregarDados = async () => {
    setCarregando(true);
    const { dataInicioStr, dataFimStr } = obterPeriodoMes(anoAtual, mesAtual);
    await criarTransacoesRecorrentesMes(idUsuario, anoAtual, mesAtual);

    const [resT, resC, resA] = await Promise.all([
      supabase.from('transactions').select('*, membro:family_members(*)')
        .eq('user_id', idUsuario).gte('data', dataInicioStr).lte('data', dataFimStr)
        .order('data', { ascending: false }),
      supabase.from('cards').select('*').eq('user_id', idUsuario),
      supabase.from('accounts').select('*').eq('user_id', idUsuario),
    ]);

    if (resT.data) setTransacoes(resT.data);
    if (resC.data) setCartoes(resC.data);
    if (resA.data) setContas(resA.data);

    // Calcula fatura de cada cartão paralelamente
    if (resC.data && resC.data.length > 0) {
      const faturasPairs = await Promise.all(
        resC.data.map(async (c) => ({ id: c.id, fatura: await calcularFatura(c) }))
      );
      const novasFaturas: Record<string, FaturaInfo> = {};
      faturasPairs.forEach(p => { novasFaturas[p.id] = p.fatura; });
      setFaturas(novasFaturas);
    }

    setCarregando(false);
  };

  // ── Marcar fatura como paga ─────────────────────────────────────
  const marcarFaturaPaga = async (cartaoId: string, invoiceId: string | null) => {
    setMarcandoPago(cartaoId);
    try {
      if (invoiceId) {
        // Atualiza registro existente
        await supabase
          .from('card_invoices')
          .update({ status: 'paga', pago_em: new Date().toISOString() })
          .eq('id', invoiceId);
      } else {
        // Cria novo registro de fatura paga
        await supabase
          .from('card_invoices')
          .insert({
            user_id: idUsuario,
            card_id: cartaoId,
            mes:     mesAtual,
            ano:     anoAtual,
            status:  'paga',
            pago_em: new Date().toISOString(),
          });
      }
      // Atualiza só a fatura deste cartão
      const cartao = cartoes.find(c => c.id === cartaoId);
      if (cartao) {
        const novaFatura = await calcularFatura(cartao);
        setFaturas(prev => ({ ...prev, [cartaoId]: novaFatura }));
      }
    } finally {
      setMarcandoPago(null);
    }
  };

  // ── Handlers de conta/cartão ────────────────────────────────────
  const excluirConta = async (id: string) => {
    if (!window.confirm('Excluir esta conta?')) return;
    await supabase.from('accounts').delete().eq('id', id);
    carregarDados();
  };
  const excluirCartao = async (id: string) => {
    if (!window.confirm('Excluir este cartão? Todos os dados de fatura serão removidos.')) return;
    await supabase.from('cards').delete().eq('id', id);
    carregarDados();
  };

  // ── Totais do mês ───────────────────────────────────────────────
  const receitas = transacoes.filter(t => t.tipo === 'receita' && t.status === 'recebido').reduce((s, t) => s + t.valor, 0);
  const despesas = transacoes.filter(t => t.tipo === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);
  const saldo    = receitas - despesas;

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
            { label: 'Receitas', valor: receitas, bg: cores.verdeFundo,  iconBg: '#22C55E', textColor: cores.verdeTexto },
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
        <Secao titulo="Meus cartões" cores={cores} aoAdicionar={() => { setCartaoEditando(null); setModalCartao(true); }} />
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
                onEditar={() => { setCartaoEditando(cartao); setModalCartao(true); }}
                onExcluir={() => excluirCartao(cartao.id)}
                onMarcarPaga={marcarFaturaPaga}
                marcandoPago={marcandoPago === cartao.id}
              />
            ))}
          </div>
        )}

        {/* ── CONTAS ──────────────────────────────────────────── */}
        <Secao titulo="Minhas contas" cores={cores} aoAdicionar={() => { setContaEditando(null); setModalConta(true); }} />
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

        {/* ── ÚLTIMAS TRANSAÇÕES ───────────────────────────────── */}
        {transacoes.length > 0 && (
          <>
            <Secao titulo="Últimas transações" cores={cores} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {transacoes.slice(0, 5).map(t => (
                <div key={t.id} style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: t.tipo === 'receita' ? cores.verdeFundo : cores.vermelhFundo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {t.tipo === 'receita' ? '💰' : '💸'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.titulo}</div>
                    <div style={{ fontSize: 12, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>{(t as any).membro?.nome}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: t.tipo === 'receita' ? cores.verdeTexto : cores.vermelhoTexto, fontFamily: "'DM Sans',sans-serif" }}>
                      {t.tipo === 'receita' ? '+' : '-'}R$ {fmt(t.valor)}
                    </div>
                    <BadgeStatus status={t.status} cores={cores} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

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
          aoFechar={() => { setModalCartao(false); setCartaoEditando(null); }}
          aoSalvar={() => { setModalCartao(false); setCartaoEditando(null); carregarDados(); }}
        />
      )}
    </div>
  );
}
