const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'catalogo' },
  async execute(interaction, ctx) {
    const nitroProdutos = [ctx.PRODUTOS.nitro_mensal, ctx.PRODUTOS.nitro_trimestral, ctx.PRODUTOS.nitro_anual];

    const produtosDisponiveis = nitroProdutos.map(produto => `• **${produto.nome}** — R$ ${produto.preco.toFixed(2)} — Estoque: **${produto.estoque()}**`).join('\n');

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('selecionar_produto')
        .setPlaceholder('🛒 Ver opções')
        .addOptions([
          { label: 'Nitro Mensal', description: `R$ 2,20 | Estoque: ${ctx.PRODUTOS.nitro_mensal.estoque()}`, value: 'nitro_mensal' },
          { label: 'Nitro Trimestral', description: `R$ 3,10 | Estoque: ${ctx.PRODUTOS.nitro_trimestral.estoque()}`, value: 'nitro_trimestral' },
          { label: 'Nitro Anual', description: `R$ 30,00 | Estoque: ${ctx.PRODUTOS.nitro_anual.estoque()}`, value: 'nitro_anual' }
        ])
    );

    const embed = new EmbedBuilder()
      .setColor('#8A2BE2')
      .setTitle('⚡ Catálogo de Nitro — Flash Store')
      .setDescription(`\n📌 PRODUTO DIGITAL COM ENTREGA AUTOMATIZADA\n\n━━━━━━━━━━━━━━━━━━━━\n\n${produtosDisponiveis}\n\n━━━━━━━━━━━━━━━━━━━━\n\nEscolha o Nitro que deseja comprar usando o menu abaixo.\n\n💜 Flash Store`);

    return interaction.reply({ embeds: [embed], components: [menu] });
  }
};
