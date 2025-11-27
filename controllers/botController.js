const LembreteService = require('../services/lembreteService');

// Variável de estado para gerenciar a conversa de adição de lembrete
const lembretesPendentes = new Map(); // chatId -> { lembrete, recorrencia }
const dateRegex = /\b\d{1,2}[/.\-]\d{1,2}(?:[/.\-]\d{2,4})?\b/;
const acionadoresRegex = /\b(\w*(relembre|grave|lembre)\w*)\b/;
// Aqui agradecemos ao Copilot!
const recurrenciaMapa = {
    ano: { tipo: 'ano', rotulo: 'todos os anos' },
    anos: { tipo: 'ano', rotulo: 'todos os anos' },
    mes: { tipo: 'mes', rotulo: 'todos os meses' },
    meses: { tipo: 'mes', rotulo: 'todos os meses' },
    semana: { tipo: 'semana', rotulo: 'todas as semanas' },
    semanas: { tipo: 'semana', rotulo: 'todas as semanas' },
    dia: { tipo: 'dia', rotulo: 'todos os dias' },
    dias: { tipo: 'dia', rotulo: 'todos os dias' },
    segunda: { tipo: 'weekday', weekday: 1, rotulo: 'todas as segundas' },
    segundafeira: { tipo: 'weekday', weekday: 1, rotulo: 'todas as segundas' },
    tercafeira: { tipo: 'weekday', weekday: 2, rotulo: 'todas as terças' },
    tercas: { tipo: 'weekday', weekday: 2, rotulo: 'todas as terças' },
    terca: { tipo: 'weekday', weekday: 2, rotulo: 'todas as terças' },
    quarta: { tipo: 'weekday', weekday: 3, rotulo: 'todas as quartas' },
    quartafeira: { tipo: 'weekday', weekday: 3, rotulo: 'todas as quartas' },
    quintafeira: { tipo: 'weekday', weekday: 4, rotulo: 'todas as quintas' },
    quinta: { tipo: 'weekday', weekday: 4, rotulo: 'todas as quintas' },
    quintas: { tipo: 'weekday', weekday: 4, rotulo: 'todas as quintas' },
    sextafeira: { tipo: 'weekday', weekday: 5, rotulo: 'todas as sextas' },
    sexta: { tipo: 'weekday', weekday: 5, rotulo: 'todas as sextas' },
    sextas: { tipo: 'weekday', weekday: 5, rotulo: 'todas as sextas' },
    sabado: { tipo: 'weekday', weekday: 6, rotulo: 'todos os sábados' },
    sabados: { tipo: 'weekday', weekday: 6, rotulo: 'todos os sábados' },
    domingo: { tipo: 'weekday', weekday: 0, rotulo: 'todos os domingos' },
    domingos: { tipo: 'weekday', weekday: 0, rotulo: 'todos os domingos' },
};

function detectarRecorrencia(texto) {
    if (!texto) return null;
    const normalizado = texto
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
    const regex = /\b(?:todo(?:s|as)?|cada)\s+([a-z\-]+)/g;
    let match;
    while ((match = regex.exec(normalizado))) {
        const chave = match[1].replace('-feira', '');
        if (recurrenciaMapa[chave]) {
            return { ...recurrenciaMapa[chave], original: match[0] };
        }
    }
    return null;
}


// Função principal que configura todos os ouvintes do bot
function configurarHandlers(bot) {

    // --- Handler Geral de Mensagens ---
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
                // Detecta data e recorrência no início
                const dataText = dateRegex.test(text) ? text.match(dateRegex)[0] : null;
                const recorrenciaMensagem = detectarRecorrencia(text);

                if (dataText) {
                    // Caso tenha data, salva o lembrete imediatamente
                    const recorrenciaFinal = pendente.recorrencia || recorrenciaMensagem;
                    LembreteService.adicionarLembrete(
                        msg.chat.id,
                        pendente.lembrete,
                        dataText,
                        recorrenciaFinal,
                    ); // Chama o Service
                    lembretesPendentes.delete(msg.chat.id);
                    await bot.sendMessage(
                        msg.chat.id,
                        `✅ Lembrete "${pendente.lembrete}" salvo para ${dataText}.${recorrenciaFinal ? ` Repetirei ${recorrenciaFinal.rotulo}.` : ''}`
                    );
                } else if (recorrenciaMensagem) {
                    // Caso tenha recorrência, mas não data, solicita a data
                    pendente.recorrencia = recorrenciaMensagem;
                    lembretesPendentes.set(msg.chat.id, pendente);
                    await bot.sendMessage(
                        msg.chat.id,
                        `Anotado: ${recorrenciaMensagem.rotulo}. Agora me informe a data exata (ex: 15/08).`
                    );
                } else {
                    // Caso não tenha nem data nem recorrência, informa o erro
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

    // --- Handlers de Comandos ---
    
    // /start
    bot.onText(/^\/(start|iniciar)(?:\s+(.*))?$/, async (msg) => {
        await bot.sendMessage(
            msg.chat.id,
            '👋 Bem-vindo(a) ao remindmebot! Tente /ajuda para ver o que posso fazer.'
        );
    });

    // /lembretes
    bot.onText(/^\/lembretes(?:\s+(.*))?$/, async (msg) => {
        const lembretes = LembreteService.listarLembretes(msg.chat.id); // Chama o Service
        const lista = lembretes
            .map(l => `- ${l.lembrete} em ${l.data}${l.recorrencia ? ` (${l.recorrencia.rotulo || 'recorrente'})` : ''}`)
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
            '**/editar** - Editar um lembrete\n' +
            '**/excluir** - Excluir um lembrete\n' +
            '**/lembretes** - Listar seus lembretes\n' +
            'Para adicionar um lembrete, envie uma mensagem contendo palavras como **"relembre"**, **"grave"** ou **"lembre"**.'
        );
    });
    
    // --- Handler de Acionamento por Palavra-Chave ---

    bot.onText(acionadoresRegex, async (msg, match) => {
        const textoCompleto = (msg.text || '').trim();
        const palavraAcionadora = match && match[1] ? match[1] : '';
        const lembrete = textoCompleto.replace(palavraAcionadora, '').trim() || 'lembrete sem descrição';
        const recorrencia = detectarRecorrencia(textoCompleto);
        
        // Coloca o lembrete em estado de espera de data
        lembretesPendentes.set(msg.chat.id, { lembrete, recorrencia }); 
        
        await bot.sendMessage(
            msg.chat.id,
            `📅 Ok! Vou lembrar "${lembrete}".${recorrencia ? ` Detectei ${recorrencia.rotulo}.` : ''} Para qual data? (ex: 25/12/2025)`
        );
    });
}

module.exports = {
    configurarHandlers
};