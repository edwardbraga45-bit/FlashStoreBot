/**
 * 📦 Sistema de Funcionalidades da Flash Store
 * Módulo com features adicionais e utilitários
 */

const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const config = require('./config');

const BACKUP_DIR = path.join(__dirname, 'backups');
const BACKUP_FILE_PATTERN = /backup_(\d+)_(\d+)_(\d+)_(\d+)-(\d+)-(\d+)\.json/;

// ===== INICIALIZAÇÃO =====

/**
 * Inicializa o diretório de backups
 */
function initBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}

/**
 * Garante que o banco de dados contém todos os campos necessários
 */
function ensureDBStructure(db) {
    if (!db.ratings) db.ratings = [];
    if (!db.spam_warnings) db.spam_warnings = {};
    if (!db.reminders) db.reminders = [];
    if (!db.ticket_stats) db.ticket_stats = {};
    if (!db.customer_levels) db.customer_levels = {};
    if (!db.monthly_stats) db.monthly_stats = { month: new Date().getMonth(), goals: {} };
    if (!db.settings) db.settings = {};
    if (!db.settings.low_stock_threshold) db.settings.low_stock_threshold = config.LIMITS.LOW_STOCK_THRESHOLD;
    return db;
}

// ===== SISTEMA DE AVALIAÇÕES =====

/**
 * Adiciona uma nova avaliação ao banco de dados
 */
function addRating(userId, userName, rating, comment) {
    return {
        userId,
        userName,
        rating: Math.min(5, Math.max(1, rating)),
        comment: comment || '',
        date: new Date().toISOString()
    };
}

/**
 * Cria embed de avaliação para enviar ao canal
 */
function createRatingEmbed(userId, userName, rating, comment) {
    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    
    const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('⭐ Nova Avaliação')
        .setDescription(`
👤 **Cliente:** <@${userId}>
⭐ **Nota:** ${rating}/5 ${stars}
${comment ? `💬 **Comentário:** ${comment}` : ''}

Obrigado por comprar na **Flash Store**!
`)
        .setFooter({ text: 'Flash Store • Sistema de Avaliações' })
        .setTimestamp();
    
    return embed;
}

/**
 * Calcula a avaliação média de todos os clientes
 */
function getAverageRating(ratings) {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(2);
}

// ===== SISTEMA DE BACKUP =====

/**
 * Cria um backup do banco de dados
 */
