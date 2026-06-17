# 🏗️ ARQUITETURA - FlashStoreBot v2.0

## Diagrama de Estrutura

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLASHSTOREBOT v2.0                         │
└─────────────────────────────────────────────────────────────────┘

                         ⚙️ AMBIENTE
                            │
                ┌───────────┬┴────────────┐
              .env        TOKEN      DEBUG
                          CLIENT_ID
                          GUILD_ID

                    📋 CONFIGURAÇÃO
                         │
                    ┌────┴────┐
                 config.js  utils.js
                    │           │
        ┌───────────┼───────────┼───────────┐
        │           │           │           │
    ROLES       CHANNELS    TIMERS      LIMITS
    - SUPPORT   - TICKETS   - BACKUP    - MAX_BACKUPS
    - EXTRA_1   - LOGS      - STOCK     - LOW_STOCK
    - EXTRA_2   - RATINGS   - REMINDERS - ALERT_COOLDOWN
                             - HEALTH

                      🎮 INDEX.JS
                  (Bot Principal Refatorado)
                         │
        ┌────────────────┼────────────────┬─────────────────┐
        │                │                │                 │
    Comandos         Interactions      Eventos            Sistemas
    ├── /painel      ├── Chat Input    ├── Ready        ├── Backup
    ├── /estoque     ├── Buttons       ├── Message      ├── Stock
    ├── /venda       ├── Select Menu   │                ├── Reminders
    ├── /cupom       │                 │                │
    ├── /catalogo    │                 │                │
    ├── /stats       │                 │                │
    ├── /backup      │                 │                │
    ├── /metas       │                 │                │
    ├── /niveis      │                 │                │
    └── /avaliar     │                 │                └── Logger


                     📦 FEATURES.JS
            (Funcionalidades Adicionais)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    Ratings          Backups          Stats
    ├── addRating    ├── createBackup  ├── buildStats
    ├── createEmbed  ├── listBackups   ├── getAverage
    └── getAverage   └── restoreBackup └── calcLevels

                     💾 DATA.json
                         │
        ┌────────────────┼────────────────┬──────────────┐
        │                │                │              │
     stock             sales           tickets        coupons
     ├── nome          ├── cliente      ├── id         ├── nome
     ├── quantidade    ├── produto      ├── status     ├── desconto
     ├── vendido       ├── valor        ├── responsavel│ ├── validade
     └── preco         ├── custo        └── pedido      └── usos
                       └── lucro

                     📚 DOCUMENTAÇÃO
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     GUIDE.md       IMPROVEMENTS.md   TROUBLESHOOTING.md
     ├── Setup       ├── O que mudou   ├── Problemas
     ├── Comandos    ├── Benefícios    ├── Otimizações
     ├── API Dev     ├── Estrutura     ├── Segurança
     └── Database    └── Como usar     └── Escalabilidade
```

---

## 📊 Fluxo de Dados

### 1. Entrada de Comando
```
Usuário → Comando Discord → index.js → Handler específico
                                          │
                                    ┌─────┴──────┐
                                    │            │
                            Validação         Validação
                            (utils.js)        (DB)
                                    │            │
                                    └─────┬──────┘
                                         │
                                    Execução
                                         │
                              ┌──────────┴──────────┐
                              │                     │
                          Sucesso              Erro
                              │                     │
                         SaveDB()           ErrorEmbed
                              │                     │
                         Log (sucesso)      Log (erro)
                              │                     │
                        Resposta User        Resposta User
```

### 2. Fluxo de Venda
```
Compra → Ticket Aberto → PIX Enviado → Venda Registrada
           │                              │
      createTicketChannel()       ├─ Estoque (-1)
      + Permissões               ├─ Vendido (+1)
      + Embed                    ├─ Sales.unshift()
                                 ├─ CustomerLevel++
                                 ├─ MonthlyStats++
                                 └─ SaveDB()
```

### 3. Fluxo de Sistemas Automáticos
```
Bot Ready
    │
    ├─ setupAutoBackup()     → a cada 6h ou meia-noite
    │                           └─ createBackup(db)
    │
    ├─ setupLowStockMonitoring()  → a cada 5 min
    │                                 └─ Alerta se < 5
    │
    └─ setupReminderSystem()   → a cada 1 hora
                                   └─ Enviar DM reminders
```

---

## 🔄 Ciclo de Vida de um Ticket

```
1. ABERTO
   └─ Usuário clica em "Criar Ticket"
   └─ createTicketChannel() → novo canal privado
   └─ ticketEntry → db.tickets
   └─ log enviado

2. EM_ANDAMENTO
   └─ Suporte clica "Assumir Ticket"
   └─ ticket.status = "em_andamento"
   └─ ticket.responsavel = username
   └─ SaveDB()

