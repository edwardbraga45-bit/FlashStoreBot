const Features = require('../features');

module.exports = {
  data: { name: 'backup' },
  async execute(interaction, ctx) {
    if (!ctx.podeGerenciarTicket(interaction.member)) return interaction.reply({ content: '❌ Apenas administradores podem usar este comando.', ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (sub === 'criar') {
      await interaction.deferReply({ flags: 64 });
      const filename = Features.createBackup(ctx.db);
      const successEmbed = Features.createSuccessEmbed('Backup Criado', `Arquivo: \`${filename}\``);
      return interaction.editReply({ embeds: [successEmbed] });
    }

    if (sub === 'listar') {
      const backups = Features.listBackups();
      const backupList = backups.length > 0 ? backups.slice(0,10).map((b,i) => `${i+1}. \`${b}\``).join('\n') : 'Nenhum backup disponível';
      const embed = Features.createInfoEmbed('Backups Disponíveis', `${backupList}\n\n*Mostrando os 10 mais recentes*`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'restaurar') {
      const filename = interaction.options.getString('arquivo');
      const restoredData = Features.restoreBackup(filename);
      if (!restoredData) return interaction.reply({ embeds: [Features.createErrorEmbed('Erro ao Restaurar', `Backup \`${filename}\` não encontrado.`)], ephemeral: true });
      Object.assign(ctx.db, restoredData);
      ctx.saveDB();
      const successEmbed = Features.createSuccessEmbed('Backup Restaurado', `Dados restaurados de \`${filename}\``);
      return interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
  }
};
