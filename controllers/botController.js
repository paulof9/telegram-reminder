const LembreteService = require('../services/lembreteService');

// Variável de estado para gerenciar a conversa de adição de lembrete
const lembretesPendentes = new Map(); // chatId -> { lembrete }
const dateRegex = /\b\d{1,2}[/.\-]\d{1,2}(?:[/.\-]\d{2,4})?\b/;
const acionadoresRegex = /\b(\w*(relembre|grave|lembre)\w*)\b/;


// Função principal que configura todos os ouvintes do bot
function configurarHandlers(bot) {

    // --- 1. Handler Geral de Mensagens ---
    bot.on('message', async (msg) => {
        try {
            const text = (msg.text || '').trim();
            if (!text) {  // mensagens vazias ou não textuais
                await bot.sendMessage(msg.chat.id, 'Envie uma mensagem em texto.');
                return;
            }
            if (text.startsWith('/')) { // Ignora comandos que serão tratados por onText
                return;
            }

            // Lógica de Continuação: Se há um lembrete pendente
            const pendente = lembretesPendentes.get(msg.chat.id);
            if (pendente) {
                if (dateRegex.test(text)) {
                    const dataText = text.match(dateRegex)[0];
                    LembreteService.adicionarLembrete(msg.chat.id, pendente.lembrete, dataText); // 💡 Chama o Service
                    lembretesPendentes.delete(msg.chat.id);
                    await bot.sendMessage(
                        msg.chat.id,
                        `✅ Lembrete "${pendente.lembrete}" salvo para ${dataText}.`
                    );
                } else {
                    await bot.sendMessage(
                        msg.chat.id,
                        'Não entendi a data. Use algo como 31/12/2025.'
                    );
                }
                return;
            }

            // Lógica de Acionamento: Se a mensagem contém palavras-chave
            if (acionadoresRegex.test(text)) {
                // será tratado pelo onText dedicado, nada aqui.
                return;
            }
            
            // Caso padrão (eco)
            console.log(`Mensagem padrão recebida (${msg.chat.id}): ${text}`);
            await bot.sendMessage(msg.chat.id, `Você disse: ${text}`);

        } catch (err) {
            console.error('Handler error (on message):', err.message);
        }
    });

    // --- 2. Handlers de Comandos ---
    
    // /start
    bot.onText(/^\/(start|iniciar)(?:\s+(.*))?$/, async (msg) => {
        await bot.sendMessage(
            msg.chat.id,
            '👋 Bem-vindo(a) ao remindmebot! Tente /ajuda para ver o que posso fazer.'
        );
    });

    // /lembretes
    bot.onText(/^\/lembretes(?:\s+(.*))?$/, async (msg) => {
        const lembretes = LembreteService.listarLembretes(msg.chat.id); // 💡 Chama o Service
        const lista = lembretes
            .map(l => `- ${l.lembrete} em ${l.data}`)
            .join('\n');

        await bot.sendMessage(
            msg.chat.id,
            '📝 Aqui estão seus lembretes:\n' + (lista || 'Nenhum lembrete encontrado.')
        );
    });

    // /ajuda
    bot.onText(/^\/(ajuda|help)(?:\s+(.*))?$/, async (msg) => {
        await bot.sendMessage(
            msg.chat.id,
            'Comandos disponíveis:\n' +
            '**/start** - Iniciar o bot\n' +
            '**/lembretes** - Listar seus lembretes\n' +
            'Para adicionar um lembrete, envie uma mensagem contendo palavras como **"relembre"**, **"grave"** ou **"lembre"**.'
        );
    });
    
    // --- 3. Handler de Acionamento por Palavra-Chave ---

    bot.onText(acionadoresRegex, async (msg, match) => {
        const textoCompleto = (msg.text || '').trim();
        const palavraAcionadora = match && match[1] ? match[1] : '';
        const lembrete = textoCompleto.replace(palavraAcionadora, '').trim() || 'lembrete sem descrição';
        
        // Coloca o lembrete em estado de espera de data
        lembretesPendentes.set(msg.chat.id, { lembrete }); 
        
        await bot.sendMessage(
            msg.chat.id,
            `📅 Ok! Vou lembrar "${lembrete}". Para qual data? (ex: 25/12/2025)`
        );
    });
}

module.exports = {
    configurarHandlers
};