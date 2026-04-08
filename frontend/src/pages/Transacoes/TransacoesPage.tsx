import { useState, useEffect, useMemo } from 'react';
import { useTema } from '../../contexts/TemaContexto';
import { useSessao } from '../../contexts/SessaoContexto';
import { TransacaoService } from '../../services/TransacaoService';
import { MembroService } from '../../services/MembroService';
import { ContaService } from '../../services/ContaService';
import { CartaoService } from '../../services/CartaoService';
import { RecorrenteFacade } from '../../services/RecorrenteFacade';
import ModalReceita from '../Receitas/ReceitaModal';
import ModalDespesa from '../Despesas/DespesaModal';
import { ModalExcluirRecorrente } from '../../components/ModalExcluirRecorrente/ModalExcluirRecorrente';
import { ModalEditarRecorrente } from '../../components/ModalEditarRecorrente/ModalEditarRecorrente';
import type { ModoExclusao, ModoEdicao, Transacao, MembroFamilia, Conta, Cartao } from '../../types';

interface Props {
  aoMudarMes: (m: number, a: number) => void;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const ICONES: Record<string, string> = {
  Salário: '💰', Freelance: '💼', Investimentos: '📈', Bônus: '🎁', Outros: '💵',
  Alimentação: '🍔', Moradia: '🏠', Transporte: '🚗', Saúde: '💊', Educação: '📚',
  Lazer: '🎮', Assinaturas: '📱', Contas: '⚡', Aluguel: '🏠', Supermercado: '🛒',
  Internet: '🌐', Combustível: '⛽', Roupas: '👗', Streamings: '📺',
};

const CATEGORIAS_DESPESA = [
  'Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação',
  'Lazer', 'Assinaturas', 'Contas', 'Supermercado', 'Combustível', 'Roupas', 'Outros',
];
const CATEGORIAS_RECEITA = ['Salário', 'Freelance', 'Investimentos', 'Bônus', 'Outros'];

const IconSearch = () => <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconFilter = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
const IconX = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

// ─── Chip de filtro ativo ─────────────────────────────────────────
function ChipAtivo({ rotulo, onRemover, cores }: { rotulo: string; onRemover: () => void; cores: any }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px 4px 12px', borderRadius: 99,
      background: cores.azulPrimario, color: '#fff',
      fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
      flexShrink: 0,
    }}>
      {rotulo}
      <button
        onClick={onRemover}
        style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'rgba(255,255,255,.25)', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', padding: 0, color: '#fff', justifyContent: 'center' }}
      >
        <IconX />
      </button>
    </div>
  );
}

