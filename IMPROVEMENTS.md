# 🎫 FlashStoreBot — Documentação de Melhorias

## 📋 Visão Geral
O FlashStoreBot é um bot Discord para gerenciar uma loja de produtos digitais (Nitro, Impulsos, etc.) com sistema de tickets, vendas, estoque e avaliações.

## 🚀 Melhorias Implementadas

### 1. **Separação de Configurações** (`config.js`)
- Todos os IDs de roles, canais e configurações estão centralizados
- Fácil manutenção sem editar o código principal
- Valores de timeouts e limites configuráveis

### 2. **Utilitários Reutilizáveis** (`utils.js`)
Funções consolidadas para evitar duplicação:
- `normalizeName()` - Padroniza nomes
- `isValidPrice()` - Valida preços
- `isValidQuantity()` - Valida quantidades
- `createTicketChannel()` - Cria canais com permissões corretas
- `formatPrice()` - Formata valores monetários
- `createProgressBar()` - Cria barras visuais
- `createSuccessEmbed()` / `createErrorEmbed()` - Embeds padrão
- `hasManagePermission()` - Verifica permissões
- `handleError()` - Tratamento centralizado de erros

### 3. **Eliminação de Código Duplicado**
- ✅ Criação de canais de ticket centralizada
- ✅ Permissões padronizadas
- ✅ Embeds com estilo consistente
- ✅ Validações em um só lugar

### 4. **Tratamento de Erros Melhorado**
- Erros agora informam o usuário com embeds amigáveis
- Logging centralizado com contexto
- Suporte a debug mode via variável de ambiente

### 5. **Validações Robustas**
- Preços validados (0-99999.99)
- Quantidades validadas (1-999999)
- Cupons validados (nome 2-50 chars, desconto 1-100%)
- Inputs de usuário sempre sanitizados

### 6. **Configurações Dinâmicas**
Todos os valores críticos estão em `config.js`:
```javascript
LIMITS: {
    MAX_BACKUPS: 30,
    LOW_STOCK_THRESHOLD: 5,
    ALERT_COOLDOWN: 24 * 60 * 60 * 1000
}
TIMERS: {
    LOW_STOCK_CHECK: 5 * 60 * 1000,      // 5 minutos
    AUTO_BACKUP_INTERVAL: 6 * 60 * 60 * 1000, // 6 horas
}
```

## 📁 Estrutura de Arquivos

```
FlashStoreBot/
├── index.js                 # Arquivo principal (refatorado)
├── config.js                # 🆕 Configurações centralizadas
├── utils.js                 # 🆕 Funções utilitárias
├── features.js              # Features adicionais
├── deploy-commands.js       # Deploy dos comandos
├── data.json                # Banco de dados
├── backups/                 # Backups automáticos
├── package.json             # Dependências
└── .env                      # Variáveis de ambiente
```

## 🛠️ Como Usar

### Alterar Configuração
Edite `config.js` para mudar IDs, timeouts ou limites:
```javascript
module.exports = {
    ROLES: {
        SUPPORT: 'NOVO_ID_AQUI'
    },
    LIMITS: {
        LOW_STOCK_THRESHOLD: 10  // Alterado de 5
    }
};
```

### Usar Utilitários
```javascript
const utils = require('./utils');

// Validar preço
if (!utils.isValidPrice(100)) return error;

// Criar canal com permissões
const channel = await utils.createTicketChannel(guild, 'nome', userId);

// Formatar preço
console.log(utils.formatPrice(19.99)); // R$ 19,99
```

### Tratamento de Erros
```javascript
try {
    // código
} catch (error) {
    utils.handleError(error, 'contexto do erro');
}
```

## 📊 Benefícios das Melhorias

| Antes | Depois |
|-------|--------|
| ❌ IDs hardcoded espalhados | ✅ Config.js centralizado |
| ❌ Código duplicado 3x+ | ✅ Funções reutilizáveis |
| ❌ Erros sem feedback | ✅ Embeds informativos |
| ❌ Sem validações | ✅ Validações robustas |
| ❌ Timeouts hardcoded | ✅ Config.js dinâmico |
| ❌ Logging inconsistente | ✅ handleError centralizado |

## 🔍 Próximas Melhorias Sugeridas

1. **Separar comandos em módulos** - Dividir `index.js` por tipo de comando
2. **Banco de dados aprimorado** - Usar MongoDB ao invés de JSON
3. **Cache inteligente** - Reduzir leituras de disco
4. **Testes unitários** - Adicionar cobertura de testes
5. **Rate limiting** - Proteger contra abuso
6. **Audit log** - Rastrear todas as ações admin
7. **Dashboard web** - Interface para gerenciar loja
8. **Múltiplos idiomas** - Suporte a internacionalização

## 📝 Notas Importantes

- ⚠️ Sempre fazer backup antes de alterações críticas
- 🔐 Nunca commitar `.env` com tokens reais
- 📊 Monitore regularmente o tamanho do `data.json`
- 🚨 Mantenha o `config.js` sincronizado com o servidor Discord

---

**Versão:** 2.0 (Refatorada)  
**Data:** 2026-06-16
