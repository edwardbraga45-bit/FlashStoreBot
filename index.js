require('dotenv').config();

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionsBitField,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Events,
    StringSelectMenuBuilder
} = require('discord.js');

// Importar módulos personalizados
const config = require('./config');
const utils = require('./utils');
const Features = require('./features');
const Cache = require('./lib/cache');
const RateLimiter = require('./lib/rateLimiter');
const AuditLog = require('./lib/auditLog');


const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,

        GatewayIntentBits.GuildMembers,

        GatewayIntentBits.GuildMessages,

        GatewayIntentBits.MessageContent

    ]

});

client.on('error', error => {
    console.error(`[${new Date().toISOString()}] Client error:`, error);
});

client.on('shardError', error => {
    console.error(`[${new Date().toISOString()}] Shard error:`, error);
});

process.on('unhandledRejection', (reason) => {
    console.error(`[${new Date().toISOString()}] Unhandled Rejection:`, reason);
});

process.on('uncaughtException', (error) => {
    console.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
});

// IDs usando configuração centralizada
const SUPORTE_ROLE_ID = config.ROLES.SUPPORT;
const CARGO_EXTRA_1_ID = config.ROLES.EXTRA_1;
const CARGO_EXTRA_2_ID = config.ROLES.EXTRA_2;
const CATEGORIA_TICKETS_ID = config.CHANNELS.TICKETS_CATEGORY;

const CANAL_REGRAS_ID = config.CHANNELS.RULES;
const CANAL_TERMOS_ID = config.CHANNELS.TERMS;
const LOG_CHANNEL_ID = config.CHANNELS.LOGS;
const STOCK_MESSAGE_CHANNEL_ID = config.CHANNELS.STOCK_MESSAGE;
const STOCK_CONFIRM_CHANNEL_ID = config.CHANNELS.STOCK_CONFIRM;
const CANAL_CONTAS_NITRADAS_ID = config.CHANNELS.NITRO_ACCOUNTS;
const CANAL_NITRO_LINK_ID = config.CHANNELS.NITRO_LINK;
const CANAL_IMPULSOS_ID = config.CHANNELS.BOOSTS;
const CANAL_AVALIACOES_ID = config.CHANNELS.RATINGS;

const PIX_CHAVE = config.PAYMENT.PIX_KEY;

const DATA_FILE = path.join(__dirname, config.DATABASE.FILE);
const PRODUTOS = {

    nitro_mensal: {

        nome:'Nitro Mensal',

        preco:2.20,

        estoque:() => {

            const item = Object.values(db.stock)

                .find(p => p.nome.toLowerCase() === 'nitro mensal');

            return item ? item.quantidade : 0;

        }

    },

    nitro_trimestral: {

        nome:'Nitro Trimensal',

        preco:3.10,

        estoque:() => {

            const item = Object.values(db.stock)

                .find(p => p.nome.toLowerCase() === 'nitro trimensal');

            return item ? item.quantidade : 0;

        }

    },


    nitro_anual: {

        nome:'Nitro Anual',

        preco:30.00,

        estoque:() => {

            const item = Object.values(db.stock)

                .find(p => p.nome.toLowerCase() === 'nitro anual');

            return item ? item.quantidade : 0;

        }

    },

    nitro_link_1mes: {

        nome:'Nitro Link',

        preco:1.00,

        estoque:() => {

            const item = Object.values(db.stock)

                .find(p => p.nome.toLowerCase() === 'nitro link');

            return item ? item.quantidade : 0;

        }

    },

    link_3_meses: {

        nome:'Link 3 Meses',

        preco:7.50,

        estoque:() => {

            const item = Object.values(db.stock)

                .find(p => p.nome.toLowerCase() === 'link 3 meses');

            return item ? item.quantidade : 0;

        }

    }

    ,

    impulso_2x1: {

        nome: 'Mensal | 2x 1MPULSO',

        preco: 2.50,

        estoque: () => {
            const item = Object.values(db.stock)
                .find(p => p.nome.toLowerCase() === 'mensal | 2x 1mpulso');
            return item ? item.quantidade : 0;
        }

    },

    impulso_8x1: {

        nome: 'Mensal | 8x 1MPULSO',

        preco: 10.50,

        estoque: () => {
            const item = Object.values(db.stock)
                .find(p => p.nome.toLowerCase() === 'mensal | 8x 1mpulso');
            return item ? item.quantidade : 0;
        }

    },

    impulso_14x1: {

        nome: 'Mensal | 14x 1MPULSO',

        preco: 16.00,

        estoque: () => {
            const item = Object.values(db.stock)
                .find(p => p.nome.toLowerCase() === 'mensal | 14x 1mpulso');
            return item ? item.quantidade : 0;
        }

    }

};


const CARGOS_AUTORIZADOS = [
    SUPORTE_ROLE_ID,
    CARGO_EXTRA_1_ID,
    CARGO_EXTRA_2_ID
];

function createDefaultDB() {
    return {
        stock: {},
        sales: [],
        coupons: [],
        tickets: [],
        // Novos campos para novas funcionalidades
        ratings: [],
        spam_warnings: {},
        reminders: [],
        ticket_stats: {},
        customer_levels: {},
        monthly_stats: {}
    };
}

function loadDB() {
    if (!fs.existsSync(DATA_FILE)) {
        return createDefaultDB();
    }

    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);

        return {
            stock: parsed.stock || {},
            sales: parsed.sales || [],
            coupons: parsed.coupons || [],
            tickets: parsed.tickets || [],
            ratings: parsed.ratings || [],
            spam_warnings: parsed.spam_warnings || {},
            reminders: parsed.reminders || [],
            ticket_stats: parsed.ticket_stats || {},
            customer_levels: parsed.customer_levels || {},
            monthly_stats: parsed.monthly_stats || {},
            settings: parsed.settings || {
                bot_enabled: true,
                low_stock_threshold: config.LIMITS.LOW_STOCK_THRESHOLD
            }
        };
    } catch (error) {
        console.error('Erro ao carregar data.json:', error);
        return createDefaultDB();
    }
}

function saveDB() {
    try {
        const tmpFile = DATA_FILE + '.tmp';
        fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
        fs.renameSync(tmpFile, DATA_FILE);
    } catch (error) {
        console.error('Erro ao salvar data.json:', error);
    }
}

function reloadDB() {
    try {
        const latestDB = loadDB();
        if (!latestDB) return;

        db = latestDB;

        if (!db.settings) db.settings = {};
        if (typeof db.settings.bot_enabled !== 'boolean') {
            db.settings.bot_enabled = true;
        }
        if (!db.settings.low_stock_threshold) {
            db.settings.low_stock_threshold = config.LIMITS.LOW_STOCK_THRESHOLD;
        }

        console.log('🔄 Banco recarregado do data.json');
    } catch (error) {
        console.error('Erro ao recarregar data.json:', error);
    }
}

fs.watchFile(DATA_FILE, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
        reloadDB();
    }
});

let db = loadDB();
let needsSave = false;

// Inicializar helpers: cache, rate limiter e audit log
const cache = new Cache();
const rateLimiter = new RateLimiter({ windowMs: 10000, max: 5 });
const auditLog = new AuditLog(path.join(__dirname, 'logs', 'audit.log'));

// Sincronizar todos os preços com os valores corretos
for (const produto of Object.values(PRODUTOS)) {
    const key = normalizeName(produto.nome);
    if (!db.stock[key]) {
        db.stock[key] = {
            nome: produto.nome,
            quantidade: 0,
            vendido: 0,
            preco: produto.preco
        };
        needsSave = true;
    } else {
        // Sempre sincronizar o preço com o valor correto
        if (db.stock[key].preco !== produto.preco) {
            db.stock[key].preco = produto.preco;
            needsSave = true;
        }
    }
}

// Produtos adicionais
const additionalProducts = [
    { key: 'nitro link', nome: 'Nitro Link', preco: 1.00 },
    { key: 'link 3 meses', nome: 'Link 3 Meses', preco: 7.50 }
];

