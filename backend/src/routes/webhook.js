const express = require('express');
const router = express.Router();
const messageParser = require('../services/message-parser');
const supabaseService = require('../services/supabase-transacao');

// Normaliza número BR: remove +55, adiciona 9º dígito se necessário
function normalizarNumero(numero) {
  let n = numero.replace(/\D/g, '');
  if (n.startsWith('55') && n.length >= 12) n = n.slice(2);
  if (n.length === 10) n = n.slice(0, 2) + '9' + n.slice(2);
  return n;
}

/**
 * Webhook para receber mensagens do Evolution API (Hostinger)
 * POST /webhook/messages
 *
 * Evolution API envia no formato:
 * {
 *   "event": "messages.upsert",
 *   "data": {
 *     "instanceName": "kippo-bank-bot",
 *     "messages": [{
 *       "key": { "remoteJid": "5511999999999@s.whatsapp.net" },
 *       "message": { "conversation": "Gato R$ 50" },
 *       "messageTimestamp": 1234567890
 *     }]
 *   }
 * }
 */
router.post('/messages', async (req, res) => {
  try {
    const { event, data } = req.body;

    // Valida se é evento de mensagem (Evolution API v2 envia data como objeto único)
    if (event !== 'messages.upsert') {
      console.log('Evento ignorado:', event);
      return res.status(200).json({ processado: false, motivo: 'evento_nao_suportado' });
    }

    if (!data) {
      return res.status(400).json({ erro: 'Dados não encontrados' });
    }

    // Evolution API v2: data é o objeto da mensagem diretamente
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
      console.warn('Número não encontrado em:', remoteJid);
      return res.status(400).json({ erro: 'Número não identificado' });
    }

    // Normaliza número: remove código do país 55 e garante 9º dígito (Brasil)
    const numeroWhatsApp = normalizarNumero(numeroRaw);
    console.log(`📱 Número normalizado: ${numeroRaw} → ${numeroWhatsApp}`);

    // Extrai texto da mensagem
    const texto =
      mensagem.message?.conversation ||
      mensagem.message?.extendedTextMessage?.text ||
      mensagem.message?.imageMessage?.caption;

    if (!texto) {
      console.log('Mensagem sem texto ignorada (pode ser áudio, imagem, etc)');
      return res.status(200).json({ processado: false, motivo: 'sem_texto' });
    }

    console.log(`📬 Mensagem de ${numeroWhatsApp}: "${texto}"`);

    // Busca usuário no Supabase
    const usuario = await supabaseService.buscarUsuarioPorWhatsApp(numeroWhatsApp);

    if (!usuario) {
      console.warn(`⚠️ Usuário não encontrado para: ${numeroWhatsApp}`);
      return res.status(200).json({
        processado: false,
        motivo: 'usuário_não_encontrado',
      });
    }

    // Parse da mensagem
    const parsed = messageParser.parsarMensagem(texto, usuario.id);

    if (!parsed.parseado) {
      console.warn(`⚠️ Falha ao parsear: ${parsed.motivo}`);
      return res.status(200).json({
        processado: false,
        motivo: parsed.motivo,
      });
    }

    // Salva no Supabase
    const resultado = await supabaseService.criarTransacao(usuario.id, parsed);

    if (!resultado.sucesso) {
      console.error(`❌ Erro ao salvar: ${resultado.erro}`);
      return res.status(200).json({
        processado: false,
        motivo: 'erro_ao_salvar',
      });
    }

    console.log(`✅ Transação criada: ${parsed.tipo} - ${parsed.categoria} R$ ${parsed.valor}`);

    return res.status(200).json({
      processado: true,
      transacao: resultado.transacao?.id,
    });
  } catch (erro) {
    console.error('Erro no webhook:', erro);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

/**
 * Health check
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
  });
});

module.exports = router;
