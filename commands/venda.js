const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'venda' },
  async execute(interaction, ctx) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: 64 });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'registrar') {
      const cliente = interaction.options.getString('cliente', true);
      const produto = interaction.options.getString('produto', true);
      const valor = interaction.options.getNumber('valor', true);
      const custo = interaction.options.getNumber('custo', true);
      const pagamento = interaction.options.getString('pagamento', true);
      const quantidade = interaction.options.getInteger('quantidade') || 1;

      if (!ctx.utils.isValidPrice(valor)) return interaction.editReply('❌ Valor inválido. Deve estar entre 0 e 99999.99');
      if (!ctx.utils.isValidPrice(custo)) return interaction.editReply('❌ Custo inválido. Deve estar entre 0 e 99999.99');
      if (!ctx.utils.isValidQuantity(quantidade)) return interaction.editReply('❌ Quantidade inválida. Deve estar entre 1 e 999999');

      const key = ctx.normalizeName(produto);
      const item = ctx.db.stock[key];

      if (!item) return interaction.editReply(`❌ O produto **${produto}** não existe no estoque. Use /estoque adicionar primeiro.`);
      if (item.quantidade < quantidade) return interaction.editReply(`❌ Estoque insuficiente para vender **${quantidade}** unidade(s). Estoque atual: **${item.quantidade}**`);

      item.quantidade -= quantidade;
      item.vendido = Number(item.vendido || 0) + quantidade;

      const lucro = Number(valor) - Number(custo);

      const venda = { id: Date.now(), cliente, produto, valor, custo, lucro, pagamento, vendedor: interaction.user.username, quantidade, data: new Date().toISOString() };

      ctx.db.sales.unshift(venda);

      const clienteMatch = ctx.db.sales.filter(s => s.cliente === cliente);
      if (clienteMatch.length > 0) {
        const idMatch = cliente.match(/<@!?(\d+)>/);
        if (idMatch) {
          const clienteId = idMatch[1];
          ctx.Features.updateCustomerLevel(ctx.db, clienteId, cliente);
        }
      }

      ctx.Features.initMonthlyStats(ctx.db);
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
      if (ctx.db.monthly_stats[monthKey]) {
        ctx.db.monthly_stats[monthKey].sales += quantidade;
        ctx.db.monthly_stats[monthKey].revenue += valor;
      }

      ctx.saveDB();

      try { ctx.auditLog.logAction('venda_registrada', interaction.user.tag, { cliente, produto, valor, custo, quantidade, lucro }); } catch (e) {}

      void ctx.sendLog('💰 Nova venda registrada', `**Cliente:** ${cliente}\n**Produto:** ${produto}\n**Valor:** ${ctx.utils.formatPrice(valor)}\n**Lucro:** ${ctx.utils.formatPrice(lucro)}\n**Pagamento:** ${pagamento}`, '#22C55E');

      return interaction.editReply(`✅ Venda registrada com sucesso para **${cliente}**.\nProduto: **${produto}**\nValor: **${ctx.utils.formatPrice(valor)}**\nLucro: **${ctx.utils.formatPrice(lucro)}**`);
    }
  }
};