for (const product of additionalProducts) {
    if (!db.stock[product.key]) {
        db.stock[product.key] = {
            nome: product.nome,
            quantidade: 0,
            vendido: 0,
            preco: product.preco
        };
        needsSave = true;
    } else {
        // Sempre sincronizar o preço
        if (db.stock[product.key].preco !== product.preco) {
            db.stock[product.key].preco = product.preco;
            needsSave = true;
        }
    }
}
if (!db.settings) {
    db.settings = {
        bot_enabled: true,
        low_stock_threshold: config.LIMITS.LOW_STOCK_THRESHOLD
    };
    needsSave = true;
} else {
    if (typeof db.settings.bot_enabled !== 'boolean') {
        db.settings.bot_enabled = true;
        needsSave = true;
    }
    if (!db.settings.low_stock_threshold) {
        db.settings.low_stock_threshold = config.LIMITS.LOW_STOCK_THRESHOLD;
        needsSave = true;
    }
}

if (needsSave) {
    saveDB();
}

function normalizeName(name) {
    return utils.normalizeName(name);
}

function ensureStockItem(productName) {
    const key = normalizeName(productName);

    if (!db.stock[key]) {
        // Buscar o preço correto do objeto PRODUTOS
        let preco = 0;
        for (const produto of Object.values(PRODUTOS)) {
            if (normalizeName(produto.nome) === key) {
                preco = produto.preco;
                break;
            }
        }
        
        // Se não encontrou em PRODUTOS, usar preços padrão
        if (preco === 0) {
            if (key === 'conta nitrada') preco = 5.50;
            else if (key === 'nitro link') preco = 1.00;
            else if (key === 'link 3 meses') preco = 7.50;
        }

        db.stock[key] = {
            nome: productName,
            quantidade: 0,
            vendido: 0,
            preco: preco
        };
        saveDB();
    }

    return db.stock[key];
}

function getTicketsCategory(guild) {
    const configuredCategory = guild.channels.cache.get(CATEGORIA_TICKETS_ID);
    if (configuredCategory && configuredCategory.type === ChannelType.GuildCategory) {
        return configuredCategory;
    }

    return guild.channels.cache.find(channel =>
        channel.type === ChannelType.GuildCategory &&
        /atendimento|ticket|suporte/i.test(channel.name)
    ) || null;
}

function podeGerenciarTicket(member) {
    return utils.hasManagePermission(member);
}

/**
 * Retorna o próximo limiar de compras para subir de nível
 */
function getNextLevelThreshold(currentPurchases) {
    if (currentPurchases < 1) return 1;
    if (currentPurchases < 5) return 5;
    if (currentPurchases < 10) return 10;
    if (currentPurchases < 25) return 25;
    if (currentPurchases < 50) return 50;
    return 50;
}

async function sendLog(title, description, color = '#8A2BE2') {
    try {
        const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (!channel || !channel.isTextBased()) return;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Erro ao enviar log:', error);
    }
}

async function sendRestockNotification(text) {
    if (!db.settings?.bot_enabled) return;
    try {
        let channel = client.channels.cache.get(STOCK_CONFIRM_CHANNEL_ID);
        if (!channel) {
            channel = await client.channels.fetch(STOCK_CONFIRM_CHANNEL_ID).catch(() => null);
        }

        if (!channel || !channel.isTextBased()) {
            console.error('Canal de reestoque inválido:', STOCK_CONFIRM_CHANNEL_ID);
            return;
        }

        await channel.send({ content: text });
    } catch (error) {
        console.error('Erro ao enviar notificação de reestoque:', error);
    }
}

function buildStats() {
    const vendas = db.sales.length;
    const receita = db.sales.reduce((acc, sale) => acc + Number(sale.valor || 0), 0);
    const lucro = db.sales.reduce((acc, sale) => acc + Number(sale.lucro || 0), 0);
    const produtos = Object.keys(db.stock).length;
    const estoqueTotal = Object.values(db.stock).reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
    const cuponsAtivos = db.coupons.filter(c => c.ativo).length;
    const tickets = db.tickets.length;
    const estoqueBaixo = Object.values(db.stock).filter(item => Number(item.quantidade || 0) > 0 && Number(item.quantidade || 0) <= 3).length;
    const topProduto = Object.values(db.stock).sort((a, b) => Number(b.vendido || 0) - Number(a.vendido || 0))[0];

    return {
        vendas,
        receita,
        lucro,
        produtos,
        estoqueTotal,
        cuponsAtivos,
        tickets,
        estoqueBaixo,
        topProduto: topProduto ? topProduto.nome : 'Nenhum'
    };
}

client.once(Events.ClientReady, () => {
    console.log(`✅ ${client.user.tag} está online!`);
});

