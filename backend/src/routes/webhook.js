const express = require('express');
const router = express.Router();
const messageParser = require('../services/message-parser');
const supabaseService = require('../services/supabase-transacao');
const { transcreverAudio } = require('../services/groq-transcricao');
const { enviarMensagem } = require('../services/evolution-resposta');

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
      if (!mensagem.base64) {
        console.log('Áudio sem base64 ignorado');
        return res.status(200).json({ processado: false, motivo: 'audio_sem_base64' });
      }
      console.log('🎤 Áudio recebido, transcrevendo...');
      texto = await transcreverAudio(mensagem.base64);
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

    // Parse da mensagem
    const parsed = messageParser.parsarMensagem(texto, usuario.id);

    if (!parsed.parseado) {
      console.warn(`⚠️ Falha ao parsear: ${parsed.motivo}`);
      await enviarMensagem(numeroWhatsApp, `❓ Não entendi. Tente: _"Almoço R$ 35"_, _"Uber 20"_ ou _"Salário 5000"_`);
      return res.status(200).json({ processado: false, motivo: parsed.motivo });
    }

    // Salva no Supabase
    const resultado = await supabaseService.criarTransacao(usuario.id, parsed);

    if (!resultado.sucesso) {
      console.error(`❌ Erro ao salvar: ${resultado.erro}`);
      await enviarMensagem(numeroWhatsApp, '❌ Erro ao salvar a transação. Tente novamente.');
      return res.status(200).json({ processado: false, motivo: 'erro_ao_salvar' });
    }

    console.log(`✅ Transação criada: ${parsed.tipo} - ${parsed.categoria} R$ ${parsed.valor}`);

    // Confirmação para o usuário
    const emoji = parsed.tipo === 'despesa' ? '💸' : '💰';
    const confirmacao = `${emoji} *${parsed.categoria}* — R$ ${parsed.valor.toFixed(2)} registrado!`;
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
