import { useState, useEffect, useRef } from 'react';
import { ProvedorTema, useTema } from './contexts/TemaContexto';
import { SessaoContexto } from './contexts/SessaoContexto';
import { useTamanhoTela } from './hooks/useTamanhoTela';
import { UsuarioService } from './services/UsuarioService';
import { CartaoService } from './services/CartaoService';
import { TransacaoService } from './services/TransacaoService';
import Sidebar from './components/Sidebar/Sidebar';
import HeaderGlobal from './components/HeaderGlobal/HeaderGlobal';
import MobileSidebar from './components/MobileSidebar/MobileSidebar';
import TelaDeCarga from './components/LoadingScreen/LoadingScreen';
import PaginaDashboard from './pages/Dashboard/DashboardPage';
import PaginaTransacoes from './pages/Transacoes/TransacoesPage';
import PaginaRelatorios from './pages/Relatorios/RelatoriosPage';
import PaginaMembros from './pages/Membros/MembrosPage';
import PaginaAutenticacao from './pages/Auth/AuthPage';
import PaginaOnboarding from './pages/Onboarding/OnboardingPage';
import { useNotificacoes } from './hooks/useNotificacoes';
import type { Usuario, Cartao, Transacao } from './types';
import type { Notificacao, FiltroTransacao } from './hooks/useNotificacoes';

type Tela = 'dashboard' | 'transacoes' | 'relatorios' | 'membros';