client.on(Events.InteractionCreate, async interaction => {
    try {
        if (!db.settings?.bot_enabled) {
            if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isStringSelectMenu()) {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ O bot está desligado no painel. Ative-o no dashboard para usar novamente.',
                        ephemeral: true
                    });
                }
                return;
            }
        }
        if (!interaction.inGuild()) return;

        // Rate limit para comandos do tipo chat input
        if (interaction.isChatInputCommand()) {
            // Tenta carregar módulo de comando em ./commands/<name>.js
            const cmdPath = path.join(__dirname, 'commands', `${interaction.commandName}.js`);
            if (fs.existsSync(cmdPath)) {
                try {
                    delete require.cache[require.resolve(cmdPath)];
                    const mod = require(cmdPath);
                    if (mod && typeof mod.execute === 'function') {
                        await mod.execute(interaction, { 
                            client,
                            db,
                            utils,
                            cache,
                            auditLog,
                            rateLimiter,
                            Features,
                            sendLog,
                            sendRestockNotification,
                            saveDB,
                            ensureStockItem,
                            normalizeName,
                            buildStats,
                            PRODUTOS,
                            SUPORTE_ROLE_ID,
                            CARGO_EXTRA_1_ID,
                            CARGO_EXTRA_2_ID,
                            CANAL_REGRAS_ID,
                            CANAL_TERMOS_ID,
                            CANAL_AVALIACOES_ID
                        });
                        return;
                    }
                } catch (err) {
                    console.error('Erro ao executar módulo de comando:', err);
                }
            }
            const rl = rateLimiter.isAllowed(interaction.user.id);
            if (!rl.allowed) {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Você está executando comandos rápido demais. Aguarde alguns segundos.', ephemeral: true });
                }
                return;
            }
            rateLimiter.record(interaction.user.id);
        }

        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'health') {
                const uptime = process.uptime();
                const memory = process.memoryUsage();
                const dbStatus = (db && Object.keys(db).length > 0) ? 'loaded' : 'empty';

                const healthEmbed = new EmbedBuilder()
                    .setColor('#22C55E')
                    .setTitle('🩺 Health — Flash Store Bot')
                    .addFields(
                        { name: 'Uptime', value: `${Math.floor(uptime)}s`, inline: true },
                        { name: 'Memory (RSS)', value: `${Math.round(memory.rss / 1024 / 1024)} MB`, inline: true },
                        { name: 'DB', value: dbStatus, inline: true }
                    )
                    .setTimestamp();

                return interaction.reply({ embeds: [healthEmbed], ephemeral: true });
            }
            if (interaction.commandName === 'painel') {
                const tipoMenu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('tipo_ticket')
                        .setPlaceholder('Escolha o tipo de atendimento')
                        .addOptions([
                            {
                                label: 'Receber produto',
                                value: 'receber_produto',
                                description: 'Abrir ticket para confirmar entrega ou envio de pedido',
                                emoji: '📦'
                            },
                            {
                                label: 'Suporte',
                                value: 'suporte',
                                description: 'Abrir ticket para dúvidas, problemas ou ajuda técnica',
                                emoji: '🛠️'
                            }
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

                return interaction.reply({
                    embeds: [embed],
                    components: [tipoMenu]
                });
            }

            if (interaction.commandName === 'setup') {
                const canalRegras = interaction.guild.channels.cache.get(CANAL_REGRAS_ID);
                const canalTermos = interaction.guild.channels.cache.get(CANAL_TERMOS_ID);

                if (!canalRegras || !canalTermos) {
                    return interaction.reply({
                        content: '❌ Não encontrei o canal de regras ou termos.',
                        ephemeral: true
                    });
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

                return interaction.reply({
                    content: '✅ Regras e termos enviados com sucesso!',
                    ephemeral: true
                });
            }

            if (interaction.commandName === 'estoque') {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ flags: 64 });
                }
                const sub = interaction.options.getSubcommand();

                if (sub === 'adicionar') {
                    const produto = interaction.options.getString('produto', true);
                    const quantidade = interaction.options.getInteger('quantidade', true);

                    const item = ensureStockItem(produto);
                    item.nome = produto;
                    item.quantidade += quantidade;

                    saveDB();

                    // Audit log
                    try {
                        auditLog.logAction('estoque_adicionar', interaction.user.tag, { produto, quantidade, total: item.quantidade });
                    } catch (e) { /* noop */ }

                    void sendRestockNotification(`✅ Estoque reabastecido para **${produto}**: **${item.quantidade}** unidades.`);

                    return interaction.editReply(
                        `✅ Adicionado **${quantidade}** ao estoque de **${produto}**. Agora tem **${item.quantidade}**.`
                    );
                }

                if (sub === 'remover') {
                    const produto = interaction.options.getString('produto', true);
                    const quantidade = interaction.options.getInteger('quantidade', true);
                    const key = normalizeName(produto);

                    if (!db.stock[key]) {
                        return interaction.editReply(
                            `❌ O produto **${produto}** não existe no estoque.`
                        );
                    }

                    if (db.stock[key].quantidade < quantidade) {
                        return interaction.editReply(
                            `❌ Estoque insuficiente. Atual: **${db.stock[key].quantidade}**`
                        );
                    }

                    db.stock[key].quantidade -= quantidade;
                    saveDB();

                    // Audit log
                    try {
                        auditLog.logAction('estoque_remover', interaction.user.tag, { produto, quantidade, total: db.stock[key].quantidade });
                    } catch (e) { /* noop */ }

                    void sendLog(
                        '📦 Estoque ajustado',
                        `**Produto:** ${produto}\n**Ação:** -${quantidade}\n**Novo total:** ${db.stock[key].quantidade}`,
                        '#F59E0B'
                    );

                    return interaction.editReply(
                        `✅ Removido **${quantidade}** do estoque de **${produto}**. Agora tem **${db.stock[key].quantidade}**.`
                    );
                }

                if (sub === 'ver') {
                    const produto = interaction.options.getString('produto', false);

                    if (produto) {
                        const key = normalizeName(produto);
                        const item = db.stock[key];

                        if (!item) {
                            return interaction.editReply(
                                `❌ O produto **${produto}** não foi encontrado no estoque.`
                            );
                        }

                        const embed = new EmbedBuilder()
                            .setColor('#8A2BE2')
                            .setTitle(`📦 Estoque de ${item.nome}`)
                            .addFields(
                                { name: 'Quantidade', value: String(item.quantidade), inline: true },
                                { name: 'Vendidos', value: String(item.vendido || 0), inline: true }
                            );

                        return interaction.editReply({ embeds: [embed] });
                    }

                    const lista = Object.values(db.stock)
                        .map(item => `• **${item.nome}** — Qtd: **${item.quantidade}** | Vendidos: **${item.vendido || 0}**`)
                        .join('\n') || 'Nenhum produto cadastrado no estoque.';

                    const embed = new EmbedBuilder()
                        .setColor('#8A2BE2')
                        .setTitle('📦 Estoque da Flash Store')
                        .setDescription(lista);

                    return interaction.editReply({ embeds: [embed] });
                }
            }

            if (interaction.commandName === 'venda') {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ flags: 64 });
                }
                const sub = interaction.options.getSubcommand();

                if (sub === 'registrar') {
                    const cliente = interaction.options.getString('cliente', true);
                    const produto = interaction.options.getString('produto', true);
                    const valor = interaction.options.getNumber('valor', true);
                    const custo = interaction.options.getNumber('custo', true);
                    const pagamento = interaction.options.getString('pagamento', true);
                    const quantidade = interaction.options.getInteger('quantidade') || 1;

                    // Validações
                    if (!utils.isValidPrice(valor)) {
                        return interaction.editReply('❌ Valor inválido. Deve estar entre 0 e 99999.99');
                    }
                    if (!utils.isValidPrice(custo)) {
                        return interaction.editReply('❌ Custo inválido. Deve estar entre 0 e 99999.99');
                    }
                    if (!utils.isValidQuantity(quantidade)) {
                        return interaction.editReply('❌ Quantidade inválida. Deve estar entre 1 e 999999');
                    }

                    const key = normalizeName(produto);
                    const item = db.stock[key];

                    if (!item) {
                        return interaction.editReply(
                            `❌ O produto **${produto}** não existe no estoque. Use /estoque adicionar primeiro.`
                        );
                    }

                    if (item.quantidade < quantidade) {
                        return interaction.editReply(
                            `❌ Estoque insuficiente para vender **${quantidade}** unidade(s). Estoque atual: **${item.quantidade}**`
                        );
                    }

                    item.quantidade -= quantidade;
                    item.vendido = Number(item.vendido || 0) + quantidade;

                    const lucro = Number(valor) - Number(custo);

                    const venda = {
                        id: Date.now(),
                        cliente,
                        produto,
                        valor,
                        custo,
                        lucro,
                        pagamento,
                        vendedor: interaction.user.username,
                        quantidade,
                        data: new Date().toISOString()
                    };

                    db.sales.unshift(venda);
                    
                    // Atualizar estatísticas do cliente (nível)
                    // Usar ID do cliente se disponível, caso contrário usar nome
                    const clienteMatch = db.sales.filter(s => s.cliente === cliente);
                    if (clienteMatch.length > 0) {
                        // Extrair ID se for menção
                        const idMatch = cliente.match(/<@!?(\d+)>/);
                        if (idMatch) {
                            const clienteId = idMatch[1];
                            Features.updateCustomerLevel(db, clienteId, cliente);
                        }
                    }
                    
                    // Atualizar metas mensais
                    Features.initMonthlyStats(db);
                    const now = new Date();
                    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
                    if (db.monthly_stats[monthKey]) {
                        db.monthly_stats[monthKey].sales += quantidade;
                        db.monthly_stats[monthKey].revenue += valor;
                    }
                    
                    saveDB();

                    // Audit log de venda
                    try {
                        auditLog.logAction('venda_registrada', interaction.user.tag, { cliente, produto, valor, custo, quantidade, lucro });
                    } catch (e) { /* noop */ }

                    void sendLog(
                        '💰 Nova venda registrada',
                        `**Cliente:** ${cliente}\n**Produto:** ${produto}\n**Valor:** ${utils.formatPrice(valor)}\n**Lucro:** ${utils.formatPrice(lucro)}\n**Pagamento:** ${pagamento}`,
                        '#22C55E'
                    );

                    return interaction.editReply(
                        `✅ Venda registrada com sucesso para **${cliente}**.\nProduto: **${produto}**\nValor: **${utils.formatPrice(valor)}**\nLucro: **${utils.formatPrice(lucro)}**`
                    );
                }
            }

            if (interaction.commandName === 'cupom') {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ flags: 64 });
                }
                const sub = interaction.options.getSubcommand();

                if (sub === 'criar') {
                    const nome = interaction.options.getString('nome', true).trim();
                    const desconto = interaction.options.getInteger('desconto', true);
                    const validade = interaction.options.getString('validade', true);
                    const usos = interaction.options.getInteger('usos') || 1;

                    // Validações
                    if (!nome || nome.length < 2 || nome.length > 50) {
                        return interaction.editReply('❌ Nome do cupom inválido. Deve ter entre 2 e 50 caracteres.');
                    }
                    if (desconto < 1 || desconto > 100) {
                        return interaction.editReply('❌ Desconto inválido. Deve estar entre 1% e 100%.');
                    }
                    if (!utils.isValidQuantity(usos)) {
                        return interaction.editReply('❌ Número de usos inválido.');
                    }

                    const cupom = {
                        nome: nome.toUpperCase(),
                        desconto,
                        validade,
                        usosMaximos: usos,
                        usosRestantes: usos,
                        ativo: true,
                        criadoPor: interaction.user.id,
                        criadoEm: new Date().toISOString()
                    };

                    const indexExistente = db.coupons.findIndex(c => c.nome === cupom.nome);
                    if (indexExistente >= 0) {
                        db.coupons[indexExistente] = cupom;
                    } else {
                        db.coupons.unshift(cupom);
                    }

                    saveDB();

                    void sendLog(
                        '🎟️ Cupom criado',
                        `**Cupom:** ${cupom.nome}\n**Desconto:** ${desconto}%\n**Validade:** ${validade}\n**Usos:** ${usos}`,
                        '#A855F7'
                    );

                    return interaction.editReply(
                        `✅ Cupom **${cupom.nome}** criado com **${desconto}%** de desconto. Validade: **${validade}**.`
                    );
                }

                if (sub === 'deletar') {
                    const nome = interaction.options.getString('nome', true).toUpperCase();

                    const index = db.coupons.findIndex(cupom => cupom.nome === nome);

                    if (index === -1) {
                        return interaction.editReply(`❌ O cupom **${nome}** não existe.`);
                    }

                    db.coupons.splice(index, 1);
                    saveDB();

                    void sendLog(
                        '🗑️ Cupom deletado',
                        `**Cupom:** ${nome}\n**Removido por:** ${interaction.user.username}`,
                        '#EF4444'
                    );

                    return interaction.editReply(`✅ Cupom **${nome}** foi deletado com sucesso.`);
                }
            }
            if (interaction.commandName === 'catalogo') {
                const nitroProdutos = [
                    PRODUTOS.nitro_mensal,
                    PRODUTOS.nitro_trimestral,
                    PRODUTOS.nitro_anual
                ];

                const produtosDisponiveis = nitroProdutos
                    .map(produto => `• **${produto.nome}** — R$ ${produto.preco.toFixed(2)} — Estoque: **${produto.estoque()}**`)
                    .join('\n');

                const menu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('selecionar_produto')
                        .setPlaceholder('🛒 Ver opções')
                        .addOptions([
                            {
                                label: 'Nitro Mensal',
                                description: `R$ 2,20 | Estoque: ${PRODUTOS.nitro_mensal.estoque()}`,
                                value: 'nitro_mensal'
                            },
                            {
                                label: 'Nitro Trimestral',
                                description: `R$ 3,10 | Estoque: ${PRODUTOS.nitro_trimestral.estoque()}`,
                                value: 'nitro_trimestral'
                            },
                            {
                                label: 'Nitro Anual',
                                description: `R$ 30,00 | Estoque: ${PRODUTOS.nitro_anual.estoque()}`,
                                value: 'nitro_anual'
                            }
                        ])
                );

                const embed = new EmbedBuilder()
                    .setColor('#8A2BE2')
                    .setTitle('⚡ Catálogo de Nitro — Flash Store')
                    .setDescription(`
📌 PRODUTO DIGITAL COM ENTREGA AUTOMATIZADA

━━━━━━━━━━━━━━━━━━━━

${produtosDisponiveis}

━━━━━━━━━━━━━━━━━━━━

Escolha o Nitro que deseja comprar usando o menu abaixo.

💜 Flash Store
`);

                return interaction.reply({
                    embeds: [embed],
                    components: [menu]
                });
            }
            if (interaction.commandName === 'nitrolink') {
                const produtosLink = [
                    PRODUTOS.nitro_link_1mes,
                    PRODUTOS.link_3_meses
                ];

                const produtosDisponiveis = produtosLink
                    .map(produto => `• **${produto.nome}** — R$ ${produto.preco.toFixed(2)} — Estoque: **${produto.estoque()}**`)
                    .join('\n');

                const menuLink = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('selecionar_produto')
                        .setPlaceholder('🛒 Escolha o Nitro Link')
                        .addOptions([
                            {
                                label: 'Nitro Link 1 mês',
                                description: `R$ 1,00 | Estoque: ${PRODUTOS.nitro_link_1mes.estoque()}`,
                                value: 'nitro_link_1mes'
                            },
                            {
                                label: 'Link 3 meses',
                                description: `R$ 7,50 | Estoque: ${PRODUTOS.link_3_meses.estoque()}`,
                                value: 'link_3_meses'
                            }
                        ])
                );

                const embedLink = new EmbedBuilder()
                    .setColor('#8A2BE2')
                    .setTitle('⚡ Nitro Link — Flash Store')
                    .setDescription(`
📌 VENDAS DE NITRO LINK

${produtosDisponiveis}

Escolha o Nitro Link desejado usando o menu abaixo.
`);

                return interaction.reply({
                    embeds: [embedLink],
                    components: [menuLink]
                });
            }
            if (interaction.commandName === 'impulsos') {
                const produtosImpulso = [
                    PRODUTOS.impulso_2x1,
                    PRODUTOS.impulso_8x1,
                    PRODUTOS.impulso_14x1
                ];

                const produtosDisponiveis = produtosImpulso
                    .map(produto => `• **${produto.nome}** — R$ ${produto.preco.toFixed(2)} — Estoque: **${produto.estoque()}**`)
                    .join('\n');

                const menuImpulso = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('selecionar_produto')
                        .setPlaceholder('🛒 Escolha o pacote de Impulsos')
                        .addOptions([
                            {
                                label: 'Impulso 2x 1MPULSO',
                                description: `R$ 2,50 | Estoque: ${PRODUTOS.impulso_2x1.estoque()}`,
                                value: 'impulso_2x1'
                            },
                            {
                                label: 'Impulso 8x 1MPULSO',
                                description: `R$ 10,50 | Estoque: ${PRODUTOS.impulso_8x1.estoque()}`,
                                value: 'impulso_8x1'
                            },
                            {
                                label: 'Impulso 14x 1MPULSO',
                                description: `R$ 16,00 | Estoque: ${PRODUTOS.impulso_14x1.estoque()}`,
                                value: 'impulso_14x1'
                            }
                        ])
                );

                const embedImpulso = new EmbedBuilder()
                    .setColor('#8A2BE2')
                    .setTitle('⚡ Impulsos — Flash Store')
                    .setDescription(`
📌 VENDAS DE IMPULSOS

${produtosDisponiveis}

Escolha o pacote desejado usando o menu abaixo.
`);

                return interaction.reply({
                    embeds: [embedImpulso],
                    components: [menuImpulso]
                });
            }
            if (interaction.commandName === 'stats') {
                await interaction.deferReply({ ephemeral: true });

                const cacheKey = 'stats_overview';
                let embed = cache.get(cacheKey);

                if (!embed) {
                    const stats = buildStats();

                    embed = new EmbedBuilder()
                        .setColor('#8A2BE2')
                        .setTitle('📊 Stats da Flash Store')
                        .setDescription('Resumo geral da operação da loja.')
                        .addFields(
                            { name: 'Vendas', value: String(stats.vendas), inline: true },
                            { name: 'Receita', value: `R$ ${stats.receita.toFixed(2)}`, inline: true },
                            { name: 'Lucro', value: `R$ ${stats.lucro.toFixed(2)}`, inline: true },
                            { name: 'Produtos', value: String(stats.produtos), inline: true },
                            { name: 'Estoque total', value: String(stats.estoqueTotal), inline: true },
                            { name: 'Cupons ativos', value: String(stats.couponsAtivos), inline: true },
                            { name: 'Tickets', value: String(stats.tickets), inline: true },
                            { name: 'Estoque baixo', value: String(stats.estoqueBaixo), inline: true },
                            { name: 'Top produto', value: stats.topProduto, inline: true }
                        )
                        .setFooter({ text: 'Flash Store • Monitoramento' });

                    cache.set(cacheKey, embed, 5000);
                }

                return interaction.editReply({ embeds: [embed] });
            }

            // Vendas Hoje
            if (interaction.commandName === 'vendas-hoje') {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ flags: 64 });
                }

                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                const vendasHoje = db.sales.filter(venda => {
                    const datavenda = new Date(venda.data);
                    datavenda.setHours(0, 0, 0, 0);
                    return datavenda.getTime() === hoje.getTime();
                });

                const totalVendas = vendasHoje.length;
                const totalFaturado = vendasHoje.reduce((acc, v) => acc + Number(v.valor || 0), 0);
                const totalLucro = vendasHoje.reduce((acc, v) => acc + Number(v.lucro || 0), 0);
                const totalCusto = vendasHoje.reduce((acc, v) => acc + Number(v.custo || 0), 0);

                const listaVendas = vendasHoje
                    .map(v => `• **${v.produto}** - ${v.cliente} → R$ ${Number(v.valor).toFixed(2)} (${v.pagamento})`)
                    .join('\n') || 'Nenhuma venda registrada hoje.';

                const embed = new EmbedBuilder()
                    .setColor('#00D084')
                    .setTitle('💚 Vendas de Hoje')
                    .setDescription(`
**Data:** ${hoje.toLocaleDateString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━

${listaVendas}

━━━━━━━━━━━━━━━━━━━━

📊 **Resumo:**
• **Total de Vendas:** ${totalVendas}
• **Faturamento:** R$ ${totalFaturado.toFixed(2)}
• **Custo:** R$ ${totalCusto.toFixed(2)}
• **Lucro:** R$ ${totalLucro.toFixed(2)}
• **Ticket Médio:** R$ ${totalVendas > 0 ? (totalFaturado / totalVendas).toFixed(2) : '0.00'}
`)
                    .setFooter({ text: 'Flash Store • Vendas' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            // Lucro
            if (interaction.commandName === 'lucro') {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ flags: 64 });
                }

                const sub = interaction.options.getSubcommand();

                if (sub === 'total') {
                    const lucroTotal = db.sales.reduce((acc, v) => acc + Number(v.lucro || 0), 0);
                    const faturamentoTotal = db.sales.reduce((acc, v) => acc + Number(v.valor || 0), 0);
                    const custoTotal = db.sales.reduce((acc, v) => acc + Number(v.custo || 0), 0);
                    const vendas = db.sales.length;
                    const margemLucro = vendas > 0 ? ((lucroTotal / faturamentoTotal) * 100) : 0;

                    const embed = new EmbedBuilder()
                        .setColor('#8A2BE2')
                        .setTitle('💎 Lucro Total')
                        .setDescription(`
📈 **Estatísticas Gerais:**

• **Total de Vendas:** ${vendas}
• **Faturamento:** R$ ${faturamentoTotal.toFixed(2)}
• **Custo Total:** R$ ${custoTotal.toFixed(2)}
• **Lucro Total:** R$ ${lucroTotal.toFixed(2)}
• **Margem de Lucro:** ${margemLucro.toFixed(2)}%
• **Ticket Médio:** R$ ${vendas > 0 ? (faturamentoTotal / vendas).toFixed(2) : '0.00'}
`)
                        .setFooter({ text: 'Flash Store • Lucro' })
                        .setTimestamp();

                    return interaction.editReply({ embeds: [embed] });
                }

                if (sub === 'hoje') {
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);

                    const vendasHoje = db.sales.filter(venda => {
                        const dataVenda = new Date(venda.data);
                        dataVenda.setHours(0, 0, 0, 0);
                        return dataVenda.getTime() === hoje.getTime();
                    });

                    const lucroHoje = vendasHoje.reduce((acc, v) => acc + Number(v.lucro || 0), 0);
                    const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + Number(v.valor || 0), 0);
                    const custoHoje = vendasHoje.reduce((acc, v) => acc + Number(v.custo || 0), 0);
                    const vendas = vendasHoje.length;
                    const margemLucro = vendas > 0 ? ((lucroHoje / faturamentoHoje) * 100) : 0;

                    const embed = new EmbedBuilder()
                        .setColor('#FFB703')
                        .setTitle('💰 Lucro de Hoje')
                        .setDescription(`
📊 **Data:** ${hoje.toLocaleDateString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━

• **Vendas:** ${vendas}
• **Faturamento:** R$ ${faturamentoHoje.toFixed(2)}
• **Custo:** R$ ${custoHoje.toFixed(2)}
• **Lucro:** R$ ${lucroHoje.toFixed(2)}
• **Margem de Lucro:** ${margemLucro.toFixed(2)}%
• **Ticket Médio:** R$ ${vendas > 0 ? (faturamentoHoje / vendas).toFixed(2) : '0.00'}
`)
                        .setFooter({ text: 'Flash Store • Lucro Diário' })
                        .setTimestamp();

                    return interaction.editReply({ embeds: [embed] });
                }
            }

            // ===== NOVOS COMANDOS =====

            // Sistema de Avaliações
            if (interaction.commandName === 'avaliar') {
                const rating = interaction.options.getInteger('estrelas');
                const comment = interaction.options.getString('comentario');

                const ratingData = Features.addRating(
                    interaction.user.id,
                    interaction.user.username,
                    rating,
                    comment
                );

                db.ratings.push(ratingData);
                saveDB();

                // Enviar avaliação para o canal de avaliações
                const avaliacaoChannel = await client.channels.fetch(CANAL_AVALIACOES_ID).catch(() => null);
                if (avaliacaoChannel) {
                    const embed = Features.createRatingEmbed(
                        interaction.user.id,
                        interaction.user.username,
                        rating,
                        comment
                    );
                    await avaliacaoChannel.send({ embeds: [embed] });
                }

                // Responder ao usuário
                const successEmbed = Features.createSuccessEmbed(
                    'Avaliação Enviada',
                    `Obrigado por avaliar a Flash Store!\n\n⭐ Sua nota: ${rating}/5`
                );

                return interaction.reply({
                    embeds: [successEmbed],
                    ephemeral: true
                });
            }


            // Painel Principal da Loja
            if (interaction.commandName === 'painel-dash') {
                const totalClientes = new Set(db.sales.map(s => s.clienteId)).size;
                const totalVendas = db.sales.length;
                const totalRecuperado = db.sales.reduce((acc, s) => acc + (s.valor || 0), 0);
                const avgRating = Features.getAverageRating(db.ratings);
                const monthlyProgress = Features.getMonthlyProgress(db);

                const progressBar = Features.createProgressBar(monthlyProgress.current, monthlyProgress.goal);

                const embed = new EmbedBuilder()
                    .setColor('#8A2BE2')
                    .setTitle('⚡ FLASH STORE — PAINEL PRINCIPAL')
                    .setDescription(`
🟢 **Bot Status:** Online

👥 **Clientes Atendidos:** ${totalClientes}

🛒 **Vendas Realizadas:** ${totalVendas}

💰 **Receita Total:** R$ ${totalRecuperado.toFixed(2)}

⭐ **Avaliação Média:** ${avgRating}/5

🎯 **Meta do Mês:** ${progressBar} ${monthlyProgress.percentage}%
(${monthlyProgress.current}/${monthlyProgress.goal} vendas)

⚠️ **Limite de Estoque Baixo:** ${db.settings?.low_stock_threshold || config.LIMITS.LOW_STOCK_THRESHOLD} unidades

📊 **Receita Mensal:** R$ ${monthlyProgress.revenue.toFixed(2)}
`)
                    .setFooter({ text: 'Flash Store • Dashboard' })
                    .setTimestamp();

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            // Sistema de Backup
            if (interaction.commandName === 'backup') {
                if (!podeGerenciarTicket(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Apenas administradores podem usar este comando.',
                        ephemeral: true
                    });
                }

                const sub = interaction.options.getSubcommand();

                if (sub === 'criar') {
                    await interaction.deferReply({ flags: 64 });
                    const filename = Features.createBackup(db);
                    
                    const successEmbed = Features.createSuccessEmbed(
                        'Backup Criado',
                        `Arquivo: \`${filename}\``
                    );

                    return interaction.editReply({ embeds: [successEmbed] });
                }

                if (sub === 'listar') {
                    const backups = Features.listBackups();
                    const backupList = backups.length > 0 
                        ? backups.slice(0, 10).map((b, i) => `${i + 1}. \`${b}\``).join('\n')
                        : 'Nenhum backup disponível';

                    const embed = Features.createInfoEmbed(
                        'Backups Disponíveis',
                        `${backupList}\n\n*Mostrando os 10 mais recentes*`
                    );

                    return interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }

                if (sub === 'restaurar') {
                    const filename = interaction.options.getString('arquivo');
                    const restoredData = Features.restoreBackup(filename);

                    if (!restoredData) {
                        const errorEmbed = Features.createErrorEmbed(
                            'Erro ao Restaurar',
                            `Backup \`${filename}\` não encontrado.`
                        );
                        return interaction.reply({
                            embeds: [errorEmbed],
                            ephemeral: true
                        });
                    }

                    Object.assign(db, restoredData);
                    saveDB();

                    const successEmbed = Features.createSuccessEmbed(
                        'Backup Restaurado',
                        `Dados restaurados de \`${filename}\``
                    );

                    return interaction.reply({
                        embeds: [successEmbed],
                        ephemeral: true
                    });
                }
            }

            // Configuração Anti-Spam
            if (interaction.commandName === 'config-spam') {
                if (!podeGerenciarTicket(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Apenas administradores podem usar este comando.',
                        ephemeral: true
                    });
                }

                const sub = interaction.options.getSubcommand();

                if (sub === 'reset') {
                    const user = interaction.options.getUser('usuario');
                    if (db.spam_warnings[user.id]) {
                        delete db.spam_warnings[user.id];
                        saveDB();
                    }

                    const successEmbed = Features.createSuccessEmbed(
                        'Avisos Resetados',
                        `Os avisos de ${user} foram resetados.`
                    );

                    return interaction.reply({
                        embeds: [successEmbed],
                        ephemeral: true
                    });
                }
            }

            // Configuração de Estoque
            if (interaction.commandName === 'config-estoque') {
                if (!podeGerenciarTicket(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Apenas administradores podem usar este comando.',
                        ephemeral: true
                    });
                }

                const sub = interaction.options.getSubcommand();
                if (sub === 'limiar') {
                    const quantidade = interaction.options.getInteger('quantidade');
                    if (quantidade <= 0) {
                        return interaction.reply({
                            content: '❌ O limite deve ser maior que 0.',
                            ephemeral: true
                        });
                    }

                    db.settings = db.settings || {};
                    db.settings.low_stock_threshold = quantidade;
                    saveDB();

                    const successEmbed = Features.createSuccessEmbed(
                        'Limite de Estoque Atualizado',
                        `O novo limite de estoque baixo foi definido para **${quantidade}** unidades.`
                    );

                    return interaction.reply({
                        embeds: [successEmbed],
                        ephemeral: true
                    });
                }
            }

            // Sistema de Metas
            if (interaction.commandName === 'metas') {
                const sub = interaction.options.getSubcommand();

                if (sub === 'ver') {
                    const monthlyProgress = Features.getMonthlyProgress(db);
                    const progressBar = Features.createProgressBar(monthlyProgress.current, monthlyProgress.goal);

                    const embed = new EmbedBuilder()
                        .setColor('#8A2BE2')
                        .setTitle('🎯 META DO MÊS')
                        .setDescription(`
Meta: ${monthlyProgress.goal} vendas

Progresso:
${progressBar}

${monthlyProgress.percentage}%

${monthlyProgress.current}/${monthlyProgress.goal} vendas

💰 Receita: R$ ${monthlyProgress.revenue.toFixed(2)}
`)
                        .setFooter({ text: 'Flash Store • Metas' })
                        .setTimestamp();

                    return interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }

                if (sub === 'definir') {
                    if (!podeGerenciarTicket(interaction.member)) {
                        return interaction.reply({
                            content: '❌ Apenas administradores podem usar este comando.',
                            ephemeral: true
                        });
                    }

                    const goal = interaction.options.getInteger('vendas');
                    Features.initMonthlyStats(db);
                    
                    const now = new Date();
                    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
                    
                    if (!db.monthly_stats[monthKey]) {
                        db.monthly_stats[monthKey] = {
                            month: now.getMonth(),
                            year: now.getFullYear(),
                            goal,
                            sales: 0,
                            revenue: 0,
                            createdAt: new Date().toISOString()
                        };
                    } else {
                        db.monthly_stats[monthKey].goal = goal;
                    }

                    saveDB();

                    const successEmbed = Features.createSuccessEmbed(
                        'Meta Definida',
                        `Nova meta: ${goal} vendas`
                    );

                    return interaction.reply({
                        embeds: [successEmbed],
                        ephemeral: true
                    });
                }
            }

            // Sistema de Níveis
            if (interaction.commandName === 'niveis') {
                const sub = interaction.options.getSubcommand();

                if (sub === 'meu-nivel') {
                    const userPurchases = db.sales.filter(s => s.clienteId === interaction.user.id).length;
                    const levelInfo = Features.updateCustomerLevel(
                        db,
                        interaction.user.id,
                        interaction.user.username
                    );

                    const embed = new EmbedBuilder()
                        .setColor(levelInfo.color)
                        .setTitle(`${levelInfo.emoji} Seu Nível: ${levelInfo.level}`)
                        .setDescription(`
👤 **Usuário:** ${interaction.user}

🛒 **Compras:** ${userPurchases}

💎 **Nível Atual:** ${levelInfo.level}

**Próximo nível em:**
${levelInfo.level === 'Lendário' ? '🏆 Você atingiu o máximo!' : `${getNextLevelThreshold(userPurchases) - userPurchases} compras`}
`)
                        .setFooter({ text: 'Flash Store • Sistema de Níveis' })
                        .setTimestamp();

                    return interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }

                if (sub === 'ranking') {
                    // Construir ranking de níveis
                    const ranking = Object.values(db.customer_levels)
                        .sort((a, b) => b.purchases - a.purchases)
                        .slice(0, 10);

                    const rankingText = ranking.length > 0
                        ? ranking.map((entry, i) => 
                            `${i + 1}. <@${entry.userId}> - ${entry.level} (${entry.purchases} compras)`
                          ).join('\n')
                        : 'Nenhum cliente registrado ainda';

                    const embed = new EmbedBuilder()
                        .setColor('#FFD700')
                        .setTitle('🏆 RANKING DE CLIENTES')
                        .setDescription(rankingText)
                        .setFooter({ text: 'Flash Store • Top 10' })
                        .setTimestamp();

                    return interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'tipo_ticket') {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ ephemeral: true });
                }

                const tipo = interaction.values[0];
                const ticketPrefix = tipo === 'suporte' ? 'suporte' : 'receber';
                const ticketLabel = tipo === 'suporte' ? 'Suporte' : 'Receber produto';
                const existingTicket = interaction.guild.channels.cache.find(
                    canal => [
                        `ticket-${interaction.user.id}`,
                        `suporte-${interaction.user.id}`,
                        `receber-${interaction.user.id}`
                    ].includes(canal.name)
                );

                if (existingTicket) {
                    return interaction.editReply({
                        content: `❌ Você já possui um ticket aberto: ${existingTicket}`
                    });
                }

                const canal = await utils.createTicketChannel(
                    interaction.guild,
                    `${ticketPrefix}-${interaction.user.id}`,
                    interaction.user.id
                );

                const ticketEntry = {
                    id: canal.id,
                    canal: canal.name,
                    cliente: interaction.user.username,
                    clienteId: interaction.user.id,
                    status: 'aberto',
                    responsavel: null,
                    tipo: tipo,
                    criadoEm: new Date().toISOString()
                };

                db.tickets.unshift(ticketEntry);
                saveDB();

                void sendLog(
                    '🎫 Ticket criado',
                    `**Cliente:** ${interaction.user.username}\n**Canal:** ${canal.name}\n**Tipo:** ${ticketLabel}`,
                    '#8A2BE2'
                );

                const botoes = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('assumir_ticket')
                        .setLabel('🎟️ Assumir Ticket')
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId('notificar_suporte')
                        .setLabel('🔔 Notificar Equipe')
                        .setStyle(ButtonStyle.Secondary),

                    new ButtonBuilder()
                        .setCustomId('fechar_ticket')
                        .setLabel('🔒 Fechar Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

                const ticketEmbed = new EmbedBuilder()
                    .setColor('#8A2BE2')
                    .setTitle(`🎫 Ticket de ${ticketLabel}`)
                    .setDescription(`
Olá ${interaction.user}!

Seu ticket foi criado com sucesso.

📌 Tipo: **${ticketLabel}**

${tipo === 'suporte' ? 'Descreva sua dúvida ou problema com o máximo de detalhes possível.' : 'Envie o comprovante do pedido e as informações necessárias para receber seu produto.'}

⏳ Aguarde o atendimento da equipe.

⚡ Flash Store
`)
                    .setFooter({ text: 'Flash Store • Suporte' });

                await canal.send({
                    content: `${interaction.user}

<@&${SUPORTE_ROLE_ID}>
<@&${CARGO_EXTRA_1_ID}>
<@&${CARGO_EXTRA_2_ID}>`,
                    embeds: [ticketEmbed],
                    components: [botoes]
                });

                return interaction.editReply({
                    content: `✅ Ticket criado com sucesso: ${canal}`
                });
            }

            if (interaction.customId === 'selecionar_produto') {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ flags: 64 });
                }

                const produtoKey = interaction.values[0];
                const produtoEscolhido = PRODUTOS[produtoKey];

                if (!produtoEscolhido) {
                    return interaction.editReply({
                        content: '❌ Produto inválido. Tente novamente.'
                    });
                }

                const estoqueDisponivel = produtoEscolhido.estoque();
                if (estoqueDisponivel <= 0) {
                    return interaction.editReply({
                        content: `❌ O produto **${produtoEscolhido.nome}** está sem estoque no momento. Por favor escolha outro produto ou tente mais tarde.`
                    });
                }

                const canal = await utils.createTicketChannel(
                    interaction.guild,
                    `compra-${interaction.user.id}`,
                    interaction.user.id
                );

                const ticketEntry = {
                    id: canal.id,
                    canal: canal.name,
                    cliente: interaction.user.username,
                    clienteId: interaction.user.id,
                    status: 'aberto',
                    responsavel: null,
                    pedido: {
                        produto: normalizeName(produtoEscolhido.nome),
                        produtoNome: produtoEscolhido.nome,
                        quantidade: 1,
                        valor: produtoEscolhido.preco
                    },
                    criadoEm: new Date().toISOString()
                };

                db.tickets.unshift(ticketEntry);
                saveDB();

                const botoes = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('pix')
                        .setLabel('💳 PIX')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('cancelar_compra')
                        .setLabel('❌ Cancelar')
                        .setStyle(ButtonStyle.Danger)
                );

                const embed = new EmbedBuilder()
                    .setColor('#8A2BE2')
                    .setTitle('🛒 Carrinho')
                    .setDescription(`
👤 Cliente: ${interaction.user}

📦 Produto: ${produtoEscolhido.nome}

💰 Valor: R$ ${produtoEscolhido.preco.toFixed(2)}

📊 Estoque: ${estoqueDisponivel}

Revise seu pedido.

Após o pagamento:
• envie o comprovante neste canal;
• abra um ticket para receber seu produto.
`);

                await canal.send({
                    embeds: [embed],
                    components: [botoes]
                });

                return interaction.editReply({
                    content: `✅ Compra iniciada: ${canal}`
                });
            }
        }
        if (interaction.isButton()) {
            if (interaction.customId === 'pix') {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ flags: 64 });
                }

                const paymentButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('mostrar_chave_pix')
                        .setLabel('🔑 Mostrar chave PIX')
                        .setStyle(ButtonStyle.Primary)
                );

                const embed = new EmbedBuilder()
                    .setColor('#8A2BE2')
                    .setTitle('💳 Pagamento PIX')
                    .setDescription(`
⚡ Flash Store

Escolha uma opção:

🔑 Mostrar chave PIX
`);

                return interaction.editReply({ embeds: [embed], components: [paymentButtons] });
            }

            if (interaction.customId === 'mostrar_chave_pix') {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ flags: 64 });
                }

                const embed = new EmbedBuilder()
                    .setColor('#8A2BE2')
                    .setTitle('🔑 Chave PIX')
                    .setDescription('`13996091985`');

                return interaction.editReply({ embeds: [embed] });
            }


            if (interaction.customId === 'cancelar_compra') {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ flags: 64 });
                }

                await interaction.editReply({
                    content: '❌ Compra cancelada.'
                });

                setTimeout(() => {
                    interaction.channel.delete();
                }, 3000);
            }
            if (interaction.customId === 'criar_ticket') {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply({ ephemeral: true });
                }

                const tipoMenu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('tipo_ticket')
                        .setPlaceholder('Escolha o tipo de atendimento')
                        .addOptions([
                            {
                                label: 'Receber produto',
                                value: 'receber_produto',
                                description: 'Abrir ticket para confirmar entrega ou envio de pedido',
                                emoji: '📦'
                            },
                            {
                                label: 'Suporte',
                                value: 'suporte',
                                description: 'Abrir ticket para dúvidas, problemas ou ajuda técnica',
                                emoji: '🛠️'
                            }
                        ])
                );

                const embed = new EmbedBuilder()
                    .setColor('#8A2BE2')
                    .setTitle('🎫 Central de Atendimento')
                    .setDescription(`
Escolha o tipo de atendimento desejado:

• **Receber produto** — envie comprovante e acompanhe a entrega do pedido.
• **Suporte** — tire dúvidas ou solicite ajuda da equipe.
`);

                return interaction.editReply({
                    embeds: [embed],
                    components: [tipoMenu]
                });
            }
            if (interaction.customId === 'comprar_nitro_mensal' || interaction.customId === 'comprar_nitro_trimestral' || interaction.customId === 'comprar_nitro_anual' || interaction.customId === 'comprar_nitro_link_1mes' || interaction.customId === 'comprar_link_3_meses' || interaction.customId === 'comprar_impulso_2x1' || interaction.customId === 'comprar_impulso_8x1' || interaction.customId === 'comprar_impulso_14x1') {
                await interaction.deferReply({ ephemeral: true });
                const produtoIdMap = {
                    comprar_nitro_mensal: 'nitro_mensal',
                    comprar_nitro_trimestral: 'nitro_trimestral',
                    comprar_nitro_anual: 'nitro_anual',
                    comprar_nitro_link_1mes: 'nitro_link_1mes',
                    comprar_link_3_meses: 'link_3_meses',
                    comprar_impulso_2x1: 'impulso_2x1',
                    comprar_impulso_8x1: 'impulso_8x1',
                    comprar_impulso_14x1: 'impulso_14x1'
                };
                const produtoKey = produtoIdMap[interaction.customId];
                const produtoEscolhido = PRODUTOS[produtoKey];

                if (!produtoEscolhido) {
                    return interaction.editReply({
                        content: '❌ Produto inválido. Tente novamente.'
                    });
                }

                const estoqueDisponivel = produtoEscolhido.estoque();
                if (estoqueDisponivel <= 0) {
                    return interaction.editReply({
                        content: `❌ O produto **${produtoEscolhido.nome}** está sem estoque no momento. Por favor escolha outro produto ou tente mais tarde.`
                    });
                }

                const canal = await utils.createTicketChannel(
                    interaction.guild,
                    `compra-${interaction.user.id}`,
                    interaction.user.id
                );

                const ticketEntry = {
                    id: canal.id,
                    canal: canal.name,
                    cliente: interaction.user.username,
                    clienteId: interaction.user.id,
                    status: 'aberto',
                    responsavel: null,
                    pedido: {
                        produto: normalizeName(produtoEscolhido.nome),
                        produtoNome: produtoEscolhido.nome,
                        quantidade: 1,
                        valor: produtoEscolhido.preco
                    },
                    criadoEm: new Date().toISOString()
                };

                db.tickets.unshift(ticketEntry);
                saveDB();

                const botoes = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('pix')
                        .setLabel('💳 PIX')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('cancelar_compra')
                        .setLabel('❌ Cancelar')
                        .setStyle(ButtonStyle.Danger)
                );

                const embed = new EmbedBuilder()
                    .setColor('#8A2BE2')
                    .setTitle('🛒 Carrinho')
                    .setDescription(`
👤 Cliente: ${interaction.user}

📦 Produto: ${produtoEscolhido.nome}

Valor: R$ ${produtoEscolhido.preco.toFixed(2)}

Revise seu pedido.

Após o pagamento:
• envie o comprovante neste canal;
• abra um ticket para receber seu produto.
`);

                await canal.send({
                    embeds: [embed],
                    components: [botoes]
                });

                return interaction.editReply({
                    content: `✅ Compra iniciada: ${canal}`
                });
            }

            if (interaction.customId === 'assumir_ticket') {
                if (!podeGerenciarTicket(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Apenas a equipe autorizada pode assumir tickets.',
                        ephemeral: true
                    });
                }

                const ticket = db.tickets.find(t => t.id === interaction.channel.id);
                if (ticket) {
                    ticket.status = 'em_andamento';
                    ticket.responsavel = interaction.user.username;
                    saveDB();
                }

                void sendLog(
                    '🎟️ Ticket assumido',
                    `**Responsável:** ${interaction.user.username}\n**Canal:** ${interaction.channel.name}`,
                    '#22C55E'
                );

                return interaction.reply({
                    content: `🎟️ Ticket assumido por ${interaction.user}!`
                });
            }

            if (interaction.customId === 'notificar_suporte') {
                void sendLog(
                    '🔔 Equipe notificada',
                    `**Canal:** ${interaction.channel.name}\n**Autor:** ${interaction.user.username}`,
                    '#F59E0B'
                );

                return interaction.reply({
                    content: `🔔 <@&${SUPORTE_ROLE_ID}> o cliente está aguardando atendimento!`
                });
            }

            if (interaction.customId === 'fechar_ticket') {
                if (!podeGerenciarTicket(interaction.member)) {
                    return interaction.reply({
                        content: '❌ Apenas a equipe autorizada pode fechar tickets.',
                        ephemeral: true
                    });
                }

                const ticket = db.tickets.find(t => t.id === interaction.channel.id);
                if (ticket) {
                    ticket.status = 'fechado';
                    ticket.fechadoPor = interaction.user.username;
                    ticket.fechadoEm = new Date().toISOString();
                    saveDB();
                }

                void sendLog(
                    '🔒 Ticket fechado',
                    `**Fechado por:** ${interaction.user.username}\n**Canal:** ${interaction.channel.name}`,
                    '#EF4444'
                );

                await interaction.reply({
                    content: '🔒 Fechando ticket em 5 segundos...'
                });

                setTimeout(async () => {
                    try {
                        await interaction.channel.delete();
                    } catch (err) {
                        console.error(err);
                    }
                }, 5000);
            }
        }
    } catch (error) {
        utils.handleError(error, `InteractionCreate - ${interaction?.commandName || interaction?.customId}`);

        const isUnknownInteraction = error?.code === 10062 || String(error?.message || '').includes('Unknown interaction');
        if (isUnknownInteraction) return;
        if (interaction?.deferred || interaction?.replied) return;

        try {
            const errorEmbed = utils.createErrorEmbed(
                'Erro ao Processar',
                'Ocorreu um erro ao processar sua ação. Tente novamente mais tarde.'
            );
            
            await interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        } catch (replyError) {
            if (replyError?.code === 10062 || String(replyError?.message || '').includes('Unknown interaction')) {
                return;
            }
            console.error('[InteractionCreate] falha ao enviar mensagem de erro:', replyError);
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (!db.settings?.bot_enabled) return;
    if (message.author.bot) return;
    if (message.channel.id !== STOCK_MESSAGE_CHANNEL_ID) return;

    const text = String(message.content || '').trim();
    if (!text.toLowerCase().startsWith('adicionando estoque')) return;

    const extra = text.slice('adicionando estoque'.length).trim();
    const aviso = extra ? `✅ Estoque reabastecido para ${extra}.` : '✅ Estoque reabastecido.';

    try {
        let targetChannel = client.channels.cache.get(STOCK_CONFIRM_CHANNEL_ID);
        if (!targetChannel) {
            targetChannel = await client.channels.fetch(STOCK_CONFIRM_CHANNEL_ID).catch(() => null);
        }

        if (!targetChannel || typeof targetChannel.send !== 'function') {
            console.error('Canal de confirmação de estoque inválido:', STOCK_CONFIRM_CHANNEL_ID);
            return;
        }

        await targetChannel.send({ content: aviso });
    } catch (error) {
        console.error('Erro ao enviar aviso de estoque:', error);
    }
});

