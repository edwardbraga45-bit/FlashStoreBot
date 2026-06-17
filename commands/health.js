const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'health' },
  async execute(interaction, ctx) {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    const dbStatus = (ctx.db && Object.keys(ctx.db).length > 0) ? 'loaded' : 'empty';

    const embed = new EmbedBuilder()
      .setColor('#22C55E')
      .setTitle('🩺 Health — Flash Store Bot')
      .addFields(
        { name: 'Uptime', value: `${Math.floor(uptime)}s`, inline: true },
        { name: 'Memory (RSS)', value: `${Math.round(memory.rss / 1024 / 1024)} MB`, inline: true },
        { name: 'DB', value: dbStatus, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
