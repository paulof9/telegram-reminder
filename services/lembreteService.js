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

// Adiciona um novo lembrete em memória
function adicionarLembrete(pessoaId, lembreteTexto, dataTexto) {
  const novoId = Data.length + 1;
  const novoLembrete = {
    id: novoId,
    pessoa: pessoaId,
    lembrete: lembreteTexto,
    data: dataTexto,
    notificado: false,
  };
  Data.push(novoLembrete);
  console.log(`Lembrete #${novoId} adicionado para ${pessoaId}`);
  return novoLembrete;
}

// Converte datas em texto (inclusive 'amanhã') para objetos Date (sincrono, não usa await)
function parseDataTexto(dataTexto) {
  if (!dataTexto) return null;
  const normalizado = dataTexto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
  if (normalizado === 'amanha') {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(9, 0, 0, 0);
    return amanha;
  }
    const match = dataTexto
      .trim()
      .match(/^(\d{1,2})[/\.\-](\d{1,2})(?:[/\.\-](\d{2,4}))?$/);
  if (!match) return null;
  let [, dia, mes, ano] = match;
  const anoCompleto = ano ? (ano.length === 2 ? `20${ano}` : ano) : new Date().getFullYear();
  // 4h (UTC) é usado para evitar problemas com fuso horário local
  const data = new Date(Number(anoCompleto), Number(mes) - 1, Number(dia), 4, 0, 0); 
  return Number.isNaN(data.getTime()) ? null : data;
}


// Retorna lembretes de um usuário
function listarLembretes(pessoaId) {
    return Data.filter(lembrete => lembrete.pessoa === pessoaId);
}

// Checa e notifica lembretes. Precisa receber a função de notificação do bot.
function iniciarMonitoramentoLembretes(bot, intervaloMs = 60 * 1000) {
  setInterval(async () => {
    const agora = Date.now();
    for (const lembrete of Data) {
      if (lembrete.notificado) continue;
      const dataExecucao = parseDataTexto(lembrete.data);
      if (!dataExecucao) continue;
      if (agora >= dataExecucao.getTime()) {
        try {
          // Usa a referência do bot injetada para enviar a mensagem
          await bot.sendMessage(
            lembrete.pessoa,
            `⏰ Lembrete: ${lembrete.lembrete} (agendado para ${lembrete.data})`
          );
          lembrete.notificado = true; // Marca como notificado
        } catch (err) {
          console.error(`Falha ao avisar lembrete #${lembrete.id}:`, err.message);
        }
      }
    }
  }, intervaloMs);
}


module.exports = {
  adicionarLembrete,
  listarLembretes,
  iniciarMonitoramentoLembretes,
  parseDataTexto,
};