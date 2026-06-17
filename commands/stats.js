const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'stats' },
  async execute(interaction, ctx) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }

    const cacheKey = 'stats_overview';
    let embed = ctx.cache.get(cacheKey);

    if (!embed) {
      const stats = ctx.buildStats();

      embed = new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle('📊 Stats da Flash Store')
        .setDescription('Resumo geral da operação da loja.')
        .addFields(
          { name: 'Vendas', value: String(stats.vendas), inline: true },
          { name: 'Receita', value: `R$ ${stats.receita.toFixed(2)}`, inline: true },
          { name: 'Lucro', value: `R$ ${stats.lucro.toFixed(2)}`, inline: true },
          { name: 'Produtos', value: String(stats.produtos), inline: true },
          { name: 'Estoque total', value: String(stats.estoqueTotal), inline: true },
          { name: 'Cupons ativos', value: String(stats.couponsAtivos), inline: true },
          { name: 'Tickets', value: String(stats.tickets), inline: true },
          { name: 'Estoque baixo', value: String(stats.estoqueBaixo), inline: true },
          { name: 'Top produto', value: stats.topProduto, inline: true }
        )
        .setFooter({ text: 'Flash Store • Monitoramento' });

      ctx.cache.set(cacheKey, embed, 5000);
    }

    return interaction.editReply({ embeds: [embed] });
  }
};
