# 🚀 Novas Funcionalidades Flash Store Bot

Todas as novas features foram adicionadas com sucesso mantendo compatibilidade total com o bot existente.

---

## 📋 Índice de Features

1. ⭐ Sistema de Avaliações
2. ⚠️ Sistema de Aviso de Estoque Baixo
3. 💾 Sistema de Backup Automático
4. 🛡️ Sistema Anti-Spam
5. ⏰ Sistema de Lembretes Automáticos
6. ⏱️ Contador de Tempo de Atendimento
7. 🎫 Sistema de Assumir Tickets
8. 🎨 Embeds Personalizadas
9. 🏠 Painel Principal
10. 🏆 Sistema de Níveis de Clientes
11. 🎯 Sistema de Metas Mensais

---

## ⭐ Sistema de Avaliações

### Comando: `/avaliar`

Permite que clientes deixem avaliações e comentários sobre a loja.

**Opções:**
- `estrelas` (obrigatório): Nota de 1 a 5 estrelas
- `comentario` (opcional): Comentário sobre a experiência

**Exemplo:**
```
/avaliar estrelas: 5 comentario: Ótimo atendimento!
```

**O que acontece:**
- Avaliação é salva no banco de dados
- Mensagem é enviada para o canal de logs
- Usuário recebe confirmação

**Dados salvos:**
- Usuário ID
- Nome de usuário
- Nota (1-5)
- Comentário
- Data e hora

---

## ⚠️ Sistema de Aviso de Estoque Baixo

**Funcionamento automático** - não requer comando

**Como funciona:**
- Monitora todos os produtos a cada 5 minutos
- Quando estoque cair abaixo de 5 unidades, envia alerta
- Alerta é enviado apenas uma vez a cada 24 horas por produto

**Canal:** O mesmo configurado para confirmações de estoque

**Exemplo de alerta:**
```
⚠️ ALERTA DE ESTOQUE

📦 Produto: Nitro Mensal

📉 Quantidade restante: 3

⚠️ Recomendamos reabastecer o estoque.
```

---

## 💾 Sistema de Backup Automático

### Comando: `/backup`

Gerencia backups do banco de dados da loja.

**Subcomandos:**

#### 1. Criar Backup
```
/backup criar
```
- Cria um backup imediato
- Arquivo salvo em `backups/` com timestamp
- Apenas para administradores

#### 2. Listar Backups
```
/backup listar
```
- Lista os 10 backups mais recentes
- Mostra nomes dos arquivos

#### 3. Restaurar Backup
```
/backup restaurar arquivo: backup_2026_06_16_12-30-45.json
```
- Restaura dados de um backup anterior
- Apenas para administradores

**Automação:**
- Backup automático **a cada 6 horas**
- Backup automático **à meia-noite** todos os dias
- Mantém apenas os últimos 30 backups (limpa automaticamente)

**Dados incluídos nos backups:**
- Estoque completo
- Histórico de vendas
- Cupons ativos
- Tickets abertos
- Avaliações dos clientes

---

## 🛡️ Sistema Anti-Spam

### Comando: `/config-spam`

Configura o sistema anti-spam (apenas para administradores)

**Subcomandos:**

#### 1. Reset de Avisos
```
/config-spam reset usuario: @usuario
```
- Remove todos os avisos de spam de um usuário
- Reseta o contador de infrações

**Como funciona:**
O sistema monitora automaticamente e aplica punições progressivas:

- **1º aviso:** Simples aviso
- **2º aviso:** Timeout temporário
- **3º aviso:** Bloqueio temporário do usuário

**O que é monitorado:**
- Múltiplas mensagens em poucos segundos
- Múltiplas menções em curto período
- Múltiplas tentativas de abrir tickets
- Múltiplos comandos executados rapidamente

---

## ⏰ Sistema de Lembretes Automáticos

**Funcionamento automático** - não requer comando

**Como funciona:**
- Verifica lembretes a cada hora
- Envia DM (mensagem privada) para clientes
- Lembretes são configurados automaticamente ao fazer compra

**Tipos de lembretes:**
- 1 dia antes da expiração
- 3 dias antes da expiração
- 7 dias antes da expiração

**Exemplo de lembrete:**
```
⏰ Lembrete de Expiração

📦 Produto: Nitro Mensal

⏰ Seu Nitro Mensal expira em 3 dia(s).

Renovar agora para não perder acesso!
```

---

## ⏱️ Contador de Tempo de Atendimento

**Funcionamento automático** - integrado aos tickets

**Informações coletadas:**
- Tempo que cada ticket ficou aberto
- Hora de abertura
- Tempo total do atendimento
- Tempo médio de atendimento da equipe
- Tempo médio por atendente

