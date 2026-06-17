# Flash Store Bot - Documentação Completa

> **Versão 2.1** - Refatorado e otimizado! 🎉

## 🎯 Início Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Ambiente
```bash
cp .env.example .env
# Edite .env com seu TOKEN, CLIENT_ID e GUILD_ID
```

### 3. Configurar IDs
```bash
# Edite config.js com os IDs do seu Discord
nano config.js
```

### 4. Deploy de Comandos
```bash
npm run deploy
```

### 5. Iniciar o Bot
```bash
npm start
```

---

## 📚 Documentação

### Para Usuários
- 📖 **[GUIDE.md](GUIDE.md)** - Guia completo de uso e comandos
- 📋 **[FEATURES.md](FEATURES.md)** - Lista de features disponíveis

### Para Desenvolvedores
- 🔧 **[IMPROVEMENTS.md](IMPROVEMENTS.md)** - O que foi refatorado
- 💻 **[config.js](config.js)** - Configuração centralizada
- 🛠️ **[utils.js](utils.js)** - Funções utilitárias
- 📝 **[CHANGELOG.md](CHANGELOG.md)** - Histórico de mudanças

### Para Troubleshooting
- 🐛 **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Soluções e otimizações
- 📊 **[SUMMARY.md](SUMMARY.md)** - Sumário executivo

---

## 🌟 O Que Mudou (v2.1)

✅ **Configuração centralizada** em `config.js`  
✅ **Código consolidado** - 230 linhas removidas  
✅ **Utilitários reutilizáveis** em `utils.js`  
✅ **Validações robustas** em todos os inputs  
✅ **Tratamento de erros** padronizado  
✅ **Documentação profissional** +1500 linhas  
✅ **Pronto para escalabilidade**

---

## 🚀 Instalação e Setup

### 1. Registrar Novos Comandos

```bash
npm run deploy
```

### 2. Iniciar o Bot

```bash
npm start
```

Você verá a mensagem:
```
✅ Bot conectado como FlashStoreBot#1234
✅ Sistema de backup automático iniciado
✅ Sistema de monitoramento de estoque iniciado
✅ Sistema de lembretes automáticos iniciado
```

### 3. Verificar Status

O bot deve aparecer como online no Discord. Os sistemas de monitoramento estão rodando em background.

---

## 📦 Dependências

Todas as dependências já estão instaladas. Se precisar reinstalar:

```bash
npm install
```

**Dependências:**
- `discord.js@^14.26.4`
- `dotenv@^17.4.2`
- `qrcode@^1.5.4`

---

## 🔑 Variáveis de Ambiente

Arquivo `.env`:
```
TOKEN=seu_token_do_bot_aqui
```

---

## 📋 Novos Arquivos Criados

1. **features.js** - Módulo com todas as novas funcionalidades
2. **FEATURES.md** - Documentação completa de todas as features
3. **logs/** - Pasta para armazenar logs de erros
4. **backups/** - Pasta para armazenar backups automáticos

---

## ✅ O Que foi Adicionado

### Novos Comandos:
- `/avaliar` - Deixar avaliações
- `/painel-dash` - Ver painel principal
- `/backup` - Gerenciar backups
- `/config-spam` - Configurar anti-spam
- `/metas` - Gerenciar metas mensais
- `/niveis` - Ver níveis dos clientes

### Novos Sistemas Automáticos:
- ⚠️ Alerta de estoque baixo (a cada 5 min)
- 💾 Backup automático (a cada 6h e meia-noite)
- ⏰ Lembretes automáticos (a cada 1h)
- 🛡️ Sistema anti-spam
- 🏆 Atualização automática de níveis
- 🎯 Atualização de metas mensais

---

## 🐛 Troubleshooting

### Bot não conecta
- Verifique o TOKEN em `.env`
- Verifique as intenções do bot em Discord Developer Portal

### Comandos não aparecem
- Execute `node deploy-commands.js`
- Aguarde alguns minutos
- Se persistir, tente reiniciar o Discord

### Erros de permissão
- Verifique se os IDs de canais e cargos estão corretos
- Verifique se o bot tem permissões nos canais

### Logs não são criados
- Pasta `logs/` será criada automaticamente
- Verifique permissões da pasta

---

## 📊 Dados

Todos os dados são salvos em `data.json`:

```bash
# Fazer backup manual
node deploy-commands.js  # Depois /backup criar

# Restaurar backup
/backup restaurar arquivo: backup_2026_06_16_12-30-45.json
```

---

## 🔧 Configuração de IDs

Os seguintes IDs precisam estar configurados em `index.js`:

```javascript
const SUPORTE_ROLE_ID = '1515190727951519827';
const CARGO_EXTRA_1_ID = '1515852204680937553';
const CARGO_EXTRA_2_ID = '1514856496452735076';
const CATEGORIA_TICKETS_ID = '1514858352214282370';
const CANAL_REGRAS_ID = '1514858977026900050';
const CANAL_TERMOS_ID = '1514858386825543801';
const LOG_CHANNEL_ID = '1516262121841758289';
const STOCK_MESSAGE_CHANNEL_ID = '1516270527897927730';
const STOCK_CONFIRM_CHANNEL_ID = '1514858391963439114';
```

Atualize-os com seus IDs do Discord conforme necessário.

---

## 📈 Próximas Melhorias

Ideias para futuras atualizações:

1. **Dashboard web** - Interface visual para gerenciar dados
2. **Notificações por email** - Alertas por email
3. **Integração de pagamento** - PIX, Stripe, etc.
4. **Sistema de afiliados** - Programa de referência
5. **Analytics avançado** - Gráficos e relatórios

---

## 💬 Suporte

Para mais informações, consulte:
- [FEATURES.md](FEATURES.md) - Documentação completa
- Discord Developer Portal - Para configurar bot
- discord.js documentação - Para desenvolvimento

---

**Versão:** 2.1.0
**Última atualização:** 17 de Junho de 2026
**Status:** ✅ Produção
