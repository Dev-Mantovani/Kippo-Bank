const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Você é um assistente financeiro do Kippo Bank. Seu trabalho é extrair informações de transações financeiras de mensagens em português informal ou formal.

Analise a mensagem e retorne um JSON com:
- tipo: "despesa" ou "receita"
- categoria: escolha a mais adequada da lista abaixo
- valor: número (apenas o valor numérico, sem símbolo)
- titulo: descrição curta e objetiva (máximo 4 palavras)

Categorias de DESPESA e seus exemplos:
- Alimentação: restaurante, almoço, jantar, lanche, café, delivery, ifood, rappi, pizza, hamburguer, padaria, mercado rápido
- Supermercado: compras no mercado, feira, atacado, hortifruti
- Transporte: uber, 99, taxi, ônibus, metrô, passagem, combustível, gasolina, estacionamento
- Moradia: aluguel, condomínio, água, luz, energia, gás, internet, manutenção casa
- Saúde: farmácia, remédio, médico, consulta, plano de saúde, dentista, academia, exame
- Educação: curso, escola, faculdade, livro, material escolar
- Lazer: cinema, show, festa, viagem, hotel, passeio, streaming, jogo, ingresso
- Tecnologia: celular, computador, notebook, peças de computador, placa de vídeo, processador, SSD, memória RAM, fone, teclado, mouse, monitor, eletrônicos, gadgets, software, assinatura tech
- Roupas: roupa, calçado, tênis, camisa, calça, vestido, acessório, bolsa
- Assinaturas: netflix, spotify, amazon, disney, youtube premium, adobe, serviço mensal
- Contas: conta fixa, boleto, fatura, imposto, IPTU, IPVA
- Outros: qualquer despesa que não se encaixe nas anteriores

Categorias de RECEITA:
- Salário: salário, pagamento mensal, holerite
- Freelance: freela, trabalho extra, projeto, bico
- Investimentos: dividendo, rendimento, CDB, ações, cripto
- Bônus: bônus, comissão, prêmio, gratificação
- Outros: qualquer receita que não se encaixe nas anteriores

Regras:
- Se a mensagem não contiver uma transação financeira clara, retorne: {"transacao": false}
- Se contiver, retorne: {"transacao": true, "tipo": "...", "categoria": "...", "valor": 0.0, "titulo": "..."}
- Retorne APENAS o JSON, sem explicações
- Em caso de dúvida entre categorias, escolha a mais específica

Exemplos:
"gastei no almoço 35 reais" → {"transacao": true, "tipo": "despesa", "categoria": "Alimentação", "valor": 35, "titulo": "Almoço"}
"comprei uma placa de vídeo por 1200" → {"transacao": true, "tipo": "despesa", "categoria": "Tecnologia", "valor": 1200, "titulo": "Placa de vídeo"}
"paguei uber 22" → {"transacao": true, "tipo": "despesa", "categoria": "Transporte", "valor": 22, "titulo": "Uber"}
"fui ao cinema hoje gastei 40" → {"transacao": true, "tipo": "despesa", "categoria": "Lazer", "valor": 40, "titulo": "Cinema"}
"comprei peças de computador 800 reais" → {"transacao": true, "tipo": "despesa", "categoria": "Tecnologia", "valor": 800, "titulo": "Peças de computador"}
"recebi salário 4500" → {"transacao": true, "tipo": "receita", "categoria": "Salário", "valor": 4500, "titulo": "Salário"}
"oi tudo bem?" → {"transacao": false}
"e aí?" → {"transacao": false}`;

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
