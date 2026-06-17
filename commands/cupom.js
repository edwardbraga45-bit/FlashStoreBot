const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'cupom' },
  async execute(interaction, ctx) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ flags: 64 });
    const sub = interaction.options.getSubcommand();

    if (sub === 'criar') {
      const nome = interaction.options.getString('nome', true).trim();
      const desconto = interaction.options.getInteger('desconto', true);
      const validade = interaction.options.getString('validade', true);
      const usos = interaction.options.getInteger('usos') || 1;

      if (!nome || nome.length < 2 || nome.length > 50) return interaction.editReply('❌ Nome do cupom inválido. Deve ter entre 2 e 50 caracteres.');
      if (desconto < 1 || desconto > 100) return interaction.editReply('❌ Desconto inválido. Deve estar entre 1% e 100%.');
      if (!ctx.utils.isValidQuantity(usos)) return interaction.editReply('❌ Número de usos inválido.');

      const cupom = { nome: nome.toUpperCase(), desconto, validade, usosMaximos: usos, usosRestantes: usos, ativo: true, criadoPor: interaction.user.id, criadoEm: new Date().toISOString() };
      const indexExistente = ctx.db.coupons.findIndex(c => c.nome === cupom.nome);
      if (indexExistente >= 0) ctx.db.coupons[indexExistente] = cupom; else ctx.db.coupons.unshift(cupom);
      ctx.saveDB();

      void ctx.sendLog('🎟️ Cupom criado', `**Cupom:** ${cupom.nome}\n**Desconto:** ${desconto}%\n**Validade:** ${validade}\n**Usos:** ${usos}`, '#A855F7');

      return interaction.editReply(`✅ Cupom **${cupom.nome}** criado com **${desconto}%** de desconto. Validade: **${validade}**.`);
    }

    if (sub === 'deletar') {
      const nome = interaction.options.getString('nome', true).toUpperCase();
      const index = ctx.db.coupons.findIndex(cupom => cupom.nome === nome);
      if (index === -1) return interaction.editReply(`❌ O cupom **${nome}** não existe.`);
      ctx.db.coupons.splice(index, 1);
      ctx.saveDB();

      void ctx.sendLog('🗑️ Cupom deletado', `**Cupom:** ${nome}\n**Removido por:** ${interaction.user.username}`, '#EF4444');

      return interaction.editReply(`✅ Cupom **${nome}** foi deletado com sucesso.`);
    }
  }
};
