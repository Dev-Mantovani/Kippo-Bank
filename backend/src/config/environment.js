require('dotenv').config();

module.exports = {
  evolution: {
    apiUrl: process.env.EVOLUTION_API_URL || 'https://evo.gestaocrm.cloud',
    apiKey: process.env.EVOLUTION_API_KEY,
  },
  supabase: {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  },
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};
