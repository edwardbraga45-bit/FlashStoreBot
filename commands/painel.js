const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'painel' },
  async execute(interaction, ctx) {
    const tipoMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tipo_ticket')
        .setPlaceholder('Escolha o tipo de atendimento')
        .addOptions([
          { label: 'Receber produto', value: 'receber_produto', description: 'Abrir ticket para confirmar entrega ou envio de pedido', emoji: '📦' },
          { label: 'Suporte', value: 'suporte', description: 'Abrir ticket para dúvidas, problemas ou ajuda técnica', emoji: '🛠️' }
        ])
    );

    const embed = new EmbedBuilder()
      .setColor('#8A2BE2')
      .setTitle('⚡ FLASH STORE — CENTRAL DE ATENDIMENTO')
      .setDescription(`
🎫 **Seja bem-vindo ao sistema de tickets da Flash Store!**

Escolha uma das opções abaixo para abrir seu atendimento:

• **Receber produto** — envie o comprovante e acompanhe seu pedido.
• **Suporte** — tire dúvidas, reporte problemas ou solicite ajuda técnica.

📌 **Antes de abrir um ticket:**
• Explique sua solicitação de forma clara e detalhada;
• Informe o produto ou serviço desejado;
• Aguarde o atendimento da equipe após abrir o ticket.

⏳ Nosso atendimento é realizado o mais rápido possível.

⚠️ Evite abrir vários tickets para o mesmo assunto.

💜 Agradecemos pela preferência e confiança em nossos serviços!

🚀 Atendimento rápido • Compra segura • Suporte dedicado

⚡ Flash Store © Todos os direitos reservados.
`)
      .setFooter({ text: 'Flash Store • Atendimento' });

    return interaction.reply({ embeds: [embed], components: [tipoMenu] });
  }
};
