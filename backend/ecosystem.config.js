module.exports = {
  apps: [{
    name: 'kippo-bot',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      VITE_SUPABASE_URL: 'https://ruaurkvkjkjpbbyystij.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1YXVya3ZramtqcGJieXlzdGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NzU3ODcsImV4cCI6MjA4NjM1MTc4N30.-ktenlCA2wfYBNHaPeygFOOp0bAkzXsKLKPrGZ5yOQs',
      EVOLUTION_API_URL: 'https://evo.gestaocrm.cloud',
      EVOLUTION_API_KEY: '27WDz7wDhAgKIhCrCU0blz52vDBQgjfh'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    watch: false,
    max_memory_restart: '200M',
    autorestart: true
  }]
};
