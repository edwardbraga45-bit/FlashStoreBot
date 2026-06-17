const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'niveis' },
  async execute(interaction, ctx) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'meu-nivel') {
      const userPurchases = ctx.db.sales.filter(s => s.clienteId === interaction.user.id).length;
      const levelInfo = ctx.Features.updateCustomerLevel(ctx.db, interaction.user.id, interaction.user.username);
      const embed = new EmbedBuilder()
        .setColor(levelInfo.color)
        .setTitle(`${levelInfo.emoji} Seu Nível: ${levelInfo.level}`)
        .setDescription(`\n👤 **Usuário:** ${interaction.user}\n\n🛒 **Compras:** ${userPurchases}\n\n💎 **Nível Atual:** ${levelInfo.level}\n\n**Próximo nível em:**\n${levelInfo.level === 'Lendário' ? '🏆 Você atingiu o máximo!' : `${ctx.getNextLevelThreshold ? ctx.getNextLevelThreshold(userPurchases) - userPurchases : 'N/A'} compras`}`)
        .setFooter({ text: 'Flash Store • Sistema de Níveis' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'ranking') {
      const ranking = Object.values(ctx.db.customer_levels).sort((a,b)=>b.purchases - a.purchases).slice(0,10);
      const rankingText = ranking.length > 0 ? ranking.map((entry,i)=> `${i+1}. <@${entry.userId}> - ${entry.level} (${entry.purchases} compras)`).join('\n') : 'Nenhum cliente registrado ainda';
      const embed = new EmbedBuilder().setColor('#FFD700').setTitle('🏆 RANKING DE CLIENTES').setDescription(rankingText).setFooter({ text: 'Flash Store • Top 10' }).setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