function AppInterno() {
  const { cores, tema, alternarTema } = useTema();
  const { ehDesktop } = useTamanhoTela();

  const [usuarioAtual,       setUsuarioAtual]       = useState<Usuario | null>(null);
  const [carregando,         setCarregando]         = useState(true);
  const [mostrarOnboarding,  setMostrarOnboarding]  = useState(false);
  const [telaAtiva,          setTelaAtiva]          = useState<Tela>('dashboard');
  const [mesAtual,           setMesAtual]           = useState(new Date().getMonth() + 1);
  const [anoAtual,           setAnoAtual]           = useState(new Date().getFullYear());
  const [visivel,            setVisivel]            = useState(true);
  const [atualizando,        setAtualizando]        = useState(false);
  const [menuMobileAberto,   setMenuMobileAberto]   = useState(false);
  const [cartoesNotif,       setCartoesNotif]       = useState<Cartao[]>([]);
  const [transacoesNotif,    setTransacoesNotif]    = useState<Transacao[]>([]);
  const [filtroTransacoes,   setFiltroTransacoes]   = useState<FiltroTransacao | undefined>(undefined);

  const notificacoes = useNotificacoes(cartoesNotif, transacoesNotif);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    verificarUsuario();

    const sub = UsuarioService.inscreverMudancaSessao(logado => {
      if (logado) verificarUsuario();
      else setUsuarioAtual(null);
    });

    return () => { sub.then(s => s.unsubscribe()); };
  }, []);

  // Busca dados para notificações sempre que usuário/mês mudar
  useEffect(() => {
    if (!usuarioAtual) return;
    Promise.all([
      CartaoService.listar(usuarioAtual.id),
      TransacaoService.listar(usuarioAtual.id, anoAtual, mesAtual),
    ]).then(([cartoes, txs]) => {
      setCartoesNotif(cartoes);
      setTransacoesNotif(txs);
    }).catch(() => {});
  }, [usuarioAtual, mesAtual, anoAtual]);

  const verificarUsuario = async () => {
    try {
      const resultado = await UsuarioService.obterSessao();
      if (!resultado) { setUsuarioAtual(null); return; }
      setUsuarioAtual(resultado.usuario);
      if (!resultado.onboardingCompleto) setMostrarOnboarding(true);
    } catch (e) {
      console.error(e);
      setUsuarioAtual(null);
    } finally {
      setCarregando(false);
    }
  };

  const fazerLogout = async () => {
    await UsuarioService.sair();
    setUsuarioAtual(null);
    setMostrarOnboarding(false);
    setMenuMobileAberto(false);
  };

  const trocarMes = (novoMes: number, novoAno: number) => {
    if (atualizando) return;
    setAtualizando(true);
    setVisivel(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setMesAtual(novoMes);
      setAnoAtual(novoAno);
      setVisivel(true);
      setAtualizando(false);
    }, 180);
  };

  const irMesAnterior = () =>
    trocarMes(
      mesAtual === 1 ? 12 : mesAtual - 1,
      mesAtual === 1 ? anoAtual - 1 : anoAtual,
    );

  const irProximoMes = () =>
    trocarMes(
      mesAtual === 12 ? 1 : mesAtual + 1,
      mesAtual === 12 ? anoAtual + 1 : anoAtual,
    );

  const mudarTela = (tela: Tela) => {
    setVisivel(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTelaAtiva(tela);
      setVisivel(true);
    }, 150);
  };

  const aoClicarNotificacao = (notif: Notificacao) => {
    if (notif.filtro) setFiltroTransacoes({ ...notif.filtro });
    mudarTela(notif.navegarPara as Tela);
  };

  if (carregando)        return <TelaDeCarga />;
  if (!usuarioAtual)     return <PaginaAutenticacao aoAutenticar={verificarUsuario} />;
  if (mostrarOnboarding) return (
    <PaginaOnboarding
      idUsuario={usuarioAtual.id}
      aoConcluir={() => { setMostrarOnboarding(false); verificarUsuario(); }}
    />
  );

  const HEADER_H_MOBILE = telaAtiva === 'membros' || telaAtiva === 'relatorios' ? 80 : 130;

  // Valor do contexto de sessão — disponível para todas as pages filhas
  const sessao = {
    idUsuario: usuarioAtual.id,
    mesAtual,
    anoAtual,
    trocarMes,
  };

  const conteudo = (
    <SessaoContexto.Provider value={sessao}>
      {telaAtiva === 'dashboard'  && <PaginaDashboard  />}
      {telaAtiva === 'transacoes' && <PaginaTransacoes aoMudarMes={trocarMes} filtroInicial={filtroTransacoes} />}
      {telaAtiva === 'relatorios' && <PaginaRelatorios />}
      {telaAtiva === 'membros'    && <PaginaMembros    />}
    </SessaoContexto.Provider>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: cores.bgPrimario,
      transition: 'background .3s ease',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── DESKTOP ─────────────────────────────────────────── */}
      {ehDesktop && (
        <>
          <Sidebar
            telaAtiva={telaAtiva}
            definirTela={mudarTela}
            nomeUsuario={usuarioAtual.nome}
            aoSair={fazerLogout}
            alternarTema={alternarTema}
            tema={tema}
          />
          <HeaderGlobal
            nomeUsuario={usuarioAtual.nome}
            mesAtual={mesAtual}
            anoAtual={anoAtual}
            aoMesAnterior={irMesAnterior}
            aoProximoMes={irProximoMes}
            aoSair={fazerLogout}
            mostrarMeses={telaAtiva !== 'membros'}
            notificacoes={notificacoes}
            aoClicarNotificacao={aoClicarNotificacao}
          />
          <div style={{
            marginLeft: 60,
            paddingTop: 64,
            paddingBottom: 32,
            opacity: visivel ? 1 : 0,
            transform: visivel ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity .2s ease, transform .2s ease',
          }}>
            {conteudo}
          </div>
        </>
      )}

      {/* ── MOBILE ──────────────────────────────────────────── */}
      {!ehDesktop && (
        <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
          <HeaderGlobal
            nomeUsuario={usuarioAtual.nome}
            mesAtual={mesAtual}
            anoAtual={anoAtual}
            aoMesAnterior={irMesAnterior}
            aoProximoMes={irProximoMes}
            aoSair={fazerLogout}
            mostrarMeses={telaAtiva !== 'membros'}
            aoAbrirMenu={() => setMenuMobileAberto(true)}
            notificacoes={notificacoes}
            aoClicarNotificacao={aoClicarNotificacao}
          />
          <div style={{
            paddingTop: HEADER_H_MOBILE,
            paddingBottom: 28,
            opacity: visivel ? 1 : 0,
            transform: visivel ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity .2s ease, transform .2s ease',
          }}>
            {conteudo}
          </div>
          <MobileSidebar
            aberto={menuMobileAberto}
            telaAtiva={telaAtiva}
            definirTela={mudarTela}
            nomeUsuario={usuarioAtual.nome}
            aoFechar={() => setMenuMobileAberto(false)}
            aoSair={fazerLogout}
          />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return <ProvedorTema><AppInterno /></ProvedorTema>;
}