**Exibição no ticket:**
```
⏱️ Tempo aberto: 12 minutos
```

---

## 🎫 Sistema de Assumir Tickets

**Botões adicionados automaticamente nos tickets:**

- 👨‍💼 **Assumir Ticket** - Equipe de suporte assume o atendimento
- 🔄 **Transferir Ticket** - Passa para outro atendente
- 🚪 **Sair do Ticket** - Equipe sai do atendimento
- 🔒 **Fechar Ticket** - Encerra o ticket

**Exibição no ticket:**
```
🎫 Ticket #0001

👤 Cliente: @usuario

👨‍💼 Atendente: @suporte

⏱️ Tempo aberto: 12 minutos

Status: Em atendimento
```

**Permissões:**
- Apenas usuários com cargo de suporte/autorizado podem assumir

---

## 🎨 Embeds Personalizadas

**Padronização de mensagens:**

Todas as mensagens da loja agora usam embeds padronizadas:

- 🎨 Cor roxa padrão (#8A2BE2)
- ⚡ Prefixo "FLASH STORE" em títulos
- 📍 Rodapé com informações
- ⏰ Data e hora em todas as mensagens
- 🎯 Layout profissional consistente

**Tipos de embeds:**
- ✅ Embed de sucesso (verde)
- ❌ Embed de erro (vermelho)
- ℹ️ Embed de informação (azul)
- ⭐ Embed de avaliação (dourado)

---

## 🏠 Painel Principal

### Comando: `/painel-dash`

Exibe o painel principal com estatísticas da loja.

**Informações exibidas:**
```
⚡ FLASH STORE — PAINEL PRINCIPAL

🟢 Bot Status: Online

👥 Clientes Atendidos: 150

🛒 Vendas Realizadas: 234

💰 Receita Total: R$ 1.250,50

⭐ Avaliação Média: 4.8/5

🎯 Meta do Mês: ████████░░ 80%
(80/100 vendas)

📊 Receita Mensal: R$ 1.250,50
```

**Atualização:**
- Informações em tempo real
- Reflexa instantaneamente cada venda/avaliação

---

## 🏆 Sistema de Níveis de Clientes

### Comando: `/niveis`

Gerencia os níveis dos clientes da loja.

**Subcomandos:**

#### 1. Meu Nível
```
/niveis meu-nivel
```
- Mostra o nível atual do cliente
- Quantidade de compras
- Próximo nível

#### 2. Ranking
```
/niveis ranking
```
- Mostra top 10 clientes
- Ordem por número de compras

**Sistema de Níveis:**

| Nível | Emoji | Requisito | Cor |
|-------|-------|-----------|-----|
| Novato | 📍 | 0 compras | Cinza |
| Bronze | 🥉 | 1+ compra | Cobre |
| Prata | 🥈 | 5+ compras | Prata |
| Ouro | 🥇 | 10+ compras | Ouro |
| Diamante | 💎 | 25+ compras | Ciano |
| Lendário | 👑 | 50+ compras | Rosa |

**Benefícios (configuráveis):**
- Cargos automáticos com cada nível
- Prioridade no suporte
- Benefícios especiais

**Atualização automática:**
- Nível é atualizado automaticamente com cada venda
- Sistema verifica quantidade de compras

---

## 🎯 Sistema de Metas Mensais

### Comando: `/metas`

Gerencia as metas de vendas mensais da loja.

**Subcomandos:**

#### 1. Ver Meta
```
/metas ver
```
- Mostra o progresso da meta do mês
- Barra de progresso visual
- Percentual alcançado
- Receita mensal

**Exibição:**
```
🎯 META DO MÊS

Meta: 100 vendas

Progresso:
████████░░

80%

80/100 vendas

💰 Receita: R$ 1.250,50
```

#### 2. Definir Meta
```
/metas definir vendas: 150
```
- Define nova meta para o mês (apenas admin)
- Reseta o contador mensal
- Próxima meta é definida no próximo mês automaticamente

**Atualização automática:**
- Contador aumenta com cada venda registrada
- Receita é atualizada em tempo real
- Percentual é recalculado automaticamente

---

## 📁 Estrutura de Arquivos

```
FlashStoreBot/
├── index.js                 # Bot principal (atualizado)
├── deploy-commands.js       # Registrador de comandos (atualizado)
├── features.js             # ✨ Novo - Módulo com todas as features
├── data.json              # Banco de dados (com novos campos)
├── package.json
└── backups/               # ✨ Novo - Pasta de backups automáticos
    └── backup_*.json      # Arquivos de backup
```

---

## 🗄️ Banco de Dados - Novos Campos

**data.json agora inclui:**

```json
{
  "stock": { ... },           // Existente
  "sales": [...],             // Existente
  "coupons": [...],           // Existente
  "tickets": [...],           // Existente
  "ratings": [...],           // ✨ Novo - Avaliações
  "spam_warnings": {...},     // ✨ Novo - Avisos de spam
  "reminders": [...],         // ✨ Novo - Lembretes
  "ticket_stats": {...},      // ✨ Novo - Estatísticas de tickets
  "customer_levels": {...},   // ✨ Novo - Níveis dos clientes
  "monthly_stats": {...}      // ✨ Novo - Metas mensais
}
```

---

## 🔧 Configuração

### Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contém:

```
TOKEN=seu_token_aqui
```

### IDs de Canais Necessários

Os seguintes IDs já devem estar configurados em `index.js`:

- `LOG_CHANNEL_ID` - Canal de logs/avisos
- `STOCK_CONFIRM_CHANNEL_ID` - Canal de confirmação de estoque
- `SUPORTE_ROLE_ID` - Cargo de suporte
- Demais IDs de canais existentes

---

## ⚡ Como Usar as Features

### Para Clientes:
1. Use `/avaliar` para deixar uma nota
2. Use `/niveis meu-nivel` para ver seu nível
3. Use `/niveis ranking` para ver o ranking
4. Use `/metas ver` para ver o progresso da loja
5. Use `/painel-dash` para ver estatísticas gerais

### Para Administradores:
1. Use `/backup criar` para fazer backup manual
2. Use `/backup listar` para ver backups disponíveis
3. Use `/backup restaurar` para restaurar um backup
4. Use `/metas definir` para definir metas
5. Use `/config-spam reset` para resetar avisos

### Automático (sem comandos necessários):
- Aviso de estoque baixo
- Lembretes de expiração
- Backups automáticos a cada 6 horas
- Sistema anti-spam
- Atualização de níveis com vendas
- Atualização de metas

---

## 📊 Exemplos de Uso

### Cenário 1: Cliente faz uma compra

```
1. Cliente clica em comprar
2. Ticket de compra é criado
3. Contador de tempo inicia
4. Após pagamento, venda é registrada
5. Nível do cliente é atualizado automaticamente
6. Meta mensal é incrementada
7. Lembrete é criado para 3 dias antes da expiração
```

### Cenário 2: Backup automático

```
1. 06:00 - Backup automático
2. 12:00 - Backup automático
3. 18:00 - Backup automático
4. 00:00 - Backup automático da meia-noite
5. Backups antigos (>30) são deletados automaticamente
```

### Cenário 3: Alerta de estoque baixo

```
1. Admin adiciona apenas 3 nitro mensais
2. Sistema detecta quantidade < 5
3. Alerta é enviado para o canal
4. Próximo alerta só em 24h
5. Admin reabastece
6. Alerta para quando quantidade > 5
```

---

## 🐛 Logs de Erros

Todos os erros são registrados em `logs/error_YYYY-MM-DD.log`

**Localização:**
```
FlashStoreBot/
└── logs/
    ├── error_2026-06-16.log
    ├── error_2026-06-17.log
    └── ...
```

---

## ✅ Checklist de Features

- [x] ⭐ Sistema de Avaliações
- [x] ⚠️ Sistema de Aviso de Estoque
- [x] 💾 Sistema de Backup Automático
- [x] 🛡️ Sistema Anti-Spam
- [x] ⏰ Sistema de Lembretes
- [x] ⏱️ Contador de Tickets
- [x] 🎫 Sistema de Assumir Tickets
- [x] 🎨 Embeds Personalizadas
- [x] 🏠 Painel Principal
- [x] 🏆 Sistema de Níveis
- [x] 🎯 Sistema de Metas

---

## 📝 Notas Importantes

1. **Compatibilidade:** Todas as features são aditivas - nenhuma funcionalidade existente foi removida
2. **Banco de dados:** Novos campos são criados automaticamente se não existirem
3. **Backup:** Sempre mantenha backups regulares
4. **Permissions:** Apenas usuários autorizados podem usar comandos administrativos
5. **Monitoramento:** Sistema roda em background sem interferir no bot

---

## 🚀 Próximos Passos

1. Execute `node deploy-commands.js` para registrar novos comandos
2. Reinicie o bot com `node index.js`
3. Teste os novos comandos no Discord
4. Configure cargos para o sistema de níveis (opcional)

---

**Bot atualizado em:** 16 de Junho de 2026
**Versão:** 2.0.0
**Status:** ✅ Pronto para uso
