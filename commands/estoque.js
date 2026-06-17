const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'estoque' },
  async execute(interaction, ctx) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: 64 });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'adicionar') {
      const produto = interaction.options.getString('produto', true);
      const quantidade = interaction.options.getInteger('quantidade', true);

      const item = ctx.ensureStockItem(produto);
      item.nome = produto;
      item.quantidade += quantidade;

      ctx.saveDB();

      try { ctx.auditLog.logAction('estoque_adicionar', interaction.user.tag, { produto, quantidade, total: item.quantidade }); } catch (e) {}

      void ctx.sendRestockNotification(`✅ Estoque reabastecido para **${produto}**: **${item.quantidade}** unidades.`);

      return interaction.editReply(`✅ Adicionado **${quantidade}** ao estoque de **${produto}**. Agora tem **${item.quantidade}**.`);
    }

    if (sub === 'remover') {
      const produto = interaction.options.getString('produto', true);
      const quantidade = interaction.options.getInteger('quantidade', true);
      const key = ctx.normalizeName(produto);

      if (!ctx.db.stock[key]) {
        return interaction.editReply(`❌ O produto **${produto}** não existe no estoque.`);
      }

      if (ctx.db.stock[key].quantidade < quantidade) {
        return interaction.editReply(`❌ Estoque insuficiente. Atual: **${ctx.db.stock[key].quantidade}**`);
      }

      ctx.db.stock[key].quantidade -= quantidade;
      ctx.saveDB();

      try { ctx.auditLog.logAction('estoque_remover', interaction.user.tag, { produto, quantidade, total: ctx.db.stock[key].quantidade }); } catch (e) {}

      void ctx.sendLog('📦 Estoque ajustado', `**Produto:** ${produto}\n**Ação:** -${quantidade}\n**Novo total:** ${ctx.db.stock[key].quantidade}`, '#F59E0B');

      return interaction.editReply(`✅ Removido **${quantidade}** do estoque de **${produto}**. Agora tem **${ctx.db.stock[key].quantidade}**.`);
    }

    if (sub === 'ver') {
      const produto = interaction.options.getString('produto', false);

      if (produto) {
        const key = ctx.normalizeName(produto);
        const item = ctx.db.stock[key];

        if (!item) {
          return interaction.editReply(`❌ O produto **${produto}** não foi encontrado no estoque.`);
        }

        const embed = new EmbedBuilder()
          .setColor('#8A2BE2')
          .setTitle(`📦 Estoque de ${item.nome}`)
          .addFields(
            { name: 'Quantidade', value: String(item.quantidade), inline: true },
            { name: 'Vendidos', value: String(item.vendido || 0), inline: true }
          );

        return interaction.editReply({ embeds: [embed] });
      }

      const lista = Object.values(ctx.db.stock)
        .map(item => `• **${item.nome}** — Qtd: **${item.quantidade}** | Vendidos: **${item.vendido || 0}**`)
        .join('\n') || 'Nenhum produto cadastrado no estoque.';

      const embed = new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle('📦 Estoque da Flash Store')
        .setDescription(lista);

      return interaction.editReply({ embeds: [embed] });
    }
  }
};
