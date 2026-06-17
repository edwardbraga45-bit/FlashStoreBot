# ⚡ Quick Start - Flash Store Dashboard

## 🚀 Começar em 3 passos

### 1️⃣ Instalar as dependências
```bash
cd dashboard
npm install
```

### 2️⃣ Iniciar o servidor
```bash
npm start
```

### 3️⃣ Abrir no navegador
```
http://localhost:3000
```

✅ **Pronto!** Seu dashboard futurístico está rodando!

---

## 📋 Verificação

Depois de iniciar, você deve ver:
```
🚀 Dashboard Backend rodando em http://localhost:3000
```

No navegador você verá:
- ⚡ Logo Flash Store pulsando
- 4 Cards com estatísticas
- 2 Gráficos interativos
- Sidebar com 6 páginas
- Status do bot "Conectando..."

---

## 🎨 O que você consegue fazer

| Página | O que faz |
|--------|-----------|
| 📊 Dashboard | Visão geral com stats e gráficos |
| 💰 Vendas | Histórico das últimas 50 vendas |
| 📦 Estoque | Todos os produtos com status |
| 🎫 Tickets | Últimos 30 tickets de suporte |
| 🎟️ Cupons | Cupons ativos/inativos com usos |
| 👥 Clientes | Top 20 clientes por gasto |

---

## 🛠️ Troubleshooting

### Erro: "Porta 3000 já está em uso"
```bash
npm start PORT=3001
```

### Erro: "Cannot find module"
```bash
npm install
```

### Dashboard vazio (sem dados)
- Confirme que `../data.json` existe
- Certifique-se que o bot gerou dados
- Verifique arquivo JSON está válido

### WebSocket não conecta
- Verifique firewall
- Tente uma porta diferente
- Recarregue a página

---

## 📚 Mais Informações

- 📖 [Documentação Completa](README.md)
- 🎨 [Design Overview](DESIGN_OVERVIEW.md)
- ⚙️ [Configuração Avançada](README.md#-configuração)

---

## 🎯 Próximos passos

1. **Customizar cores** → Edite `public/style.css` (variáveis CSS)
2. **Adicionar páginas** → Copie estrutura existente no HTML
3. **Deploy** → Siga guia de deploy no README.md

---

**Aproveite seu dashboard futurístico! 🚀✨**