function createBackup(db) {
    initBackupDir();
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `backup_${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(db, null, 2), 'utf8');
    
    console.log(`✅ Backup criado: ${filename}`);
    cleanOldBackups();
    
    return filename;
}

/**
 * Remove backups antigos (mantém apenas os últimos 30)
 */
function cleanOldBackups() {
    initBackupDir();
    
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => BACKUP_FILE_PATTERN.test(f))
        .sort()
        .reverse();
    
    if (files.length > 30) {
        const filesToDelete = files.slice(30);
        filesToDelete.forEach(file => {
            fs.unlinkSync(path.join(BACKUP_DIR, file));
            console.log(`🗑️ Backup antigo removido: ${file}`);
        });
    }
}

/**
 * Restaura um backup a partir de um arquivo
 */
function restoreBackup(filename) {
    const filepath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
        return null;
    }
    
    try {
        const data = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        return null;
    }
}

/**
 * Lista todos os backups disponíveis
 */
function listBackups() {
    initBackupDir();
    
    return fs.readdirSync(BACKUP_DIR)
        .filter(f => BACKUP_FILE_PATTERN.test(f))
        .sort()
        .reverse();
}

// ===== SISTEMA ANTI-SPAM =====

/**
 * Registra uma ação do usuário para detecção de spam
 */
function registerUserAction(userId) {
    const now = Date.now();
    const timeWindow = 10000; // 10 segundos
    
    return { userId, timestamp: now, timeWindow };
}

/**
 * Verifica se o usuário está fazendo spam
 */
function isSpamming(userId, recentActions, threshold = 5) {
    const now = Date.now();
    const timeWindow = 10000; // 10 segundos
    
    const userActions = recentActions.filter(action => 
        action.userId === userId && 
        (now - action.timestamp) < timeWindow
    );
    
    return userActions.length >= threshold;
}

/**
 * Adiciona aviso de spam
 */
function addSpamWarning(userId) {
    return {
        userId,
        warnings: 1,
        timestamp: Date.now(),
        lastWarningTime: Date.now()
    };
}

// ===== SISTEMA DE LEMBRETES =====

/**
 * Cria um lembrete para o usuário
 */
function createReminder(userId, productName, expiryDate, reminderDaysBefore) {
    const reminderDate = new Date(expiryDate);
    reminderDate.setDate(reminderDate.getDate() - reminderDaysBefore);
    
    return {
        userId,
        productName,
        expiryDate: new Date(expiryDate).toISOString(),
        reminderDate: reminderDate.toISOString(),
        reminded: false,
        createdAt: new Date().toISOString()
    };
}

/**
 * Cria embed de lembrete
 */
function createReminderEmbed(productName, daysLeft) {
    return new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('⏰ Lembrete de Expiração')
        .setDescription(`
📦 **Produto:** ${productName}

⏰ **Seu ${productName} expira em ${daysLeft} dia(s).**

Renovar agora para não perder acesso!
`)
        .setFooter({ text: 'Flash Store • Lembretes' })
        .setTimestamp();
}

// ===== SISTEMA DE NÍVEIS =====

/**
 * Calcula o nível do cliente baseado no número de compras
 */
function getCustomerLevel(purchaseCount) {
    if (purchaseCount >= 50) return { level: 'Lendário', emoji: '👑', color: '#FF1493' };
    if (purchaseCount >= 25) return { level: 'Diamante', emoji: '💎', color: '#00FFFF' };
    if (purchaseCount >= 10) return { level: 'Ouro', emoji: '🥇', color: '#FFD700' };
    if (purchaseCount >= 5) return { level: 'Prata', emoji: '🥈', color: '#C0C0C0' };
    if (purchaseCount >= 1) return { level: 'Bronze', emoji: '🥉', color: '#CD7F32' };
    return { level: 'Novato', emoji: '📍', color: '#808080' };
}

/**
 * Atualiza o nível do cliente
 */
function updateCustomerLevel(db, userId, userName) {
    const userSales = db.sales.filter(s => s.clienteId === userId).length;
    const levelInfo = getCustomerLevel(userSales);
    
    if (!db.customer_levels) db.customer_levels = {};
    
    db.customer_levels[userId] = {
        userId,
        userName,
        level: levelInfo.level,
        purchases: userSales,
        lastUpdated: new Date().toISOString()
    };
    
    return levelInfo;
}

// ===== SISTEMA DE CONTAGEM DE TICKETS =====

/**
 * Inicia o contador de um ticket
 */
function startTicketTimer(ticketId) {
    return {
        ticketId,
        startTime: Date.now(),
        startedAt: new Date().toISOString()
    };
}

/**
 * Calcula o tempo decorrido de um ticket
 */
function getTicketElapsedTime(startTime) {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}

/**
 * Formata tempo para exibição legível
 */
function formatElapsedTime(startTime) {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
}

// ===== EMBEDS PERSONALIZADAS =====

/**
 * Cria embed padrão da Flash Store
 */
function createFlashStoreEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle(`⚡ ${title}`)
        .setDescription(description)
        .setFooter({ text: 'Flash Store • Loja Digital' })
        .setTimestamp();
}

/**
 * Cria embed de sucesso
 */
function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setFooter({ text: 'Flash Store' })
        .setTimestamp();
}

/**
 * Cria embed de erro
 */
function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setFooter({ text: 'Flash Store' })
        .setTimestamp();
}

/**
 * Cria embed de informação
 */
function createInfoEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`ℹ️ ${title}`)
        .setDescription(description)
        .setFooter({ text: 'Flash Store' })
        .setTimestamp();
}

// ===== SISTEMA DE METAS MENSAIS =====

/**
 * Inicializa metas do mês
 */
function initMonthlyStats(db) {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    if (!db.monthly_stats) {
        db.monthly_stats = {};
    }
    
    const monthKey = `${year}-${month}`;
    
    if (!db.monthly_stats[monthKey]) {
        db.monthly_stats[monthKey] = {
            month,
            year,
            goal: 100,
            sales: 0,
            revenue: 0,
            createdAt: new Date().toISOString()
        };
    }
    
    return db.monthly_stats[monthKey];
}

/**
 * Calcula progresso da meta mensal
 */
function getMonthlyProgress(db) {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    
    if (!db.monthly_stats || !db.monthly_stats[monthKey]) {
        return { goal: 100, current: 0, percentage: 0 };
    }
    
    const stats = db.monthly_stats[monthKey];
    const percentage = Math.min(100, Math.round((stats.sales / stats.goal) * 100));
    
    return {
        goal: stats.goal,
        current: stats.sales,
        percentage,
        revenue: stats.revenue
    };
}

/**
 * Cria barra de progresso
 */
function createProgressBar(current, total, length = 10) {
    const filled = Math.round((current / total) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

// ===== LOGGING DE ERROS =====

/**
 * Registra um erro no arquivo de log
 */
function logError(error, context = '') {
    const logDir = path.join(__dirname, 'logs');
    
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${context}\n${error.stack || error.toString()}\n\n`;
    const logFile = path.join(logDir, `error_${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFileSync(logFile, logEntry, 'utf8');
    console.error(`❌ Erro registrado: ${error.message}`);
}

// ===== EXPORTAR FUNÇÕES =====

module.exports = {
    // Inicialização
    initBackupDir,
    ensureDBStructure,
    
    // Avaliações
    addRating,
    createRatingEmbed,
    getAverageRating,
    
    // Backup
    createBackup,
    cleanOldBackups,
    restoreBackup,
    listBackups,
    
    // Anti-Spam
    registerUserAction,
    isSpamming,
    addSpamWarning,
    
    // Lembretes
    createReminder,
    createReminderEmbed,
    
    // Níveis
    getCustomerLevel,
    updateCustomerLevel,
    
    // Tickets
    startTicketTimer,
    getTicketElapsedTime,
    formatElapsedTime,
    
    // Embeds
    createFlashStoreEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createInfoEmbed,
    
    // Metas Mensais
    initMonthlyStats,
    getMonthlyProgress,
    createProgressBar,
    
    // Logging
    logError
};
