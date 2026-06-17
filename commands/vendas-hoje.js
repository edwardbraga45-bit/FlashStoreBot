const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'vendas-hoje' },
  async execute(interaction, ctx) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ flags: 64 });

    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const vendasHoje = ctx.db.sales.filter(venda => { const dv = new Date(venda.data); dv.setHours(0,0,0,0); return dv.getTime() === hoje.getTime(); });

    const totalVendas = vendasHoje.length;
    const totalFaturado = vendasHoje.reduce((acc, v) => acc + Number(v.valor || 0), 0);
    const totalLucro = vendasHoje.reduce((acc, v) => acc + Number(v.lucro || 0), 0);
    const totalCusto = vendasHoje.reduce((acc, v) => acc + Number(v.custo || 0), 0);

    const listaVendas = vendasHoje.map(v => `• **${v.produto}** - ${v.cliente} → R$ ${Number(v.valor).toFixed(2)} (${v.pagamento})`).join('\n') || 'Nenhuma venda registrada hoje.';

    const embed = new EmbedBuilder()
      .setColor('#00D084')
      .setTitle('💚 Vendas de Hoje')
      .setDescription(`\n**Data:** ${hoje.toLocaleDateString('pt-BR')}\n\n━━━━━━━━━━━━━━━━━━━━\n\n${listaVendas}\n\n━━━━━━━━━━━━━━━━━━━━\n\n📊 **Resumo:**\n• **Total de Vendas:** ${totalVendas}\n• **Faturamento:** R$ ${totalFaturado.toFixed(2)}\n• **Custo:** R$ ${totalCusto.toFixed(2)}\n• **Lucro:** R$ ${totalLucro.toFixed(2)}\n• **Ticket Médio:** R$ ${totalVendas > 0 ? (totalFaturado / totalVendas).toFixed(2) : '0.00'}`)
      .setFooter({ text: 'Flash Store • Vendas' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
