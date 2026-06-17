const Features = require('../features');

module.exports = {
  data: { name: 'config-spam' },
  async execute(interaction, ctx) {
    if (!ctx.podeGerenciarTicket(interaction.member)) return interaction.reply({ content: '❌ Apenas administradores podem usar este comando.', ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (sub === 'reset') {
      const user = interaction.options.getUser('usuario');
      if (ctx.db.spam_warnings[user.id]) { delete ctx.db.spam_warnings[user.id]; ctx.saveDB(); }
      const successEmbed = Features.createSuccessEmbed('Avisos Resetados', `Os avisos de ${user} foram resetados.`);
      return interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }

    if (sub === 'limiar') {
      const quantidade = interaction.options.getInteger('quantidade');
      ctx.db.settings = ctx.db.settings || {};
      ctx.db.settings.spam_threshold = quantidade;
      ctx.saveDB();
      return interaction.reply({ embeds: [Features.createSuccessEmbed('Configuração Atualizada', `Limiar de spam: ${quantidade}`)], ephemeral: true });
    }
  }
};
