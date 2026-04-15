const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabase-transacao');
const { transcreverAudio } = require('../services/groq-transcricao');
const { enviarMensagem } = require('../services/evolution-resposta');
const { parsearComIA } = require('../services/groq-parser');

// Controle de saudação diária por usuário (in-memory)
const ultimaSaudacao = new Map();

function primeiroNome(nome) {
  return (nome || 'você').split(' ')[0];
}

function nomeMesAtual() {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatarValor(valor) {
  return `R$ ${Number(valor).toFixed(2)}`;
}

function formatarListaMes(transacoes, tipo) {
  const tipoLabel = tipo === 'despesa' ? 'Despesas' : 'Receitas';
  const emoji = tipo === 'despesa' ? '💸' : '💰';

  if (!transacoes.length) {
    return `📊 Nenhuma ${tipoLabel.toLowerCase()} registrada em ${nomeMesAtual()}.`;
  }

  const total = transacoes.reduce((acc, t) => acc + Number(t.valor), 0);
  const linhas = transacoes.map(t => `• ${t.titulo} _(${t.categoria})_ — ${formatarValor(t.valor)}`);

  return [
    `${emoji} *${tipoLabel} de ${nomeMesAtual()}*`,
    ``,
    ...linhas,
    ``,
    `💰 *Total: ${formatarValor(total)}*`,
  ].join('\n');
}

function formatarListaCategoria(transacoes, tipo, categoria) {
  const tipoLabel = tipo === 'despesa' ? 'Despesas' : 'Receitas';
  const emoji = tipo === 'despesa' ? '📂' : '📈';

  if (!transacoes.length) {
    return `${emoji} Nenhuma ${tipoLabel.toLowerCase()} em *${categoria}* em ${nomeMesAtual()}.`;
  }

  const total = transacoes.reduce((acc, t) => acc + Number(t.valor), 0);
  const linhas = transacoes.map(t => `• ${t.titulo} — ${formatarValor(t.valor)}`);

  return [
    `${emoji} *${tipoLabel} em ${categoria} — ${nomeMesAtual()}*`,
    ``,
    ...linhas,
    ``,
    `💰 *Total: ${formatarValor(total)}*`,
  ].join('\n');
}

function deveEnviarSaudacao(userId) {
  const hoje = new Date().toDateString();
  if (ultimaSaudacao.get(userId) === hoje) return false;
  ultimaSaudacao.set(userId, hoje);
  return true;
}

function gerarSaudacao(nome) {
  const hora = new Date().getHours();
  let periodo, emoji;
  if (hora < 12)       { periodo = 'bom dia';    emoji = '🌅'; }
  else if (hora < 18)  { periodo = 'boa tarde';  emoji = '☀️'; }
  else                 { periodo = 'boa noite';  emoji = '🌙'; }

  const nome1 = primeiroNome(nome);

  return [
    `🐰 *Kippo Bank*`,
    ``,
    `${emoji} ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}, *${nome1}*! Que ótimo ter você por aqui!`,
    ``,
    `Estou pronto para registrar suas finanças. É só mandar uma mensagem ou áudio como:`,
    `• _"Almoço R$ 35"_`,
    `• _"Paguei o uber 22 reais"_`,
    `• _"Recebi salário 5000"_`,
    ``,
    `Vamos manter suas finanças em dia? 💪`,
  ].join('\n');
}

// Normaliza número BR: remove +55, adiciona 9º dígito se necessário
function normalizarNumero(numero) {
  let n = numero.replace(/\D/g, '');
  if (n.startsWith('55') && n.length >= 12) n = n.slice(2);
  if (n.length === 10) n = n.slice(0, 2) + '9' + n.slice(2);
  return n;
}

router.post('/messages', async (req, res) => {
  try {
    const { event, data } = req.body;

    if (event !== 'messages.upsert') {
      return res.status(200).json({ processado: false, motivo: 'evento_nao_suportado' });
    }

    if (!data) {
      return res.status(400).json({ erro: 'Dados não encontrados' });
    }

    const mensagem = data;

    // Ignora mensagens de grupos
    if (mensagem.key?.remoteJid?.endsWith('@g.us')) {
      return res.status(200).json({ processado: false, motivo: 'mensagem_grupo' });
    }

    // Ignora mensagens enviadas pelo próprio bot
    if (mensagem.key?.fromMe) {
      return res.status(200).json({ processado: false, motivo: 'mensagem_propria' });
    }

    // Extrai número do remetente
    const remoteJid = mensagem.key?.remoteJid;
    const numeroRaw = remoteJid?.split('@')[0];

    if (!numeroRaw) {
      return res.status(400).json({ erro: 'Número não identificado' });
    }

    const numeroWhatsApp = normalizarNumero(numeroRaw);
    console.log(`📱 Número normalizado: ${numeroRaw} → ${numeroWhatsApp}`);

    // Verifica se é mensagem de áudio
    const isAudio = mensagem.messageType === 'audioMessage' || mensagem.messageType === 'pttMessage';

    // Extrai texto (ou transcreve áudio)
    let texto = mensagem.message?.conversation ||
      mensagem.message?.extendedTextMessage?.text ||
      mensagem.message?.imageMessage?.caption;

    if (!texto && isAudio) {
      const base64 = mensagem.base64 || mensagem.message?.base64 || mensagem.message?.audioMessage?.base64;

      if (!base64) {
        console.log('Áudio sem base64 ignorado');
        return res.status(200).json({ processado: false, motivo: 'audio_sem_base64' });
      }
      console.log('🎤 Áudio recebido, transcrevendo...');
      texto = await transcreverAudio(base64);
      if (!texto) {
        await enviarMensagem(numeroWhatsApp, '❌ Não consegui entender o áudio. Tente enviar uma mensagem de texto.');
        return res.status(200).json({ processado: false, motivo: 'erro_transcricao' });
      }
    }

    if (!texto) {
      return res.status(200).json({ processado: false, motivo: 'sem_texto' });
    }

    console.log(`📬 Mensagem de ${numeroWhatsApp}: "${texto}"`);

    // Busca usuário no Supabase
    const usuario = await supabaseService.buscarUsuarioPorWhatsApp(numeroWhatsApp);

    if (!usuario) {
      console.warn(`⚠️ Usuário não encontrado para: ${numeroWhatsApp}`);
      return res.status(200).json({ processado: false, motivo: 'usuario_nao_encontrado' });
    }

    // Saudação diária
    if (deveEnviarSaudacao(usuario.id)) {
      await enviarMensagem(numeroWhatsApp, gerarSaudacao(usuario.nome));
    }

    // Parse da mensagem com IA
    const parsed = await parsearComIA(texto);

    // --- Consulta: todas as despesas/receitas do mês ---
    if (parsed.intent === 'consulta_mes') {
      const transacoes = await supabaseService.buscarTransacoesMes(usuario.id, parsed.tipo);
      await enviarMensagem(numeroWhatsApp, formatarListaMes(transacoes, parsed.tipo));
      return res.status(200).json({ processado: true, intent: 'consulta_mes' });
    }

    // --- Consulta: despesas/receitas de uma categoria ---
    if (parsed.intent === 'consulta_categoria') {
      const transacoes = await supabaseService.buscarTransacoesPorCategoria(usuario.id, parsed.tipo, parsed.categoria);
      await enviarMensagem(numeroWhatsApp, formatarListaCategoria(transacoes, parsed.tipo, parsed.categoria));
      return res.status(200).json({ processado: true, intent: 'consulta_categoria' });
    }

    // --- Intenção não reconhecida ---
    if (parsed.intent !== 'transacao') {
      await enviarMensagem(numeroWhatsApp, `❓ Não entendi. Tente:\n• _"Almoço R$ 35"_\n• _"Uber 20"_\n• _"O que gastei esse mês?"_\n• _"Despesas de Alimentação"_`);
      return res.status(200).json({ processado: false, motivo: 'intencao_desconhecida' });
    }

    // --- Registrar transação ---
    const resultado = await supabaseService.criarTransacao(usuario.id, parsed);

    if (!resultado.sucesso) {
      console.error(`❌ Erro ao salvar: ${resultado.erro}`);
      await enviarMensagem(numeroWhatsApp, '❌ Erro ao salvar a transação. Tente novamente.');
      return res.status(200).json({ processado: false, motivo: 'erro_ao_salvar' });
    }

    console.log(`✅ Transação criada: ${parsed.tipo} - ${parsed.categoria} R$ ${parsed.valor}`);

    const resumo = await supabaseService.buscarResumoMes(usuario.id, parsed.tipo, parsed.categoria);

    const nome1 = primeiroNome(usuario.nome);
    const tipoLabel = parsed.tipo === 'despesa' ? 'Despesa' : 'Receita';
    const emojiTipo = parsed.tipo === 'despesa' ? '💸' : '💰';
    const emojiCat = parsed.tipo === 'despesa' ? '📊' : '📈';

    const confirmacao = [
      `✅ *${tipoLabel} registrada, ${nome1}!*`,
      ``,
      `📝 *Título:* ${parsed.descricao}`,
      `${emojiTipo} *Valor:* R$ ${parsed.valor.toFixed(2)}`,
      `🏷️ *Categoria:* ${parsed.categoria}`,
      ``,
      `${emojiCat} *Total de ${tipoLabel}s no mês:* R$ ${resumo.totalMes.toFixed(2)}`,
      `📂 *Total em ${parsed.categoria} no mês:* R$ ${resumo.totalCategoria.toFixed(2)}`,
    ].join('\n');

    await enviarMensagem(numeroWhatsApp, confirmacao);

    return res.status(200).json({ processado: true, transacao: resultado.transacao?.id });
  } catch (erro) {
    console.error('Erro no webhook:', erro);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

router.get('/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

module.exports = router;
