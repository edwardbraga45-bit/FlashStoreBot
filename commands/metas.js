const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'metas' },
  async execute(interaction, ctx) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'ver') {
      const monthlyProgress = ctx.Features.getMonthlyProgress(ctx.db);
      const progressBar = ctx.Features.createProgressBar(monthlyProgress.current, monthlyProgress.goal);
      const embed = new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle('🎯 META DO MÊS')
        .setDescription(`Meta: ${monthlyProgress.goal} vendas\n\nProgresso:\n${progressBar}\n\n${monthlyProgress.percentage}%\n\n${monthlyProgress.current}/${monthlyProgress.goal} vendas\n\n💰 Receita: R$ ${monthlyProgress.revenue.toFixed(2)}`)
        .setFooter({ text: 'Flash Store • Metas' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'definir') {
      if (!ctx.podeGerenciarTicket(interaction.member)) return interaction.reply({ content: '❌ Apenas administradores podem usar este comando.', ephemeral: true });
      const goal = interaction.options.getInteger('vendas');
      ctx.Features.initMonthlyStats(ctx.db);
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
      if (!ctx.db.monthly_stats[monthKey]) { ctx.db.monthly_stats[monthKey] = { month: now.getMonth(), year: now.getFullYear(), goal, sales: 0, revenue: 0, createdAt: new Date().toISOString() }; }
      else ctx.db.monthly_stats[monthKey].goal = goal;
      ctx.saveDB();
      return interaction.reply({ embeds: [ctx.Features.createSuccessEmbed('Meta Definida', `Nova meta: ${goal} vendas`)], ephemeral: true });
    }
  }
};
