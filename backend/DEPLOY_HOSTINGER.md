# 🚀 Deploy Bot Backend - Hostinger

Guia para deployar o bot backend na VPS Hostinger.

## **Opção 1: Via SSH (Recomendado)**

### **Passo 1: Conecte via SSH**

```bash
ssh root@seu-ip-hostinger
```

Ou use o terminal SSH do painel Hostinger.

### **Passo 2: Clone o repositório**

```bash
cd /home/kippo-bank  # ou sua pasta preferida
git clone https://github.com/seu-usuario/Kippo-Bank.git
cd Kippo-Bank/backend
```

### **Passo 3: Configure `.env`**

```bash
nano .env
```

Adicione:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
EVOLUTION_API_URL=https://evo.gestaocrm.cloud
EVOLUTION_API_KEY=27WDz7wDhAgKIhCrCU0blz52vDBQgjfh
PORT=3001
NODE_ENV=production
```

Salve: `Ctrl+X`, depois `Y`, depois `Enter`

### **Passo 4: Instale dependências**

```bash
npm install --production
```

### **Passo 5: Instale PM2 (gerenciador de processos)**

```bash
npm install -g pm2
```

### **Passo 6: Inicie o bot com PM2**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### **Passo 7: Verifique se está rodando**

```bash
pm2 list
```

Deve aparecer `kippo-bot` com status `online`.

Teste:
```bash
curl http://localhost:3001/health
```

---

## **Opção 2: Via EasyPanel (se usar)**

1. Acesse seu **EasyPanel**
2. Crie um novo **App**
3. Selecione **Node.js**
4. Aponte para a pasta `/backend`
5. Configure variáveis de ambiente (`.env`)
6. Deploy

---

## **Opção 3: Via Git + Webhook (Automático)**

Se seu repositório está no GitHub/GitLab, configure webhook para auto-deploy quando fizer push.

---

## 🔗 **Configurar Reverse Proxy (Nginx)**

Para acessar via `seu-dominio.com:3001` ou `seu-dominio.com/bot`:

### **Crie arquivo de configuração:**

```bash
sudo nano /etc/nginx/sites-available/kippo-bot
```

Adicione:
```nginx
server {
    listen 3001;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Ative:**

```bash
sudo ln -s /etc/nginx/sites-available/kippo-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ✅ **Checklist de Deploy**

- [ ] Repositório clonado em `/home/kippo-bank`
- [ ] `.env` configurado com Supabase e Evolution
- [ ] `npm install` executado
- [ ] PM2 instalado globalmente
- [ ] Bot iniciado com `pm2 start ecosystem.config.js`
- [ ] `pm2 list` mostra `kippo-bot online`
- [ ] `curl http://localhost:3001/health` retorna JSON
- [ ] Nginx configurado (se usar reverse proxy)

---

## 🔍 **Troubleshooting**

### Bot não inicia
```bash
pm2 logs kippo-bot  # Ver logs
pm2 restart kippo-bot  # Reiniciar
```

### Porta 3001 em uso
```bash
lsof -i :3001  # Ver processo
kill -9 PID  # Matar processo
```

### Variáveis de ambiente não funcionam
```bash
pm2 delete kippo-bot
# Edite .env novamente
pm2 start ecosystem.config.js
```

---

## 📝 **Próximo Passo**

Depois do deploy, configure o webhook no Evolution:

```
URL: http://seu-dominio.com:3001/webhook/messages
Evento: MESSAGES_UPSERT
```

---

**Deploy completo! 🎉**