// ===== SISTEMAS DE MONITORAMENTO =====

/**
 * Sistema de Backup Automático
 * Executa a cada 6 horas e à meia-noite
 */
function setupAutoBackup() {
    // Backup à meia-noite
    function checkMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        
        const timeUntilMidnight = midnight - now;
        
        setTimeout(() => {
            try {
                Features.createBackup(db);
                console.log('✅ Backup automático executado (meia-noite)');
            } catch (error) {
                utils.handleError(error, 'Backup Automático (meia-noite)');
            }
            checkMidnight();
        }, timeUntilMidnight);
    }
    
    // Backup a cada 6 horas
    setInterval(() => {
        try {
            Features.createBackup(db);
            console.log('✅ Backup automático executado (6 horas)');
        } catch (error) {
            utils.handleError(error, 'Backup Automático (6 horas)');
        }
    }, config.TIMERS.AUTO_BACKUP_INTERVAL);
    
    checkMidnight();
    console.log('✅ Sistema de backup automático iniciado');
}

/**
 * Sistema de Monitoramento de Estoque Baixo
 * Verifica a cada 5 minutos se há produtos com baixo estoque
 */
function setupLowStockMonitoring() {
    setInterval(async () => {
        try {
            const threshold = db.settings?.low_stock_threshold || config.LIMITS.LOW_STOCK_THRESHOLD;
            const lowStockProducts = Object.values(db.stock).filter(product => 
                product.quantidade > 0 && product.quantidade < threshold
            );
            
            if (lowStockProducts.length > 0) {
                const stockAlertChannel = await client.channels.fetch(config.CHANNELS.STOCK_CONFIRM).catch(() => null);
                
                if (stockAlertChannel) {
                    for (const product of lowStockProducts) {
                        // Enviar apenas uma vez por dia
                        if (!product.lastAlertSent || 
                            Date.now() - new Date(product.lastAlertSent).getTime() > config.LIMITS.ALERT_COOLDOWN) {
                            
                            const embed = utils.createWarningEmbed(
                                'ALERTA DE ESTOQUE',
                                `📦 **Produto:** ${product.nome}\n\n📉 **Quantidade restante:** ${product.quantidade}\n\n⚠️ Recomendamos reabastecer o estoque.`
                            );
                            
                            await stockAlertChannel.send({ embeds: [embed] });
                            product.lastAlertSent = new Date().toISOString();
                            saveDB();
                        }
                    }
                }
            }
        } catch (error) {
            utils.handleError(error, 'setupLowStockMonitoring');
        }
    }, config.TIMERS.LOW_STOCK_CHECK);
    
    console.log('✅ Sistema de monitoramento de estoque iniciado');
}

