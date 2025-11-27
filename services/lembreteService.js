const Data = [{
  id: 1,
  pessoa: 7211594406,
  lembrete: 'teste de aviso',
  data: '02/07/2026',
  notificado: false,
  recorrencia: null,
}, {
  id: 2,
  pessoa: 7211594406,
  lembrete: 'teste de aviso dois',
  data: '27/12/2025',
  notificado: false,
  recorrencia: null,
}];

// Adiciona um novo lembrete em memória
function adicionarLembrete(pessoaId, lembreteTexto, dataTexto, recorrencia = null) {
  const novoId = Data.length + 1;
  const novoLembrete = {
    id: novoId,
    pessoa: pessoaId,
    lembrete: lembreteTexto,
    data: dataTexto,
    notificado: false,
    recorrencia,
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

function formatarData(data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function calcularProximaData(dataAtual, recorrencia) {
  if (!dataAtual || !recorrencia) return null;
  const proxima = new Date(dataAtual.getTime());
  switch (recorrencia.tipo) {
    case 'dia':
      proxima.setDate(proxima.getDate() + 1);
      return proxima;
    case 'semana':
      proxima.setDate(proxima.getDate() + 7);
      return proxima;
    case 'mes':
      proxima.setMonth(proxima.getMonth() + 1);
      return proxima;
    case 'ano':
      proxima.setFullYear(proxima.getFullYear() + 1);
      return proxima;
    case 'weekday': {
      const target = recorrencia.weekday;
      const atual = proxima.getDay();
      let diff = (target - atual + 7) % 7;
      if (diff === 0) diff = 7;
      proxima.setDate(proxima.getDate() + diff);
      return proxima;
    }
    default:
      return null;
  }
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
          const proxima = calcularProximaData(dataExecucao, lembrete.recorrencia);
          if (proxima) {
            lembrete.data = formatarData(proxima);
            lembrete.notificado = false;
            console.log(`Lembrete #${lembrete.id} reagendado para ${lembrete.data}`);
          } else {
            lembrete.notificado = true; // Marca como notificado definitivo
          }
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
  formatarData,
  calcularProximaData,
};