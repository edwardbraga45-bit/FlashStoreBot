# 🐛 Troubleshooting & Performance - FlashStoreBot

## 🔧 Problemas Comuns e Soluções

### ❌ Bot não conecta
**Solução:**
- Verificar se o TOKEN no `.env` está correto
- Verificar se o bot tem permissões na guild
- Verificar firewall/rede

### ❌ Comandos não funcionam
**Solução:**
```bash
# Redeploy dos comandos
npm run deploy
```
- Verificar se `CLIENT_ID` e `GUILD_ID` estão corretos no `.env`

### ❌ Erro ao criar tickets
**Solução:**
- Verificar se `CATEGORIA_TICKETS_ID` existe e é uma categoria
- Verificar permissões do bot (criar canais, gerenciar permissões)
- Verificar se os IDs de roles estão corretos em `config.js`

### ❌ Backups não são criados
**Solução:**
- Verificar permissões da pasta `backups/` (deve ser gravável)
- Verificar espaço em disco disponível
- Verificar se `data.json` não está corrompido

### ❌ Memória crescendo indefinidamente
**Solução:**
- Limpar backups antigos manualmente:
```javascript
// No console do bot
db.backups.filter(b => new Date() - new Date(b.date) > 30 * 24 * 60 * 60 * 1000).forEach(b => fs.unlinkSync(b.path));
```

---

## ⚡ Otimizações de Performance

### 1. **Reduzir Frequência de Verificações**
Em `config.js`:
```javascript
TIMERS: {
    LOW_STOCK_CHECK: 15 * 60 * 1000,  // Aumentado para 15 min
    AUTO_BACKUP_INTERVAL: 12 * 60 * 60 * 1000, // 12 horas
}
```

### 2. **Implementar Cache**
```javascript
// Cachear produtos para evitar computar estoque a cada request
const CACHE_DURATION = 60 * 1000; // 1 minuto
let stockCache = {};
let cacheTime = 0;

function getStockCached() {
    if (Date.now() - cacheTime < CACHE_DURATION) {
        return stockCache;
    }
    stockCache = computeStock();
    cacheTime = Date.now();
    return stockCache;
}
```

### 3. **Usar Índices no Banco de Dados**
Se migrar para MongoDB:
```javascript
db.sales.createIndex({ clienteId: 1, data: 1 });
db.stock.createIndex({ nome: 1 });
db.tickets.createIndex({ status: 1 });
```

### 4. **Compressão de Dados**
```javascript
// Comprimir backups antigos
const zlib = require('zlib');
fs.createReadStream('backup.json')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('backup.json.gz'));
```

### 5. **Limitar Tamanho de Arrays**
```javascript
// Manter apenas últimas 10.000 vendas em memória
function limitSalesHistory() {
    if (db.sales.length > 10000) {
        db.sales = db.sales.slice(0, 10000);
        saveDB();
    }
}
```

---

## 📊 Monitoramento

### Verificar Saúde do Bot
```javascript
// Adicionar comando /health
if (interaction.commandName === 'health') {
    const uptime = Math.floor(client.uptime / 1000);
    const memory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    
    const healthEmbed = utils.createInfoEmbed(
        'Bot Health',
        `**Uptime:** ${Math.floor(uptime / 3600)}h\n**Memória:** ${memory}MB\n**Ping:** ${client.ws.ping}ms`
    );
    
    return interaction.reply({ embeds: [healthEmbed], ephemeral: true });
}
```

### Log de Eventos Críticos
```javascript
// Log automático a cada hora
setInterval(async () => {
    const stats = {
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage().heapUsed / 1024 / 1024,
        uptime: Math.floor(client.uptime / 1000),
        guildCount: client.guilds.cache.size,
        userCount: client.users.cache.size
    };
    
    console.log('📊 Stats:', stats);
}, 60 * 60 * 1000);
```

---

## 🔐 Segurança

### 1. **Rate Limiting**
```javascript
const rateLimit = new Map();

function checkRateLimit(userId, limit = 5, window = 60000) {
    const key = userId;
    const now = Date.now();
    
    if (!rateLimit.has(key)) {
        rateLimit.set(key, []);
    }
    
    const userLimits = rateLimit.get(key).filter(t => now - t < window);
    
    if (userLimits.length >= limit) {
        return false; // Rate limited
    }
    
    userLimits.push(now);
    rateLimit.set(key, userLimits);
    return true;
}
```

### 2. **Validação de Input**
```javascript
const DANGEROUS_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /onclick/i,
    /onerror/i
];

function isSafeinput(input) {
    return !DANGEROUS_PATTERNS.some(p => p.test(input));
}
```

### 3. **Encriptação de Dados Sensíveis**
```javascript
const crypto = require('crypto');

function encryptPIXKey(key) {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    return cipher.update(key, 'utf8', 'hex') + cipher.final('hex');
}
```

---

## 📈 Escalabilidade

### Quando Migrar para Banco de Dados
- Base de dados cresceu além de 100MB
- Mais de 50 requisições por segundo
- Necessidade de replicação/backup automático
- Múltiplos bots compartilhando dados

### Recomendações
- **MongoDB** - Melhor para JSON
- **PostgreSQL** - Melhor para estrutura complexa
- **Redis** - Cache de alta performance
- **DynamoDB** - Serverless escalável

---

## 🚀 Roadmap de Melhorias

- [ ] Migrar para MongoDB
- [ ] Adicionar rate limiting
- [ ] Dashboard web
- [ ] Suporte a múltiplas lojas
- [ ] API REST
- [ ] Sistema de affiliates
- [ ] WhatsApp integration
- [ ] Múltiplas moedas
- [ ] Pagamento automático (Stripe/PayPal)
- [ ] Analytics avançado

---

**Último Update:** 2026-06-16  
**Versão:** 2.0