/**
 * Sistema de Lembretes Automáticos
 * Verifica a cada hora se há lembretes para enviar
 */
function setupReminderSystem() {
    setInterval(async () => {
        try {
            const now = Date.now();
            const remindersToSend = db.reminders.filter(reminder => 
                !reminder.reminded && 
                new Date(reminder.reminderDate).getTime() <= now
            );
            
            for (const reminder of remindersToSend) {
                try {
                    const user = await client.users.fetch(reminder.userId).catch(() => null);
                    
                    if (user) {
                        const daysLeft = Math.ceil(
                            (new Date(reminder.expiryDate).getTime() - now) / (24 * 60 * 60 * 1000)
                        );
                        
                        const embed = Features.createReminderEmbed(reminder.productName, daysLeft);
                        await user.send({ embeds: [embed] }).catch(() => null);
                    }
                    
                    reminder.reminded = true;
                } catch (error) {
                    utils.handleError(error, 'setupReminderSystem - envio de lembrete');
                }
            }
            
            if (remindersToSend.length > 0) {
                saveDB();
                console.log(`✅ ${remindersToSend.length} lembrete(s) enviado(s)`);
            }
        } catch (error) {
            utils.handleError(error, 'setupReminderSystem');
        }
    }, config.TIMERS.REMINDER_CHECK);
    
    console.log('✅ Sistema de lembretes automáticos iniciado');
}

/**
 * Inicializa todas as features
 */
client.on(Events.ClientReady, () => {
    Features.initBackupDir();
    Features.ensureDBStructure(db);

    setupAutoBackup();
    setupLowStockMonitoring();
    setupReminderSystem();

    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.login(process.env.TOKEN);