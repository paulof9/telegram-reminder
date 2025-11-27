const dotenv = require('dotenv');
const TelegramBot = require('node-telegram-bot-api');
dotenv.config();
const token = process.env.TELEGRAM_BOT_TOKEN;

const Data = [{
  id: 1,
  pessoa: 7211594406,
  lembrete: 'teste de aviso',
  data: '02/07/2026',
  notificado: false,
}, {
  id: 2,
  pessoa: 7211594406,
  lembrete: 'teste de aviso dois',
  data: '27/12/2025',
  notificado: false,
}];

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

const lembretesPendentes = new Map(); // chatId -> { lembrete }
const dateRegex = /\b\d{1,2}[/.\-]\d{1,2}(?:[/.\-]\d{2,4})?\b/;

(async () => {
  try {
    await bot.deleteWebHook({ drop_pending_updates: true });
    console.log('Webhook removido; polling liberado.');
  } catch (err) {
    console.error('Falha ao remover webhook:', err.message);
}})();

bot.on('message', async (msg) => {
  try {
    const text = (msg.text || '').trim();
    if (!text) {  // mensagens vazias ou não textuais
      await bot.sendMessage(msg.chat.id, 'Envie uma mensagem em texto.');
      return;
    }
    if (text.startsWith('/start')) {
      return; // comando tratado pelo handler dedicado
    }

    const pendente = lembretesPendentes.get(msg.chat.id);
    if (pendente) {
      if (dateRegex.test(text)) {
        const dataText = text.match(dateRegex)[0];
        adicionarLembrete(msg.chat.id, pendente.lembrete, dataText);
        lembretesPendentes.delete(msg.chat.id);
        await bot.sendMessage(
          msg.chat.id,
          `Lembrete "${pendente.lembrete}" salvo para ${dataText}.`
        );
      } else {
        await bot.sendMessage(
          msg.chat.id,
          'Não entendi a data. Use algo como 31/12/2025.'
        );
      }
      return;
    }
    console.log(`Mensagem recebida (${msg.chat.id}): ${text}`);
    await bot.sendMessage(msg.chat.id, `Você disse: ${text}`);
  } catch (err) {
    console.error('Handler error:', err.message);
  }
});

bot.onText(/^\/start(?:\s+(.*))?$/, async (msg, match) => {
  const extra = (match && match[1]) ? match[1].trim() : '';
  await bot.sendMessage(
    msg.chat.id,
    'Bem-vindo(a) ao remindmebot! Respondo cada mensagem que você mandar. Tente /help.'
  );
});

bot.onText(/^\/lembretes(?:\s+(.*))?$/, async (msg, match) => {
  const extra = (match && match[1]) ? match[1].trim() : '';
  await bot.sendMessage(
    msg.chat.id,
    'Aqui estão seus lembretes:\n' +
    Data.filter(lembrete => lembrete.pessoa === msg.chat.id)
      .map(lembrete => `- ${lembrete.lembrete} em ${lembrete.data}`)
      .join('\n') || 'Nenhum lembrete encontrado.'
  );
});

bot.onText(/^\/ajuda(?:\s+(.*))?$/, async (msg, match) => {
  const extra = (match && match[1]) ? match[1].trim() : '';
  await bot.sendMessage(
    msg.chat.id,
    'Comandos disponíveis:\n' +
    '/start - Iniciar o bot\n' +
    '/lembretes - Listar seus lembretes\n' +
    'Para adicionar um lembrete, envie uma mensagem contendo palavras como "relembre", "grave" ou "lembre".'
  );
});

// adiciona um novo lembrete
function adicionarLembrete(pessoaId, lembreteTexto, dataTexto) {
  const novoId = Data.length + 1;
  Data.push({
    id: novoId,
    pessoa: pessoaId,
    lembrete: lembreteTexto,
    data: dataTexto,
    notificado: false,
  });
  return novoId;
}

// converte datas em texto para objetos Date
function parseDataTexto(dataTexto) {
  if (!dataTexto) return null;
  const match = dataTexto
    .trim()
    .match(/^(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2,4}))?$/);
  if (!match) return null;
  let [, dia, mes, ano] = match;
  const anoCompleto = ano ? (ano.length === 2 ? `20${ano}` : ano) : new Date().getFullYear();
  const data = new Date(Number(anoCompleto), Number(mes) - 1, Number(dia), 9, 0, 0); // executa às 09h
  return Number.isNaN(data.getTime()) ? null : data;
}

// avisa um lembrete
async function avisarLembrete(lembrete) {
  await bot.sendMessage(
    lembrete.pessoa,
    `Lembrete: ${lembrete.lembrete} (agendado para ${lembrete.data})`
  );
  lembrete.notificado = true;
}

// checa a cada minuto por lembretes a notificar
function iniciarMonitoramentoLembretes(intervaloMs = 60 * 1000) {
  setInterval(async () => {
    const agora = Date.now();
    for (const lembrete of Data) {
      // se estiver notificado, pula
      if (lembrete.notificado) continue;
      const dataExecucao = parseDataTexto(lembrete.data);
      if (!dataExecucao) continue;
      if (agora >= dataExecucao.getTime()) {
        try {
          await avisarLembrete(lembrete);
        } catch (err) {
          console.error('Falha ao avisar lembrete:', err.message);
        }
      }
    }
  }, intervaloMs);
}

bot.onText(/\b(\w*(relembre|grave|lembre)\w*)\b/, async (msg, match) => {
  const textoCompleto = (msg.text || '').trim();
  const palavraAcionadora = match && match[1] ? match[1] : '';
  const lembrete = textoCompleto.replace(palavraAcionadora, '').trim() || 'lembrete sem descrição';
  lembretesPendentes.set(msg.chat.id, { lembrete });
  await bot.sendMessage(
    msg.chat.id,
    `Ok! Vou lembrar "${lembrete}". Para qual data? (ex: 25/12/2025)`
  );
});


bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
  if (err.response?.body) {
    console.error('Response body:', err.response.body);
  }
  if (err.cause) {
    console.error('Cause:', err.cause);
  }
  if (!err.cause && !err.response?.body) {
    console.error('Polling error details:', err);
  }
});
iniciarMonitoramentoLembretes();
console.log('Bot is running...');


/*
Lembretes de contato
"Ei, já faz 15 dias que você não fala com Ana."
*/