# 🤖 Kippo Bank Bot Backend - Integrado com Evolution Hostinger

Bot simples que recebe mensagens do Evolution API e cria transações no Supabase.

## 🎯 O que faz?

Recebe mensagens de WhatsApp via webhook do Evolution:
- `"Gato R$ 50"` → Cria despesa "Lazer" de R$ 50
- `"Uber 25"` → Cria despesa "Transporte" de R$ 25
- `"Salário 5000"` → Cria receita "Salário" de R$ 5000

## 📋 Pré-requisitos

- Node.js 16+
- Conta Supabase com campo `whatsapp_number` em `users_profile`
- Evolution API rodando no Hostinger (já tem!)

## 🚀 Setup Local

### 1. Configure `.env`

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
EVOLUTION_API_URL=https://evo.gestaocrm.cloud
EVOLUTION_API_KEY=27WDz7wDhAgKIhCrCU0blz52vDBQgjfh
PORT=3001
NODE_ENV=development
```

### 2. Instale dependências

```bash
cd backend
npm install
```

### 3. Inicie o servidor

```bash
npm run dev
```

Deve aparecer:
```
╔════════════════════════════════════════════╗
║     🤖 Kippo Bank Bot Backend              ║
║     Rodando em http://localhost:3001        ║
╚════════════════════════════════════════════╝
```

## 🔗 Configurar Webhook no Evolution (Hostinger)

### **Passo 1: Acesse Evolution**
- URL: `https://evo.gestaocrm.cloud/manager/`

### **Passo 2: Vá para Webhook Settings**
- Procure por: **Webhooks**, **Settings**, ou **Integrations**

### **Passo 3: Adicione webhook para mensagens**

Configure o evento `messages.upsert`:

```
URL: http://seu-dominio.com:3001/webhook/messages
(ou http://localhost:3001/webhook/messages se local)

Método: POST
Eventos: messages.upsert
```

Se pedir API Key ou Authorization:
```
Header: Authorization
Value: Bearer 27WDz7wDhAgKIhCrCU0blz52vDBQgjfh
```

### **Passo 4: Teste a conexão**

No Evolution, clique em "Test" ou "Send Test Message"

---

## ✅ Configuração Supabase

Você precisa do campo `whatsapp_number` em `users_profile`:

```sql
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_profile_whatsapp 
ON users_profile(whatsapp_number);
```

Depois, adicione seu número WhatsApp em um usuário:

```sql
UPDATE users_profile 
SET whatsapp_number = '5511999999999'
WHERE id = 'seu-user-id';
```

---

## 🧪 Testar Local

### Com curl (simular Evolution):

```bash
curl -X POST http://localhost:3001/webhook/messages \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "data": {
      "instanceName": "kippo-bank-bot",
      "messages": [{
        "key": { "remoteJid": "5511999999999@s.whatsapp.net" },
        "message": { "conversation": "Gato R$ 50" },
        "messageTimestamp": 1234567890
      }]
    }
  }'
```

**Esperado (se usuário não encontrado):**
```json
{
  "processado": false,
  "motivo": "usuário_não_encontrado"
}
```

**Esperado (se sucesso):**
```json
{
  "processado": true,
  "transacao": "uuid-da-transacao"
}
```

---

## 📊 Fluxo

```
WhatsApp → Evolution API (Hostinger)
         ↓
      Webhook POST
         ↓
   Bot Backend (localhost:3001)
         ↓
   Parse Mensagem
         ↓
   Busca usuário (whatsapp_number)
         ↓
   Salva no Supabase
         ↓
   ✅ Transação criada!
```

---

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| "usuário_não_encontrado" | Adicione `whatsapp_number` no Supabase para esse usuário |
| "Categoria não identificada" | Use palavras conhecidas: "Uber", "Gato", "Salário" |
| "Valor não encontrado" | Envie com valor: "Gato R$ 50" |
| 404 no webhook | Verifique URL do webhook no Evolution |

---

**Desenvolvido para Kippo Bank 🏦**