3. FECHADO
   └─ Suporte clica "Fechar Ticket"
   └─ ticket.status = "fechado"
   └─ ticket.fechadoEm = timestamp
   └─ SaveDB()
   └─ canal deletado em 5s
   └─ log enviado
```

---

## 📡 Comunicação Entre Módulos

```
┌─────────────┐
│  index.js   │
└──────┬──────┘
       │
    ┌──┴─────────────────────┬────────────┐
    │                        │            │
    ▼                        ▼            ▼
 ┌──────┐              ┌────────┐    ┌────────┐
 │config│              │ utils  │    │features│
 └──────┘              └────────┘    └────────┘
    │                       │            │
    └───────────┬───────────┴────────────┘
                ▼
            ┌────────┐
            │data.json│
            └────────┘
```

### Dependências
```
index.js
├── require('dotenv')
├── require('discord.js')
├── require('qrcode')
├── require('./config')         ← Configurações
├── require('./utils')          ← Utilitários
└── require('./features')       ← Features adicionais

utils.js
└── require('./config')         ← Para acessar configurações

features.js
├── require('fs')
├── require('path')
├── require('discord.js')
└── (autossuficiente)

config.js
└── (nenhuma dependência interna)
```

---

## 🎯 Mapeamento de Funções

### config.js
- Apenas declarações (0 funções)

### utils.js (13 funções)
```
✓ normalizeName()
✓ isValidPrice()
✓ isValidQuantity()
✓ createTicketPermissions()
✓ createTicketChannel()
✓ formatPrice()
✓ formatPercentage()
✓ createProgressBar()
✓ createSuccessEmbed()
✓ createErrorEmbed()
✓ createInfoEmbed()
✓ createWarningEmbed()
✓ hasManagePermission()
✓ handleError()
```

### features.js (15+ funções)
```
✓ initBackupDir()
✓ ensureDBStructure()
✓ addRating()
✓ createRatingEmbed()
✓ getAverageRating()
✓ createBackup()
✓ cleanOldBackups()
✓ restoreBackup()
✓ listBackups()
✓ updateCustomerLevel()
✓ createReminderEmbed()
✓ getMonthlyProgress()
✓ createProgressBar()
✓ createSuccessEmbed()
✓ createErrorEmbed()
✓ createInfoEmbed()
... (mais utilitários)
```

### index.js (modificado)
```
Handlers:
✓ client.once(Events.ClientReady)
✓ client.on(Events.InteractionCreate)
✓ client.on(Events.MessageCreate)

Systems:
✓ setupAutoBackup()
✓ setupLowStockMonitoring()
✓ setupReminderSystem()

Helpers (refatoradas):
✓ loadDB()
✓ saveDB()
✓ normalizeName()     (delegada para utils)
✓ ensureStockItem()
✓ getTicketsCategory()
✓ podeGerenciarTicket()
✓ getNextLevelThreshold()
✓ sendLog()
✓ buildStats()
```

---

## 🔐 Fluxo de Autenticação

```
.env (TOKEN)
    ↓
client.login(process.env.TOKEN)
    ↓
Discord API Authentication
    ↓
Bot Status: Online
    ↓
Aceita Comandos
```

---

## 📊 Fluxo de Validação de Comando

```
Comando Recebido
    ↓
┌───────────────────┐
│ Verificar se:     │
├───────────────────┤
│ 1. É um comando?  │──── NÃO ──→ IGNORAR
│ 2. Existe no code?│──── NÃO ──→ ERRO
│ 3. User pode usar?│──── NÃO ──→ SEM PERMISSÃO
│ 4. Args válidos?  │──── NÃO ──→ VALIDAR ENTRADA
└───────────────────┘
    ↓ SIM
 Executar
    ↓
┌──────────────┐
│ Sucesso?     │
└──┬────────┬──┘
   │ SIM    │ NÃO
   ↓        ↓
SUCCESS   ERROR
 EMBED    EMBED
   ↓        ↓
LOG       LOG
   ↓        ↓
SEND      SEND
 TO USER  TO USER
```

---

## 🚀 Escalabilidade Futura

```
Versão Atual (2.0)
├─ Single File DB (data.json)
├─ Monolítico (index.js)
└─ Pronto para refatoração

Versão 2.1
├─ Comandos em módulos
├─ Sistema de cache
└─ Rate limiting

Versão 3.0
├─ MongoDB/PostgreSQL
├─ Dashboard Web
├─ API REST
├─ Múltiplas Lojas
└─ Microserviços
```

---

**Arquitetura:** Modular  
**Escalabilidade:** ⭐⭐⭐⭐⭐  
**Manutenibilidade:** ⭐⭐⭐⭐⭐  
**Performance:** ⭐⭐⭐⭐☆
