# 🚀 Flash Store Bot Dashboard

Dashboard de monitoramento em tempo real para o Flash Store Bot com design futurístico e moderno.

## 🎨 Características

✨ **Design Futurístico**
- Interface moderna com tons de roxo, azul e efeitos neon
- Tema escuro otimizado para os olhos
- Animações suaves e transições fluidas
- Responsivo e otimizado para todos os dispositivos

📊 **Dashboard Principal**
- Estatísticas em tempo real (receita, vendas, clientes, lucro)
- Gráficos interativos com Chart.js
- Progresso de meta mensal
- Indicador de status do bot

💰 **Página de Vendas**
- Histórico completo de vendas
- Filtros por data, produto e cliente
- Detalhes de cada transação

📦 **Gerenciamento de Estoque**
- Visualização de todos os produtos
- Indicador de produtos com baixo estoque
- Quantidade vendida vs disponível

🎫 **Sistema de Tickets**
- Lista de todos os tickets abertos
- Status de cada suporte
- Responsável atribuído

🎟️ **Gerenciamento de Cupons**
- Cupons ativos e inativos
- Usos restantes
- Data de validade

👥 **Top Clientes**
- Clientes mais valiosos
- Nível/tier de cliente
- Total gasto
- Número de compras

## 🛠️ Instalação

### Pré-requisitos
- Node.js 14+ instalado
- npm ou yarn
- Flash Store Bot rodando

### Passos

1. **Instale as dependências:**
```bash
cd dashboard
npm install
```

2. **Inicie o servidor:**
```bash
npm start
```
### Digital Ocean / VPS
1. Clone o repositório
2. Instale Node.js
3. Execute `npm install && npm start`
4. Use PM2 ou similar para manter rodando


Ou para desenvolvimento com auto-reload:
```bash
npm run dev
```

3. **Acesse o dashboard:**
Abra seu navegador e vá para `http://localhost:3000`

## 🎯 Funcionalidades

### Navegação Principal
- **Dashboard** - Visão geral com estatísticas e gráficos
- **Vendas** - Histórico completo de transações
- **Estoque** - Controle de produtos
- **Tickets** - Gerenciamento de suporte
- **Cupons** - Gestão de descontos
- **Clientes** - Top clientes e ranking

### Atualizações em Tempo Real
- Dados sincronizam a cada 30 segundos
- WebSocket para notificações instantâneas
- Indicador de status do bot em tempo real

### Gráficos
- **Vendas por Dia** - Linha chart com últimos 7 dias
- **Produtos Mais Vendidos** - Doughnut chart com top 5


## 📦 Deploy & Execução em Produção (PM2)

Para rodar o dashboard em produção com `pm2` (recomendado em VPS):

```bash
cd dashboard
npm install --production
npm run pm2:start
```

Comandos úteis:

```bash
npm run pm2:restart   # reinicia app
npm run pm2:stop      # para app
pm2 logs flashstore-dashboard
```

## 🎥 Como gravar um screencast (FFmpeg)

Se quiser gravar um screencast localmente, instale `ffmpeg` e execute (Windows PowerShell):

```powershell
# Grava toda a tela por 10 segundos em arquivo MP4
ffmpeg -f gdigrab -framerate 30 -i desktop -t 10 -pix_fmt yuv420p screencast.mp4

# Converter para GIF (opcional)
ffmpeg -i screencast.mp4 -vf "fps=15,scale=900:-1:flags=lanczos" -loop 0 screencast.gif
```

Altere `-t 10` para a duração que desejar e use a janela do navegador apontando para `http://localhost:3000`.
## 📁 Estrutura

```
dashboard/
├── public/
│   ├── index.html      # Interface HTML
│   ├── style.css       # Estilos futurísticos
│   └── script.js       # Lógica do frontend
├── server.js           # Backend Express + WebSocket
├── package.json        # Dependências
└── README.md          # Este arquivo
```

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na pasta `dashboard`:

```env
PORT=3000
NODE_ENV=development
```

## 📊 Dados

O dashboard lê automaticamente do arquivo `data.json` do bot:
- Vendas (sales)
- Estoque (stock)
- Tickets (tickets)
- Cupons (coupons)
- Avaliações (ratings)
- Níveis de clientes (customer_levels)
- Estatísticas mensais (monthly_stats)

## 🎨 Customização de Cores

Para mudar as cores, edite as variáveis CSS em `public/style.css`:

```css
:root {
    --primary: #8A2BE2;        /* Roxo principal */
    --secondary: #00D9FF;      /* Azul neon */
    --accent: #FF006E;         /* Fúcsia */
    --success: #00D084;        /* Verde */
    --warning: #FFB703;        /* Amarelo */
    --danger: #FF006E;         /* Vermelho */
}
```

## 🚀 Deploy

### Heroku
1. Crie um app no Heroku
2. Configure a variável `PORT`
3. Deploy usando Git

### Digital Ocean / VPS
1. Clone o repositório
2. Instale Node.js
3. Execute `npm install && npm start`
4. Use PM2 ou similar para manter rodando

## 🐛 Troubleshooting

**Porta 3000 já está em uso:**
```bash
npm start PORT=3001
```

**WebSocket não conecta:**
Verifique se o firewall permite WebSocket na porta 3000

**Dados não aparecem:**
Confirme que o arquivo `../data.json` existe e tem dados válidos

### Testando WebSocket (rápido)

1) Usando `curl` para verificar `stats`:

```bash
curl http://localhost:3000/api/stats
```

2) Teste rápido com Node.js (conecta no WS e imprime mensagens):

```bash
node -e "const ws=new (require('ws'))('ws://localhost:3000'); ws.on('message',m=>console.log('MSG',m)); console.log('Conectando...');"
```

Se receber mensagens JSON com `type: 'stats'` ou `type: 'vendas'`, o realtime está funcionando.

## 📄 Licença

MIT

## 👨‍💻 Desenvolvido com ❤️

Dashboard criado para Flash Store Bot - Gerenciador de vendas no Discord
