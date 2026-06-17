const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'impulsos' },
  async execute(interaction, ctx) {
    const produtosImpulso = [ctx.PRODUTOS.impulso_2x1, ctx.PRODUTOS.impulso_8x1, ctx.PRODUTOS.impulso_14x1];

    const produtosDisponiveis = produtosImpulso.map(produto => `• **${produto.nome}** — R$ ${produto.preco.toFixed(2)} — Estoque: **${produto.estoque()}**`).join('\n');

    const menuImpulso = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('selecionar_produto')
        .setPlaceholder('🛒 Escolha o pacote de Impulsos')
        .addOptions([
          { label: 'Impulso 2x 1MPULSO', description: `R$ 2,50 | Estoque: ${ctx.PRODUTOS.impulso_2x1.estoque()}`, value: 'impulso_2x1' },
          { label: 'Impulso 8x 1MPULSO', description: `R$ 10,50 | Estoque: ${ctx.PRODUTOS.impulso_8x1.estoque()}`, value: 'impulso_8x1' },
          { label: 'Impulso 14x 1MPULSO', description: `R$ 16,00 | Estoque: ${ctx.PRODUTOS.impulso_14x1.estoque()}`, value: 'impulso_14x1' }
        ])
    );

    const embedImpulso = new EmbedBuilder()
      .setColor('#8A2BE2')
      .setTitle('⚡ Impulsos — Flash Store')
      .setDescription(`\n📌 VENDAS DE IMPULSOS\n\n${produtosDisponiveis}\n\nEscolha o pacote desejado usando o menu abaixo.`);

    return interaction.reply({ embeds: [embedImpulso], components: [menuImpulso] });
  }
};