// ─── Grupo de opções de filtro ────────────────────────────────────
function GrupoFiltro({ titulo, opcoes, selecionado, onSelecionar, cores }: {
  titulo: string;
  opcoes: { valor: string; rotulo: string; emoji?: string }[];
  selecionado: string;
  onSelecionar: (v: string) => void;
  cores: any;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: cores.textoSutil, textTransform: 'uppercase', letterSpacing: '.6px', fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
        {titulo}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {opcoes.map(op => {
          const ativo = selecionado === op.valor;
          return (
            <button
              key={op.valor}
              onClick={() => onSelecionar(ativo ? '' : op.valor)}
              style={{
                padding: '7px 13px', borderRadius: 99, border: 'none', cursor: 'pointer',
                background: ativo ? cores.azulPrimario : cores.bgTerciario,
                color: ativo ? '#fff' : cores.textoSutil,
                fontSize: 13, fontWeight: ativo ? 700 : 500,
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: ativo ? '0 2px 8px rgba(59,130,246,.35)' : 'none',
                transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {op.emoji && <span>{op.emoji}</span>}
              {op.rotulo}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────
export default function PaginaTransacoes({ aoMudarMes: _aoMudarMes }: Props) {
  const { idUsuario, mesAtual, anoAtual } = useSessao();
  const { cores } = useTema();

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [membros, setMembros] = useState<MembroFamilia[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregando, setCarregando] = useState(true);

  // ── Filtros ────────────────────────────────────────────────────
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroMembro, setFiltroMembro] = useState('');
  const [filtroConta, setFiltroConta] = useState('');
  const [filtroCartao, setFiltroCartao] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [painelAberto, setPainelAberto] = useState(false);

  // ── Edição / Modal ─────────────────────────────────────────────
  const [modalTipo, setModalTipo] = useState<'receita' | 'despesa' | null>(null);
  const [fabAberto, setFabAberto] = useState(false);
  const [transacaoParaEditar, setTransacaoParaEditar] = useState<Transacao | null>(null);
  const [payloadPendente, setPayloadPendente] = useState<Record<string, unknown> | null>(null);
  const [transacaoParaExcluir, setTransacaoParaExcluir] = useState<Transacao | null>(null);

  useEffect(() => { carregarDados(); }, [idUsuario, mesAtual, anoAtual]);

  const carregarDados = async (skipRecorrentes = false) => {
    setCarregando(true);
    if (!skipRecorrentes) await RecorrenteFacade.sincronizarMes(idUsuario, anoAtual, mesAtual);

    const [txs, listaMembros, listaContas, listaCartoes] = await Promise.all([
      TransacaoService.listar(idUsuario, anoAtual, mesAtual),
      MembroService.listar(idUsuario),
      ContaService.listar(idUsuario),
      CartaoService.listar(idUsuario),
    ]);

    setTransacoes(txs);
    setMembros(listaMembros);
    setContas(listaContas);
    setCartoes(listaCartoes);
    setCarregando(false);
  };

  // ── Edição ─────────────────────────────────────────────────────
  const fecharEdicao = () => { setTransacaoParaEditar(null); setPayloadPendente(null); };

  const handleSalvarPayload = async (payload: Record<string, unknown>) => {
    setPayloadPendente(payload);
    setModalTipo(null);
  };

  const handleConfirmarEdicao = async (modo: ModoEdicao) => {
    if (!transacaoParaEditar || !payloadPendente) return;
    await TransacaoService.editar(transacaoParaEditar, payloadPendente as any, modo);
    fecharEdicao();
    carregarDados(true);
  };

  // ── Exclusão ───────────────────────────────────────────────────
  const handleExcluir = async (transacao: Transacao) => {
    if (transacao.recorrente) {
      const eOriginal = await TransacaoService.eOriginal(transacao);
      if (eOriginal) { setTransacaoParaExcluir(transacao); return; }
    }
    if (!window.confirm('Excluir esta transação?')) return;
    await TransacaoService.excluirComModo(transacao, 'apenas_esta');
    carregarDados(true);
  };

  // ── Abrir modal de nova transação ──────────────────────────────
  const abrirModal = (tipo: 'receita' | 'despesa') => {
    setModalTipo(tipo);
    setFabAberto(false);
  };

  // ── Categorias disponíveis conforme tipo selecionado ───────────
  const categoriasDisponiveis = useMemo(() => {
    if (filtroTipo === 'receita') return CATEGORIAS_RECEITA;
    if (filtroTipo === 'despesa') return CATEGORIAS_DESPESA;
    return Array.from(new Set([...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA]));
  }, [filtroTipo]);

  // ── Filtros aplicados ──────────────────────────────────────────
  const filtradas = useMemo(() => transacoes.filter(t => {
    if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false;
    if (busca && !t.titulo.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroCategoria && t.categoria !== filtroCategoria) return false;
    if (filtroMembro && t.membro_id !== filtroMembro) return false;
    if (filtroConta && t.conta_id !== filtroConta) return false;
    if (filtroCartao && t.cartao_id !== filtroCartao) return false;
    if (filtroStatus && t.status !== filtroStatus) return false;
    return true;
  }), [transacoes, filtroTipo, busca, filtroCategoria, filtroMembro, filtroConta, filtroCartao, filtroStatus]);

  // ── Contagem de filtros ativos (exceto tipo e busca) ──────────
  const qtdFiltrosExtras = [filtroCategoria, filtroMembro, filtroConta, filtroCartao, filtroStatus].filter(Boolean).length;
  const temFiltroAtivo = qtdFiltrosExtras > 0;

  const limparTudo = () => {
    setFiltroCategoria('');
    setFiltroMembro('');
    setFiltroConta('');
    setFiltroCartao('');
    setFiltroStatus('');
  };

  // ── Agrupamento por data ───────────────────────────────────────
  const grupos: Record<string, Transacao[]> = {};
  filtradas.forEach(t => { (grupos[t.data] ??= []).push(t); });

  const fmtGrupo = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Totais das filtradas ───────────────────────────────────────
  const totalReceitas = filtradas.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const totalDespesas = filtradas.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

  const card = { background: cores.bgCard, borderRadius: 18, border: `1px solid ${cores.borda}`, boxShadow: cores.sombra };

  return (
    <div style={{ background: cores.bgPrimario, minHeight: '100vh', transition: 'background .3s' }}>
      <div style={{ padding: '16px 16px 0' }}>

        {/* ── Filtro tipo ───────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 15, marginBottom: 12 }}>
          {(['todos', 'receita', 'despesa'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFiltroTipo(f); setFiltroCategoria(''); }}
              style={{
                padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
                background: filtroTipo === f ? cores.azulPrimario : cores.bgTerciario,
                color: filtroTipo === f ? '#fff' : cores.textoSutil,
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                transition: 'all .2s',
              }}
            >
              {f === 'todos' ? 'Todos' : f === 'receita' ? '💰 Receitas' : '💸 Despesas'}
            </button>
          ))}
        </div>

        {/* ── Busca + Filtros + Botão + ─────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: temFiltroAtivo ? 10 : 4 }}>

          {/* Barra de busca */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            background: cores.bgTerciario, borderRadius: 14, padding: '11px 14px',
            border: `1px solid ${cores.borda}`, color: cores.textoSutil,
          }}>
            <IconSearch />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Pesquisar transação..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 14, outline: 'none',
                fontFamily: "'DM Sans',sans-serif", color: cores.textoCorpo,
              }}
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: cores.textoSutil, display: 'flex', alignItems: 'center', padding: 0 }}
              >
                <IconX />
              </button>
            )}
          </div>

          {/* Botão Filtros */}
          <button
            onClick={() => setPainelAberto(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '0 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: painelAberto || temFiltroAtivo ? cores.azulPrimario : cores.bgTerciario,
              color: painelAberto || temFiltroAtivo ? '#fff' : cores.textoSutil,
              fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
              boxShadow: temFiltroAtivo ? '0 2px 10px rgba(59,130,246,.35)' : 'none',
              transition: 'all .2s', flexShrink: 0, position: 'relative',
            }}
          >
            <IconFilter />
            Filtros
            {qtdFiltrosExtras > 0 && (
              <div style={{
                position: 'absolute', top: -6, right: -6,
                width: 18, height: 18, borderRadius: '50%',
                background: '#EF4444', color: '#fff',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Sans',sans-serif",
              }}>
                {qtdFiltrosExtras}
              </div>
            )}
          </button>

          {/* Botão + com dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setFabAberto(v => !v)}
              style={{
                width: 38, height: 37, borderRadius: 39, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
                color: '#fff', fontSize: 26,
                boxShadow: '0 4px 14px rgba(59,130,246,.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: fabAberto ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform .2s ease',
              }}
            >
              +
            </button>

            {/* Dropdown */}
            {fabAberto && (
              <>
                {/* Overlay para fechar ao clicar fora */}
                <div
                  onClick={() => setFabAberto(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: cores.bgCard, borderRadius: 16,
                  border: `1px solid ${cores.borda}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,.18)',
                  padding: 8, display: 'flex', flexDirection: 'column', gap: 4,
                  zIndex: 100, minWidth: 170,
                  animation: 'fadeDown .15s ease',
                }}>
                  <button
                    onClick={() => abrirModal('receita')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 11, border: 'none', cursor: 'pointer',
                      background: cores.verdeFundo, color: cores.verdeTexto,
                      fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>💰</span>
                    Nova Receita
                  </button>
                  <button
                    onClick={() => abrirModal('despesa')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 11, border: 'none', cursor: 'pointer',
                      background: cores.vermelhFundo, color: cores.vermelhoTexto,
                      fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>💸</span>
                    Nova Despesa
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Chips de filtros ativos ───────────────────────── */}
        {temFiltroAtivo && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
            {filtroCategoria && (
              <ChipAtivo rotulo={`${ICONES[filtroCategoria] ?? '📦'} ${filtroCategoria}`} onRemover={() => setFiltroCategoria('')} cores={cores} />
            )}
            {filtroMembro && (
              <ChipAtivo rotulo={`👤 ${membros.find(m => m.id === filtroMembro)?.nome ?? filtroMembro}`} onRemover={() => setFiltroMembro('')} cores={cores} />
            )}
            {filtroConta && (
              <ChipAtivo rotulo={`🏦 ${contas.find(c => c.id === filtroConta)?.nome ?? filtroConta}`} onRemover={() => setFiltroConta('')} cores={cores} />
            )}
            {filtroCartao && (
              <ChipAtivo rotulo={`💳 ${cartoes.find(c => c.id === filtroCartao)?.nome ?? filtroCartao}`} onRemover={() => setFiltroCartao('')} cores={cores} />
            )}
            {filtroStatus && (
              <ChipAtivo
                rotulo={filtroStatus === 'pago' ? '✅ Pago' : filtroStatus === 'recebido' ? '✅ Recebido' : '⏳ Pendente'}
                onRemover={() => setFiltroStatus('')}
                cores={cores}
              />
            )}
            <button
              onClick={limparTudo}
              style={{ fontSize: 12, fontWeight: 600, color: cores.vermelhoTexto, background: cores.vermelhFundo, border: 'none', borderRadius: 99, padding: '4px 12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
            >
              Limpar tudo
            </button>
          </div>
        )}

        {/* ── Painel de filtros ─────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateRows: painelAberto ? '1fr' : '0fr',
          opacity: painelAberto ? 1 : 0,
          transition: 'grid-template-rows .3s cubic-bezier(.4,0,.2,1), opacity .2s ease',
          marginBottom: painelAberto ? 12 : 0,
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              background: cores.bgCard, borderRadius: 18,
              border: `1px solid ${cores.borda}`,
              padding: '16px',
              display: 'flex', flexDirection: 'column', gap: 18,
              marginBottom: 4,
            }}>
              <GrupoFiltro
                titulo="Categoria"
                cores={cores}
                selecionado={filtroCategoria}
                onSelecionar={setFiltroCategoria}
                opcoes={categoriasDisponiveis.map(c => ({ valor: c, rotulo: c, emoji: ICONES[c] }))}
              />
              {membros.length > 0 && (
                <GrupoFiltro
                  titulo="Pessoa"
                  cores={cores}
                  selecionado={filtroMembro}
                  onSelecionar={setFiltroMembro}
                  opcoes={membros.map(m => ({ valor: m.id, rotulo: m.nome }))}
                />
              )}
              {contas.length > 0 && (
                <GrupoFiltro
                  titulo="Conta"
                  cores={cores}
                  selecionado={filtroConta}
                  onSelecionar={setFiltroConta}
                  opcoes={contas.map(c => ({ valor: c.id, rotulo: c.nome, emoji: '🏦' }))}
                />
              )}
              {cartoes.length > 0 && (
                <GrupoFiltro
                  titulo="Cartão"
                  cores={cores}
                  selecionado={filtroCartao}
                  onSelecionar={setFiltroCartao}
                  opcoes={cartoes.map(c => ({ valor: c.id, rotulo: c.nome, emoji: '💳' }))}
                />
              )}
              <GrupoFiltro
                titulo="Status"
                cores={cores}
                selecionado={filtroStatus}
                onSelecionar={setFiltroStatus}
                opcoes={[
                  { valor: 'recebido', rotulo: 'Recebido', emoji: '✅' },
                  { valor: 'pago', rotulo: 'Pago', emoji: '✅' },
                  { valor: 'pendente', rotulo: 'Pendente', emoji: '⏳' },
                ]}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: `1px solid ${cores.borda}` }}>
                <button
                  onClick={limparTudo}
                  style={{ fontSize: 13, fontWeight: 600, color: cores.vermelhoTexto, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                >
                  Limpar filtros
                </button>
                <button
                  onClick={() => setPainelAberto(false)}
                  style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: cores.azulPrimario, border: 'none', borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 2px 8px rgba(59,130,246,.35)' }}
                >
                  Ver resultados ({filtradas.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Resumo dos resultados ─────────────────────────── */}
        {(temFiltroAtivo || busca) && !carregando && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", alignSelf: 'center' }}>
              {filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}
            </div>
            {totalReceitas > 0 && (
              <div style={{ padding: '4px 12px', borderRadius: 99, background: cores.verdeFundo, fontSize: 12, fontWeight: 700, color: cores.verdeTexto, fontFamily: "'DM Sans',sans-serif" }}>
                +R$ {fmt(totalReceitas)}
              </div>
            )}
            {totalDespesas > 0 && (
              <div style={{ padding: '4px 12px', borderRadius: 99, background: cores.vermelhFundo, fontSize: 12, fontWeight: 700, color: cores.vermelhoTexto, fontFamily: "'DM Sans',sans-serif" }}>
                -R$ {fmt(totalDespesas)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Lista de transações ───────────────────────────────── */}
      <div>
        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${cores.bgTerciario}`, borderTop: `3px solid ${cores.azulPrimario}`, animation: 'spin .8s linear infinite' }} />
          </div>
        ) : Object.keys(grupos).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {temFiltroAtivo || busca ? '🔍' : '📭'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: cores.textoCorpo, marginBottom: 6 }}>
              {temFiltroAtivo || busca ? 'Nenhum resultado encontrado' : 'Nenhuma transação neste mês'}
            </div>
            {(temFiltroAtivo || busca) && (
              <button
                onClick={() => { limparTudo(); setBusca(''); }}
                style={{ marginTop: 12, padding: '9px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: cores.azulPrimario, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          Object.entries(grupos).map(([data, items]) => (
            <div key={data}>
              {/* Cabeçalho do grupo de data */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", textTransform: 'capitalize' }}>
                  {fmtGrupo(data)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", color: cores.textoSutil }}>
                  {(() => {
                    const recDia = items.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
                    const despDia = items.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
                    if (recDia > 0 && despDia > 0) return `+${fmt(recDia)} / -${fmt(despDia)}`;
                    if (recDia > 0) return <span style={{ color: cores.verdeTexto }}>+R$ {fmt(recDia)}</span>;
                    if (despDia > 0) return <span style={{ color: cores.vermelhoTexto }}>-R$ {fmt(despDia)}</span>;
                    return null;
                  })()}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(t => {
                  const contaNome = contas.find(c => c.id === t.conta_id)?.nome;
                  const cartaoNome = cartoes.find(c => c.id === t.cartao_id)?.nome;

                  return (
                    <div key={t.id} style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Ícone */}
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: t.tipo === 'receita' ? cores.verdeFundo : cores.vermelhFundo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>
                        {ICONES[t.categoria] ?? (t.tipo === 'receita' ? '💰' : '💸')}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.titulo}{t.recorrente ? ' 🔄' : ''}
                        </div>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
                            {(t as any).membro?.nome ?? '—'}
                          </span>
                          {t.categoria && (
                            <>
                              <span style={{ fontSize: 11, color: cores.bgTerciario }}>•</span>
                              <span style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>{t.categoria}</span>
                            </>
                          )}
                          {(contaNome || cartaoNome) && (
                            <>
                              <span style={{ fontSize: 11, color: cores.bgTerciario }}>•</span>
                              <span style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
                                {cartaoNome ? `💳 ${cartaoNome}` : `🏦 ${contaNome}`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Valor + status */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: t.tipo === 'receita' ? cores.verdeTexto : cores.vermelhoTexto, fontFamily: "'DM Sans',sans-serif" }}>
                          {t.tipo === 'receita' ? '+' : '-'}R$ {fmt(t.valor)}
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: (t.status === 'recebido' || t.status === 'pago') ? cores.verdeTexto : cores.amareloTexto,
                          background: (t.status === 'recebido' || t.status === 'pago') ? cores.verdeFundo : cores.amareloFundo,
                          padding: '2px 8px', borderRadius: 99, fontFamily: "'DM Sans',sans-serif",
                          marginTop: 2, display: 'inline-block',
                        }}>
                          {t.status}
                        </span>
                      </div>

                      {/* Ações */}
                      <button onClick={() => setTransacaoParaEditar(t)} style={{ width: 30, height: 30, borderRadius: 9, border: 'none', background: cores.bgTerciario, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>✏️</button>
                      <button onClick={() => handleExcluir(t)} style={{ width: 30, height: 30, borderRadius: 9, border: 'none', background: cores.vermelhFundo, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>🗑️</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* ── Modais ───────────────────────────────────────────── */}
      {modalTipo === 'receita' && !transacaoParaEditar && (
        <ModalReceita idUsuario={idUsuario} receita={null} membros={membros} contas={contas}
          aoFechar={() => setModalTipo(null)} aoSalvar={() => { carregarDados(); setModalTipo(null); }} />
      )}
      {modalTipo === 'despesa' && !transacaoParaEditar && (
        <ModalDespesa idUsuario={idUsuario} despesa={null} membros={membros} contas={contas} cartoes={cartoes}
          aoFechar={() => setModalTipo(null)} aoSalvar={() => { carregarDados(); setModalTipo(null); }} />
      )}
      {transacaoParaEditar?.tipo === 'receita' && !payloadPendente && (
        <ModalReceita idUsuario={idUsuario} receita={transacaoParaEditar} membros={membros} contas={contas}
          aoFechar={fecharEdicao} aoSalvar={() => { carregarDados(true); fecharEdicao(); }} aoSalvarPayload={handleSalvarPayload} />
      )}
      {transacaoParaEditar?.tipo === 'despesa' && !payloadPendente && (
        <ModalDespesa idUsuario={idUsuario} despesa={transacaoParaEditar} membros={membros} contas={contas} cartoes={cartoes}
          aoFechar={fecharEdicao} aoSalvar={() => { carregarDados(true); fecharEdicao(); }} aoSalvarPayload={handleSalvarPayload} />
      )}
      {transacaoParaEditar && payloadPendente && (
        <ModalEditarRecorrente transacao={transacaoParaEditar} onConfirmar={handleConfirmarEdicao} onCancelar={fecharEdicao} />
      )}
      {transacaoParaExcluir && (
        <ModalExcluirRecorrente
          transacao={transacaoParaExcluir}
          onConfirmar={async (modo: ModoExclusao) => { await TransacaoService.excluirComModo(transacaoParaExcluir, modo); setTransacaoParaExcluir(null); carregarDados(true); }}
          onCancelar={() => setTransacaoParaExcluir(null)}
        />
      )}
    </div>
  );
}
