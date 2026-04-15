const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Você é um assistente financeiro do Kippo Bank. Analise mensagens em português e classifique a intenção em um destes tipos:

## TIPO 1 — Registrar transação
Retorne: {"intent": "transacao", "tipo": "despesa"|"receita", "categoria": "...", "valor": 0.0, "titulo": "..."}

Categorias de DESPESA:
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

## TIPO 2 — Consultar todas as despesas ou receitas do mês
Palavras-chave: "o que gastei", "minhas despesas", "quais despesas", "lista de gastos", "o que compõe", "ver despesas", "minhas receitas", "o que recebi"
Retorne: {"intent": "consulta_mes", "tipo": "despesa"|"receita"}
Padrão quando não especificado: tipo = "despesa"

## TIPO 3 — Consultar despesas ou receitas de uma categoria específica
Palavras-chave: "despesas de X", "gastos em X", "o que gastei em X", "compras de X", "receitas de X"
Retorne: {"intent": "consulta_categoria", "tipo": "despesa"|"receita", "categoria": "..."}
Use o mesmo nome de categoria da lista acima (ex: "Alimentação", "Transporte").

## TIPO 4 — Mensagem sem intenção financeira
Retorne: {"intent": "desconhecido"}

Regras:
- Retorne APENAS o JSON, sem explicações
- titulo: máximo 4 palavras, descritivo
- Em caso de dúvida entre categorias, escolha a mais específica

Exemplos:
"gastei no almoço 35 reais" → {"intent": "transacao", "tipo": "despesa", "categoria": "Alimentação", "valor": 35, "titulo": "Almoço"}
"paguei uber 22" → {"intent": "transacao", "tipo": "despesa", "categoria": "Transporte", "valor": 22, "titulo": "Uber"}
"comprei peças de computador 800 reais" → {"intent": "transacao", "tipo": "despesa", "categoria": "Tecnologia", "valor": 800, "titulo": "Peças de computador"}
"recebi salário 4500" → {"intent": "transacao", "tipo": "receita", "categoria": "Salário", "valor": 4500, "titulo": "Salário"}
"o que compõe minhas despesas esse mês?" → {"intent": "consulta_mes", "tipo": "despesa"}
"quais foram meus gastos esse mês" → {"intent": "consulta_mes", "tipo": "despesa"}
"minhas despesas de alimentação" → {"intent": "consulta_categoria", "tipo": "despesa", "categoria": "Alimentação"}
"o que gastei em transporte" → {"intent": "consulta_categoria", "tipo": "despesa", "categoria": "Transporte"}
"oi tudo bem?" → {"intent": "desconhecido"}`;

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

    if (resultado.intent === 'transacao') {
      console.log(`🤖 IA parseou: ${resultado.tipo} - ${resultado.categoria} R$ ${resultado.valor}`);
      return {
        intent: 'transacao',
        tipo: resultado.tipo,
        categoria: resultado.categoria,
        valor: resultado.valor,
        descricao: resultado.titulo || texto,
        dataCriacao: new Date(),
      };
    }

    if (resultado.intent === 'consulta_mes') {
      console.log(`🔍 IA detectou consulta mensal: ${resultado.tipo}`);
      return { intent: 'consulta_mes', tipo: resultado.tipo || 'despesa' };
    }

    if (resultado.intent === 'consulta_categoria') {
      console.log(`🔍 IA detectou consulta por categoria: ${resultado.tipo} - ${resultado.categoria}`);
      return { intent: 'consulta_categoria', tipo: resultado.tipo || 'despesa', categoria: resultado.categoria };
    }

    return { intent: 'desconhecido' };
  } catch (erro) {
    console.error('Erro no parser IA:', erro.message);
    return { intent: 'desconhecido' };
  }
}

module.exports = { parsearComIA };
