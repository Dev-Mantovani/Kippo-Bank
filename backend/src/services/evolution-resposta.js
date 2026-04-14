const config = require('../config/environment');

/**
 * Envia mensagem de texto via Evolution API
 * @param {string} numero - Número normalizado (sem DDI), ex: 45998479273
 * @param {string} texto - Mensagem a enviar
 */
async function enviarMensagem(numero, texto) {
  const url = `${config.evolution.apiUrl}/message/sendText/kippo-bank-bot`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.evolution.apiKey,
      },
      body: JSON.stringify({
        number: `55${numero}`,
        text: texto,
      }),
    });

    if (!response.ok) {
      console.error('Erro ao enviar mensagem:', response.status);
    }
  } catch (erro) {
    console.error('Erro ao enviar mensagem WhatsApp:', erro.message);
  }
}

module.exports = { enviarMensagem };
