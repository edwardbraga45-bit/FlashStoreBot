const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'nitrolink' },
  async execute(interaction, ctx) {
    const produtosLink = [ctx.PRODUTOS.nitro_link_1mes, ctx.PRODUTOS.link_3_meses];

    const produtosDisponiveis = produtosLink.map(produto => `• **${produto.nome}** — R$ ${produto.preco.toFixed(2)} — Estoque: **${produto.estoque()}**`).join('\n');

    const menuLink = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('selecionar_produto')
        .setPlaceholder('🛒 Escolha o Nitro Link')
        .addOptions([
          { label: 'Nitro Link 1 mês', description: `R$ 1,00 | Estoque: ${ctx.PRODUTOS.nitro_link_1mes.estoque()}`, value: 'nitro_link_1mes' },
          { label: 'Link 3 meses', description: `R$ 7,50 | Estoque: ${ctx.PRODUTOS.link_3_meses.estoque()}`, value: 'link_3_meses' }
        ])
    );

    const embedLink = new EmbedBuilder()
      .setColor('#8A2BE2')
      .setTitle('⚡ Nitro Link — Flash Store')
      .setDescription(`\n📌 VENDAS DE NITRO LINK\n\n${produtosDisponiveis}\n\nEscolha o Nitro Link desejado usando o menu abaixo.`);

    return interaction.reply({ embeds: [embedLink], components: [menuLink] });
  }
};
