const dotenv = require('dotenv');
const TelegramBot = require('node-telegram-bot-api');
const BotController = require('./controllers/botController');
const LembreteService = require('./services/lembreteService');

dotenv.config();
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN não definido no .env');
}

const bot = new TelegramBot(token, {
  polling: {
    interval: 300,
    family: 4,
    params: { timeout: 10 },
  },
});

// Remove o webhook antes de iniciar o polling
(async () => {
  try {
    await bot.deleteWebHook({ drop_pending_updates: true });
    console.log('Webhook removido; polling liberado.');
  } catch (err) {
    console.error('Falha ao remover webhook:', err.message);
}})();


// --- Cfg ---

BotController.configurarHandlers(bot);
LembreteService.iniciarMonitoramentoLembretes(bot);

// --- Main ---

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
});

console.log('Bot is running...');