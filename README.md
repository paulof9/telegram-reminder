🗂️ Agenda Social — Um bot que evita que suas relações esfriem sem você perceber
🎯 Problema real

Pessoas perdem contato sem intenção. A vida engole, a rotina atropela, e quando veem… faz meses que não falam com alguém querido.
Isso atinge amizades, relacionamentos, networking e até pacientes (para psicólogos/coaches).

A maioria das soluções atuais foca em produtividade, não em manutenção de vínculos.

💡 Solução: um bot simples, mas emocionalmente inteligente

Um bot que roda no Telegram (ideal para MVP) e futuramente no WhatsApp.

Núcleo do produto

Lembretes de contato
"Ei, já faz 15 dias que você não fala com Ana."

Registro de encontros
"Saiu com alguém? Registra e ele calcula o próximo lembrete automaticamente."

‘Temperatura’ da amizade
Frequência → calor (alta), morno (média), frio (baixa).

Mensagens prontas
“Quer retomar o papo com alguém? Eis 3 sugestões de mensagem.”

Prompt de contexto
O bot lê o histórico do que você registrou e sugere frases personalizadas.

🧪 MVP — Telegram primeiro, WhatsApp depois
Por que Telegram é perfeito?

API aberta

Deploy rápido (Railway, Fly.io, Render, até um VPSzinho)

Webhooks simples

Zero custo inicial

Com 2 dias você lança algo funcional.

WhatsApp

Sim, dá pra ter, mas:

WhatsApp Cloud API → custa (R$ 0,20 a R$ 0,40 por conversa)

Precisa de aprovação

Precisa de número dedicado

Ideal para fase 2 ou versão Pro/B2B.

💸 Monetização inteligente

Você consegue cobrar sem que pareça “forçado”.

Planos Individuais

Free
3 contatos monitorados
Lembretes básicos

Pro — R$ 5/mês
ilimitado
sugestões de mensagem
sincronização entre dispositivos
prioridade de fila do bot
backup/export

B2B (Psicólogos, coaches, terapias, mentoria)

Acompanhamento de pacientes

Registro de sessões

Lembretes automáticos de follow-up

Dashboard simples via web

Preço: R$ 39–79/mês por profissional.

Gift subscription

Você manda uma assinatura para um amigo distante.
(Parece “fofo”, mas é bom dinheiro.)

🧭 Open Source? Sim — e muito vantajoso

Abrir o core do bot traz:

Credibilidade forte

Contribuições de voluntários

Crescimento orgânico por comunidade

Um baita case no GitHub pra você (e combina com seu estilo fullstack em formação)

Você pode abrir:

backend

documentação

issues e roadmap
E manter fechado apenas:

painel B2B

automações avançadas

prompts mais inteligentes

🛠️ Tech stack sugerida

Você domina isso, então fica natural:

Backend: Python (FastAPI) ou Node.js
DB: Postgres
Infra: Railway / Render / Docker
Bot: python-telegram-bot ou Telegraf.js
Painel Web: Next.js (ótimo pra portfolio)

🚀 Roadmap enxuto (para realmente lançar)
Semana 1 — MVP

cadastro de pessoas

intervalo de contato

lembretes via Telegram

registro de último contato

export JSON

Semana 2 — UX social

cálculo de “temperatura”

sugestões de mensagens

check-ins rápidos

ajustes nos lembretes

Semana 3 — Web dashboard

login Telegram

lista de contatos

gráfico de proximidade

edição em massa