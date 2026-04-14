// Polyfill necessário para Node.js 18 (Groq SDK exige File global)
const { File } = require('node:buffer');
globalThis.File = File;

const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const os = require('os');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Transcreve áudio base64 usando Groq Whisper
 * @param {string} base64Audio - Áudio em base64
 * @returns {string|null} Texto transcrito ou null se falhar
 */
async function transcreverAudio(base64Audio) {
  const tempFile = path.join(os.tmpdir(), `kippo_audio_${Date.now()}.ogg`);

  try {
    fs.writeFileSync(tempFile, Buffer.from(base64Audio, 'base64'));

    const transcricao = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFile),
      model: 'whisper-large-v3',
      language: 'pt',
    });

    console.log(`🎤 Áudio transcrito: "${transcricao.text}"`);
    return transcricao.text;
  } catch (erro) {
    console.error('Erro ao transcrever áudio:', erro.message);
    return null;
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

module.exports = { transcreverAudio };
