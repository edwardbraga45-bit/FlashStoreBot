const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: { name: 'setup' },
  async execute(interaction, ctx) {
    const canalRegras = interaction.guild.channels.cache.get(ctx.CANAL_REGRAS_ID || ctx.config?.CHANNELS?.RULES || ctx.CANAL_REGRAS_ID);
    const canalTermos = interaction.guild.channels.cache.get(ctx.CANAL_TERMOS_ID || ctx.config?.CHANNELS?.TERMS || ctx.CANAL_TERMOS_ID);

    if (!canalRegras || !canalTermos) {
      return interaction.reply({ content: '❌ Não encontrei o canal de regras ou termos.', ephemeral: true });
    }

    const regrasEmbed = new EmbedBuilder()
      .setColor('#8A2BE2')
      .setTitle('📜 REGRAS — FLASH STORE')
      .setDescription(`
1️⃣ Respeite todos os membros e a equipe.

2️⃣ Não faça spam ou divulgações.

3️⃣ Não utilize linguagem ofensiva.

4️⃣ Utilize os canais corretamente.

5️⃣ Não abra vários tickets para o mesmo assunto.

6️⃣ Compras devem ser realizadas apenas através dos tickets.

7️⃣ Tentativas de golpe resultarão em banimento permanente.

8️⃣ A equipe possui a decisão final em situações de moderação.
`);

    const termosEmbed = new EmbedBuilder()
      .setColor('#8A2BE2')
      .setTitle('📑 TERMOS DE SERVIÇO — FLASH STORE')
      .setDescription(`
• Todos os produtos serão entregues conforme anunciado.

• O cliente é responsável pelas informações fornecidas.

• Após a entrega não haverá reembolso, salvo falha comprovada da loja.

• Os prazos podem variar conforme o produto adquirido.

• Tentativas de fraude resultarão em cancelamento do atendimento.

• Ao efetuar uma compra, você concorda com todos os termos acima.
`);

    await canalRegras.send({ embeds: [regrasEmbed] });
    await canalTermos.send({ embeds: [termosEmbed] });

    return interaction.reply({ content: '✅ Regras e termos enviados com sucesso!', ephemeral: true });
  }
};
