const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Você é um assistente financeiro do Kippo Bank. Seu trabalho é extrair informações de transações financeiras de mensagens em português.

Analise a mensagem e retorne um JSON com:
- tipo: "despesa" ou "receita"
- categoria: uma das opções abaixo
- valor: número (apenas o valor numérico)

Categorias de DESPESA: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Supermercado, Combustível, Roupas, Internet, Assinaturas, Contas, Aluguel
Categorias de RECEITA: Salário, Freelance, Investimentos, Bônus

Regras:
- Se a mensagem não contiver uma transação financeira clara, retorne: {"transacao": false}
- Se contiver, retorne: {"transacao": true, "tipo": "...", "categoria": "...", "valor": 0.0, "titulo": "..."}
- O "titulo" deve ser curto e descritivo (máximo 4 palavras), ex: "Almoço", "Uber para trabalho", "Cinema com amigos"
- Retorne APENAS o JSON, sem explicações

Exemplos:
"gastei no almoço 35 reais" → {"transacao": true, "tipo": "despesa", "categoria": "Alimentação", "valor": 35, "titulo": "Almoço"}
"paguei uber 22" → {"transacao": true, "tipo": "despesa", "categoria": "Transporte", "valor": 22, "titulo": "Uber"}
"fui ao cinema hoje gastei 40" → {"transacao": true, "tipo": "despesa", "categoria": "Lazer", "valor": 40, "titulo": "Cinema"}
"recebi salário 4500" → {"transacao": true, "tipo": "receita", "categoria": "Salário", "valor": 4500, "titulo": "Salário"}
"oi tudo bem?" → {"transacao": false}`;

async function parsearComIA(texto) {
  try {
    const resposta = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: texto },
      ],
      temperature: 0,
      max_tokens: 100,
    });

    const conteudo = resposta.choices[0]?.message?.content?.trim();
    const resultado = JSON.parse(conteudo);

    if (!resultado.transacao) {
      return { parseado: false, motivo: 'Sem transação identificada na mensagem' };
    }

    console.log(`🤖 IA parseou: ${resultado.tipo} - ${resultado.categoria} R$ ${resultado.valor}`);

    return {
      parseado: true,
      tipo: resultado.tipo,
      categoria: resultado.categoria,
      valor: resultado.valor,
      descricao: resultado.titulo || texto,
      confianca: 0.9,
      dataCriacao: new Date(),
    };
  } catch (erro) {
    console.error('Erro no parser IA:', erro.message);
    return { parseado: false, motivo: 'Erro ao processar com IA' };
  }
}

module.exports = { parsearComIA };
