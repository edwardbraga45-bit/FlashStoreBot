/**
 * 🛠️ Utilitários e Helpers do FlashStoreBot
 * Funções reutilizáveis para evitar duplicação
 */

const { ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('./config');

/**
 * Validar e normalizar nome de produto
 * @param {string} name - Nome do produto
 * @returns {string} Nome normalizado
 */
function normalizeName(name) {
    return String(name).trim().toLowerCase();
}

/**
 * Validar valor monetário
 * @param {number} value - Valor a validar
 * @returns {boolean} Se é um valor válido
 */
function isValidPrice(value) {
    return typeof value === 'number' && value > 0 && value <= 99999.99;
}

/**
 * Validar quantidade
 * @param {number} quantity - Quantidade a validar
 * @returns {boolean} Se é uma quantidade válida
 */
function isValidQuantity(quantity) {
    return Number.isInteger(quantity) && quantity > 0 && quantity <= 999999;
}

/**
 * Criar permissões padrão para canal de ticket
 * @param {string} guildId - ID da guild
 * @param {string} userId - ID do usuário cliente
 * @param {string|string[]} roleIds - ID(s) dos cargos com acesso
 * @returns {Object[]} Array de permissionOverwrites
 */
function createTicketPermissions(guildId, userId, roleIds = []) {
    const permissions = [
        {
            id: guildId,
            deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
            id: userId,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory
            ]
        }
    ];

    // Adicionar permissões para cada cargo
    const rolesArray = Array.isArray(roleIds) ? roleIds : [roleIds];
    rolesArray.forEach(roleId => {
        permissions.push({
            id: roleId,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory
            ]
        });
    });

    return permissions;
}

/**
 * Criar um canal de ticket com permissões corretas
 * @param {Guild} guild - Guild do Discord
 * @param {string} channelName - Nome do canal
 * @param {string} userId - ID do cliente
 * @param {ChannelType} type - Tipo do canal
 * @returns {Promise<Channel>} Canal criado
 */
async function createTicketChannel(guild, channelName, userId, type = ChannelType.GuildText) {
    const category = guild.channels.cache.get(config.CHANNELS.TICKETS_CATEGORY);
    const categoryId = category?.type === ChannelType.GuildCategory ? category.id : undefined;

    const roleIds = [
        config.ROLES.SUPPORT,
        config.ROLES.EXTRA_1,
        config.ROLES.EXTRA_2
    ];

    const permissions = createTicketPermissions(guild.id, userId, roleIds);

    return guild.channels.create({
        name: channelName,
        type,
        parent: categoryId,
        permissionOverwrites: permissions
    });
}

/**
 * Formatar valor monetário
 * @param {number} value - Valor a formatar
 * @returns {string} Valor formatado (R$ X,XX)
 */
function formatPrice(value) {
    return `R$ ${Number(value).toFixed(2)}`.replace('.', ',');
}

/**
 * Formatar porcentagem
 * @param {number} percentage - Porcentagem
 * @returns {string} Porcentagem formatada
 */
function formatPercentage(percentage) {
    return `${Math.round(percentage * 10) / 10}%`;
}

/**
 * Criar barra de progresso visual
 * @param {number} current - Valor atual
 * @param {number} total - Valor total
 * @param {number} size - Tamanho da barra (padrão 20)
 * @returns {string} Barra de progresso
 */
function createProgressBar(current, total, size = 20) {
    if (total <= 0) return '█'.repeat(size);

    const percentage = Math.min(current / total, 1);
    const filled = Math.floor(percentage * size);
    const empty = size - filled;

    return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Criar embed padrão de sucesso
 * @param {string} title - Título
 * @param {string} description - Descrição
 * @returns {EmbedBuilder} Embed de sucesso
 */
function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#22C55E')
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Criar embed padrão de erro
 * @param {string} title - Título
 * @param {string} description - Descrição
 * @returns {EmbedBuilder} Embed de erro
 */
function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#EF4444')
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Criar embed padrão de informação
 * @param {string} title - Título
 * @param {string} description - Descrição
 * @returns {EmbedBuilder} Embed de informação
 */
function createInfoEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle(`ℹ️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Criar embed padrão de alerta
 * @param {string} title - Título
 * @param {string} description - Descrição
 * @returns {EmbedBuilder} Embed de alerta
 */
function createWarningEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#F59E0B')
        .setTitle(`⚠️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Validar se um usuário tem permissão para gerenciar (é suporte)
 * @param {GuildMember} member - Membro da guild
 * @returns {boolean} Se tem permissão
 */
function hasManagePermission(member) {
    if (!member) return false;

    const authorizedRoles = [
        config.ROLES.SUPPORT,
        config.ROLES.EXTRA_1,
        config.ROLES.EXTRA_2
    ];

    return authorizedRoles.some(roleId => member.roles.cache.has(roleId));
}

/**
 * Tratador de erro centralizado
 * @param {Error} error - Erro a tratar
 * @param {string} context - Contexto do erro (onde ocorreu)
 * @param {Function} logger - Função de log personalizada (opcional)
 */
function handleError(error, context, logger = console.error) {
    const timestamp = new Date().toISOString();
    logger(`[${timestamp}] Erro em "${context}":`, error.message);
    
    if (process.env.DEBUG) {
        logger(error.stack);
    }
}

module.exports = {
    normalizeName,
    isValidPrice,
    isValidQuantity,
    createTicketPermissions,
    createTicketChannel,
    formatPrice,
    formatPercentage,
    createProgressBar,
    createSuccessEmbed,
    createErrorEmbed,
    createInfoEmbed,
    createWarningEmbed,
    hasManagePermission,
    handleError
};
