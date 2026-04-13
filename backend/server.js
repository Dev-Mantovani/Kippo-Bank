const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/webhook', require('./src/routes/webhook'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     🤖 Kippo Bank Bot Backend              ║
║     Rodando em http://localhost:${PORT}        ║
╚════════════════════════════════════════════╝

📬 Webhook: http://localhost:${PORT}/webhook/messages
❤️  Health: http://localhost:${PORT}/health
  `);
});

module.exports = app;
