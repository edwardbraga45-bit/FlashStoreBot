const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'lucro' },
  async execute(interaction, ctx) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ flags: 64 });

    const sub = interaction.options.getSubcommand();

    if (sub === 'total') {
      const lucroTotal = ctx.db.sales.reduce((acc, v) => acc + Number(v.lucro || 0), 0);
      const faturamentoTotal = ctx.db.sales.reduce((acc, v) => acc + Number(v.valor || 0), 0);
      const custoTotal = ctx.db.sales.reduce((acc, v) => acc + Number(v.custo || 0), 0);
      const vendas = ctx.db.sales.length;
      const margemLucro = vendas > 0 ? ((lucroTotal / faturamentoTotal) * 100) : 0;

      const embed = new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle('💎 Lucro Total')
        .setDescription(`\n📈 **Estatísticas Gerais:**\n\n• **Total de Vendas:** ${vendas}\n• **Faturamento:** R$ ${faturamentoTotal.toFixed(2)}\n• **Custo Total:** R$ ${custoTotal.toFixed(2)}\n• **Lucro Total:** R$ ${lucroTotal.toFixed(2)}\n• **Margem de Lucro:** ${margemLucro.toFixed(2)}%\n• **Ticket Médio:** R$ ${vendas > 0 ? (faturamentoTotal / vendas).toFixed(2) : '0.00'}`)
        .setFooter({ text: 'Flash Store • Lucro' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'hoje') {
      const hoje = new Date(); hoje.setHours(0,0,0,0);
      const vendasHoje = ctx.db.sales.filter(venda => { const dv = new Date(venda.data); dv.setHours(0,0,0,0); return dv.getTime() === hoje.getTime(); });

      const lucroHoje = vendasHoje.reduce((acc, v) => acc + Number(v.lucro || 0), 0);
      const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + Number(v.valor || 0), 0);
      const custoHoje = vendasHoje.reduce((acc, v) => acc + Number(v.custo || 0), 0);
      const vendas = vendasHoje.length;
      const margemLucro = vendas > 0 ? ((lucroHoje / faturamentoHoje) * 100) : 0;

      const embed = new EmbedBuilder()
        .setColor('#FFB703')
        .setTitle('💰 Lucro de Hoje')
        .setDescription(`\n📊 **Data:** ${hoje.toLocaleDateString('pt-BR')}\n\n━━━━━━━━━━━━━━━━━━━━\n\n• **Vendas:** ${vendas}\n• **Faturamento:** R$ ${faturamentoHoje.toFixed(2)}\n• **Custo:** R$ ${custoHoje.toFixed(2)}\n• **Lucro:** R$ ${lucroHoje.toFixed(2)}\n• **Margem de Lucro:** ${margemLucro.toFixed(2)}%\n• **Ticket Médio:** R$ ${vendas > 0 ? (faturamentoHoje / vendas).toFixed(2) : '0.00'}`)
        .setFooter({ text: 'Flash Store • Lucro Diário' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  }
};
