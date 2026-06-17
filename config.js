/**
 * 📋 Configuração centralizada do FlashStoreBot
 * Todos os IDs e constantes devem estar aqui
 */

module.exports = {
    // ===== ROLES/CARGOS =====
    ROLES: {
        SUPPORT: '1515190727951519827',
        EXTRA_1: '1515852204680937553',
        EXTRA_2: '1514856496452735076'
    },

    // ===== CANAIS =====
    CHANNELS: {
        TICKETS_CATEGORY: '1514858352214282370',
        RULES: '1514858977026900050',
        TERMS: '1514858386825543801',
        LOGS: '1516262121841758289',
        STOCK_MESSAGE: '1516270527897927730',
        STOCK_CONFIRM: '1514858391963439114',
        NITRO_ACCOUNTS: '1514858411609554974',
        NITRO_LINK: '1514858405297262672',
        BOOSTS: '1514858415447609395',
        RATINGS: '1514858395319140412'
    },

    // ===== PAGAMENTO =====
    PAYMENT: {
        PIX_KEY: '13996091985'
    },

    // ===== BANCO DE DADOS =====
    DATABASE: {
        FILE: 'data.json',
        BACKUP_DIR: 'backups'
    },

    // ===== TIMEOUTS E INTERVALOS =====
    TIMERS: {
        LOW_STOCK_CHECK: 5 * 60 * 1000,      // 5 minutos
        AUTO_BACKUP_INTERVAL: 6 * 60 * 60 * 1000, // 6 horas
        REMINDER_CHECK: 60 * 60 * 1000,      // 1 hora
        TICKET_DELETE_DELAY: 5000             // 5 segundos
    },

    // ===== LIMITES =====
    LIMITS: {
        MAX_BACKUPS: 30,
        LOW_STOCK_THRESHOLD: 5,
        ALERT_COOLDOWN: 24 * 60 * 60 * 1000  // 24 horas
    }
};
