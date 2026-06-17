const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'painel-dash' },
  async execute(interaction, ctx) {
    const totalClientes = new Set(ctx.db.sales.map(s => s.clienteId)).size;
    const totalVendas = ctx.db.sales.length;
    const totalRecuperado = ctx.db.sales.reduce((acc, s) => acc + (s.valor || 0), 0);
    const avgRating = ctx.Features.getAverageRating(ctx.db.ratings);
    const monthlyProgress = ctx.Features.getMonthlyProgress(ctx.db);
    const progressBar = ctx.Features.createProgressBar(monthlyProgress.current, monthlyProgress.goal);

    const embed = new EmbedBuilder()
      .setColor('#8A2BE2')
      .setTitle('⚡ FLASH STORE — PAINEL PRINCIPAL')
      .setDescription(`\n🟢 **Bot Status:** Online\n\n👥 **Clientes Atendidos:** ${totalClientes}\n\n🛒 **Vendas Realizadas:** ${totalVendas}\n\n💰 **Receita Total:** R$ ${totalRecuperado.toFixed(2)}\n\n⭐ **Avaliação Média:** ${avgRating}/5\n\n🎯 **Meta do Mês:** ${progressBar} ${monthlyProgress.percentage}%\n(${monthlyProgress.current}/${monthlyProgress.goal} vendas)\n\n⚠️ **Limite de Estoque Baixo:** ${ctx.db.settings?.low_stock_threshold || ctx.config?.LIMITS?.LOW_STOCK_THRESHOLD || 3} unidades\n\n📊 **Receita Mensal:** R$ ${monthlyProgress.revenue.toFixed(2)}\n`)
      .setFooter({ text: 'Flash Store • Dashboard' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
