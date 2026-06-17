# 🚀 Guia de Uso - FlashStoreBot

## 📖 Índice
1. [Instalação](#instalação)
2. [Configuração](#configuração)
3. [Executar](#executar)
4. [Comandos](#comandos)
5. [API de Desenvolvimento](#api-de-desenvolvimento)

---

## ⚙️ Instalação

### Pré-requisitos
- Node.js v16+
- npm v7+
- Bot Discord criado em https://discord.com/developers/applications

### Passos
```bash
# 1. Clonar/Entrar no diretório
cd FlashStoreBot

# 2. Instalar dependências
npm install

# 3. Criar arquivo .env
cp .env.example .env

# 4. Editar .env com seus dados
nano .env
```

---

## 🔑 Configuração

### 1. Arquivo `.env`
```env
TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id
GUILD_ID=seu_guild_id
DEBUG=false
```

### 2. Arquivo `config.js`
Edite os IDs dos roles e canais conforme sua Guild:

```javascript
ROLES: {
    SUPPORT: '1515190727951519827',      // ID do cargo de suporte
    EXTRA_1: '1515852204680937553',      // Cargo auxiliar 1
    EXTRA_2: '1514856496452735076'       // Cargo auxiliar 2
},

CHANNELS: {
    TICKETS_CATEGORY: '1514858352214282370',  // Categoria de tickets
    LOGS: '1516262121841758289',              // Canal de logs
    RATINGS: '1514858395319140412'            // Canal de avaliações
}
```

**Como encontrar IDs:**
1. Ativar "Modo de desenvolvedor" no Discord
2. Clicar com botão direito no canal/role
3. "Copiar ID do Canal/Cargo"

### 3. Permissões do Bot
Certifique-se que seu bot tem estas permissões:
- ✅ Gerenciar Canais
- ✅ Gerenciar Permissões
- ✅ Ler Mensagens
- ✅ Enviar Mensagens
- ✅ Gerenciar Mensagens
- ✅ Incorporar Links

---

## 🎮 Executar

### Modo Normal
```bash
npm start
```

### Modo Desenvolvimento (com reload automático)
```bash
npm run dev
```

### Fazer Deploy dos Comandos
```bash
npm run deploy
```

---

## 📋 Comandos Principais

### Admin/Suporte
```
/painel              - Enviar painel de tickets
/setup               - Enviar regras e termos
/estoque adicionar   - Adicionar itens ao estoque
/estoque remover     - Remover itens
/estoque ver         - Ver estoque completo
/venda registrar     - Registrar uma venda
/cupom criar         - Criar código de desconto
/cupom deletar        - Deletar cupom
/stats               - Ver estatísticas
/backup criar        - Fazer backup manual
/backup listar       - Listar backups
/backup restaurar    - Restaurar de backup
/metas definir       - Definir meta mensal
/metas ver           - Ver progresso da meta
```

### Cliente
```
/catalogo            - Ver produtos de Nitro
/nitrolink           - Ver produtos Nitro Link
/impulsos            - Ver pacotes de Impulsos
/avaliar             - Avaliar a loja
/niveis meu-nivel    - Ver seu nível
/niveis ranking      - Ver top 10 clientes
```

---

## 💻 API de Desenvolvimento

### Usar Funções de Utils

```javascript
const utils = require('./utils');

// Criar embed de sucesso
const embed = utils.createSuccessEmbed(
    'Operação Concluída',
    'Tudo funcionou perfeitamente!'
);

// Validar preço
if (!utils.isValidPrice(valor)) {
    return interaction.reply('Preço inválido!');
}

// Formatar preço
console.log(utils.formatPrice(19.99)); // "R$ 19,99"

// Criar barra de progresso
const bar = utils.createProgressBar(75, 100); // "███████▓░"
```

### Usar Funções de Features

```javascript
const Features = require('./features');

// Criar um backup
Features.createBackup(db);

// Adicionar avaliação
const rating = Features.addRating(userId, userName, 5, 'Ótimo!');

// Listar backups
const backups = Features.listBackups();

// Atualizar nível do cliente
Features.updateCustomerLevel(db, userId, userName);
```

### Acessar Configuração

```javascript
const config = require('./config');

// Acessar um role
console.log(config.ROLES.SUPPORT);

// Acessar um canal
console.log(config.CHANNELS.LOGS);

// Acessar um timeout
console.log(config.TIMERS.LOW_STOCK_CHECK);
```

---

## 📊 Estrutura do Banco de Dados

```javascript
{
  "stock": {
    "nitro mensal": {
      "nome": "Nitro Mensal",
      "quantidade": 50,
      "vendido": 10,
      "preco": 2.20
    }
  },
  "sales": [
    {
      "id": 1718518640000,
      "cliente": "Usuario#1234",
      "produto": "Nitro Mensal",
      "valor": 2.20,
      "custo": 1.50,
      "lucro": 0.70,
      "pagamento": "PIX",
      "quantidade": 1,
      "data": "2026-06-16T10:30:40.000Z"
    }
  ],
  "tickets": [...],
  "coupons": [...],
  "ratings": [...],
  "customer_levels": {...}
}
```

---

## 🔍 Logging

### Ver Logs
```bash
# Mostrar últimas 50 linhas
tail -n 50 bot.log

# Monitorar em tempo real
tail -f bot.log

# Filtrar erros
grep "ERROR\|❌" bot.log
```

### Modo Debug
```bash
# Ativar modo debug
DEBUG=true npm start
```

---

## 🐛 Troubleshooting

### Bot não conecta
```bash
# Verificar token
npm run deploy

# Reiniciar
npm start
```

### Comando não funciona
```bash
# Fazer deploy novamente
npm run deploy

# Verificar permissões no Discord
```

### Estoque não atualiza
```bash
# Verificar se data.json é gravável
ls -la data.json

# Restaurar backup
npm start # vai carregar do JSON
```

---

## 🚀 Dicas de Performance

1. **Limpar backups antigos** - Máximo 30 por padrão
2. **Monitorar memória** - Se > 500MB, investigar
3. **Restartar regularmente** - A cada semana é recomendado
4. **Usar /stats** - Para monitorar saúde da loja

---

## 📞 Suporte

Para relatar bugs ou sugerir features:
1. Verificar [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Verificar [IMPROVEMENTS.md](IMPROVEMENTS.md)
3. Verificar [CHANGELOG.md](CHANGELOG.md)

---

**Versão:** 2.0  
**Última atualização:** 2026-06-16
