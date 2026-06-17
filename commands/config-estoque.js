const Features = require('../features');

module.exports = {
  data: { name: 'config-estoque' },
  async execute(interaction, ctx) {
    if (!ctx.podeGerenciarTicket(interaction.member)) return interaction.reply({ content: '❌ Apenas administradores podem usar este comando.', ephemeral: true });
    const sub = interaction.options.getSubcommand();
    if (sub === 'limiar') {
      const quantidade = interaction.options.getInteger('quantidade');
      if (quantidade <= 0) return interaction.reply({ content: '❌ O limite deve ser maior que 0.', ephemeral: true });
      ctx.db.settings = ctx.db.settings || {};
      ctx.db.settings.low_stock_threshold = quantidade;
      ctx.saveDB();
      const successEmbed = Features.createSuccessEmbed('Limite de Estoque Atualizado', `O novo limite de estoque baixo foi definido para **${quantidade}** unidades.`);
      return interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
  }
};
