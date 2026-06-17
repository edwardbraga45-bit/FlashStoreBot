const Features = require('../features');

module.exports = {
  data: { name: 'avaliar' },
  async execute(interaction, ctx) {
    const rating = interaction.options.getInteger('estrelas');
    const comment = interaction.options.getString('comentario');

    const ratingData = Features.addRating(interaction.user.id, interaction.user.username, rating, comment);
    ctx.db.ratings.push(ratingData);
    ctx.saveDB();

    const avaliacaoChannel = await ctx.client.channels.fetch(ctx.CANAL_AVALIACOES_ID).catch(() => null);
    if (avaliacaoChannel) {
      const embed = Features.createRatingEmbed(interaction.user.id, interaction.user.username, rating, comment);
      await avaliacaoChannel.send({ embeds: [embed] });
    }

    const successEmbed = Features.createSuccessEmbed('Avaliação Enviada', `Obrigado por avaliar a Flash Store!\n\n⭐ Sua nota: ${rating}/5`);
    return interaction.reply({ embeds: [successEmbed], ephemeral: true });
  }
};
