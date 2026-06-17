const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const BOT_FILE = path.join(__dirname, '../index.js');
const NODE_EXECUTABLE = process.execPath;
let botProcess = null;
let botStarting = false;

const DATA_FILE = path.join(__dirname, '../data.json');
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ===== HELPERS =====
function loadDatabase() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao carregar banco de dados:', error);
        return {
            stock: {},
            sales: [],
            coupons: [],
            tickets: [],
            ratings: [],
            customer_levels: {},
            monthly_stats: {},
            settings: {
                bot_enabled: true,
                low_stock_threshold: 5
            }
        };
    }
}

function saveDatabase(db) {
    try {
        const tmpFile = DATA_FILE + '.tmp';
        fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
        fs.renameSync(tmpFile, DATA_FILE);
        return true;
    } catch (error) {
        console.error('Erro ao salvar banco de dados:', error);
        return false;
    }
}

function isBotRunning() {
    return Boolean(botProcess && !botProcess.killed);
}

function startBotProcess() {
    if (isBotRunning() || botStarting) {
        return botProcess;
    }

    botStarting = true;
    const botCwd = path.dirname(BOT_FILE);
    botProcess = spawn(NODE_EXECUTABLE, [BOT_FILE], {
        cwd: botCwd,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    botProcess.stdout.on('data', chunk => {
        process.stdout.write(`[BOT] ${chunk}`);
    });

    botProcess.stderr.on('data', chunk => {
        process.stderr.write(`[BOT ERR] ${chunk}`);
    });

    botProcess.on('close', (code, signal) => {
        console.log(`Bot process finalizado com código ${code} e sinal ${signal}`);
        botProcess = null;
        botStarting = false;
    });

    botProcess.on('error', error => {
        console.error('Erro ao iniciar bot process:', error);
        botProcess = null;
        botStarting = false;
    });

    botStarting = false;
    return botProcess;
}

function stopBotProcess() {
    if (!isBotRunning()) return;
    botProcess.kill();
}

function formatCurrency(value) {
    return parseFloat(value) || 0;
}

function getStatsFromDB(db) {
    const totalRevenue = (db.sales || []).reduce((sum, sale) => sum + formatCurrency(sale.valor), 0);
    const totalProfit = (db.sales || []).reduce((sum, sale) => sum + formatCurrency(sale.lucro), 0);
    const totalSales = (db.sales || []).length;
    const customers = new Set((db.sales || []).map(s => s.clienteId)).size;
    const totalTickets = (db.tickets || []).length;
    const openTickets = (db.tickets || []).filter(ticket => ticket.status === 'aberto').length;
    const inStockItems = Object.values(db.stock || {}).filter(item => Number(item.quantidade || 0) > 0).length;
    const lowStockCount = Object.values(db.stock || {}).filter(item => Number(item.quantidade || 0) > 0 && Number(item.quantidade || 0) <= 5).length;

    const monthlyStats = db.monthly_stats || {};
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const currentSales = monthlyStats[currentMonthKey]?.sales ?? (db.sales || []).length;
    const monthlySalesGoal = 200;

    const topProducts = getTopProducts(db.sales || []);
    const dailySales = getDailySales(db.sales || []);

    return {
        totalRevenue,
        totalProfit,
        totalSales,
        totalCustomers: customers,
        totalTickets,
        openTickets,
        inStockItems,
        lowStockCount,
        currentSales,
        monthlySalesGoal,
        topProducts: {
            labels: topProducts.map(p => p.name),
            values: topProducts.map(p => p.count)
        },
        dailySales,
        botEnabled: db.settings?.bot_enabled ?? true,
        botRunning: isBotRunning()
    };
}

function getTopProducts(sales) {
    const products = {};
    
    sales.forEach(sale => {
        if (!products[sale.produto]) {
            products[sale.produto] = 0;
        }
        products[sale.produto] += sale.quantidade || 1;
    });

    return Object.entries(products)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
}

function getDailySales(sales) {
    const daily = {};
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('pt-BR');
        last7Days.push(dateStr);
        daily[dateStr] = 0;
    }

    sales.forEach(sale => {
        const saleDate = new Date(sale.data).toLocaleDateString('pt-BR');
        if (daily.hasOwnProperty(saleDate)) {
            daily[saleDate]++;
        }
    });

    return {
        labels: last7Days,
        values: last7Days.map(date => daily[date])
    };
}

function getCustomerLevels(db) {
    const levels = {
        'Ouro': 0,
        'Prata': 0,
        'Bronze': 0
    };

    Object.values(db.customer_levels || {}).forEach(customer => {
        if (levels.hasOwnProperty(customer.level)) {
            levels[customer.level]++;
        }
    });

    return levels;
}

function getRecentSales(db, limit = 50) {
    return (db.sales || []).slice(-limit).reverse();
}

function getRecentTickets(db, limit = 30) {
    return (db.tickets || []).slice(-limit).reverse();
}

function getStockSnapshot(db) {
    return Object.entries(db.stock || {}).map(([key, data]) => ({
        nome: data.nome || key,
        quantidade: data.quantidade || 0,
        vendido: data.vendido || 0,
        preco: data.preco || 0
    }));
}

function getCouponsSnapshot(db) {
    return db.coupons || [];
}

function getTopClients(db, limit = 20) {
    const clientesMap = {};
    (db.sales || []).forEach(sale => {
        const clientId = sale.clienteId || sale.cliente;
        if (!clientesMap[clientId]) {
            clientesMap[clientId] = { nome: sale.cliente, compras: 0, gastoTotal: 0, nivel: db.customer_levels?.[clientId]?.level || 'Bronze' };
        }
        clientesMap[clientId].compras++;
        clientesMap[clientId].gastoTotal += formatCurrency(sale.valor);
    });
    return Object.values(clientesMap).sort((a,b)=>b.gastoTotal-a.gastoTotal).slice(0, limit);
}

// ===== API ROUTES =====

// Status
app.get('/api/status', (req, res) => {
    const db = loadDatabase();
    res.json({ status: 'online', timestamp: new Date() });
});
// Stats Gerais
app.get('/api/stats', (req, res) => {
    const db = loadDatabase();
    res.json(getStatsFromDB(db));
});

// Vendas
app.get('/api/vendas', (req, res) => {
    const db = loadDatabase();
    const vendas = db.sales.slice(-50).reverse();
    
    res.json(vendas);
});

// Estoque
app.get('/api/estoque', (req, res) => {
    const db = loadDatabase();
    res.json(getStockSnapshot(db));
});

app.post('/api/estoque/adjust', (req, res) => {
    const { nome, delta } = req.body;
    if (typeof nome !== 'string' || typeof delta !== 'number') {
        return res.status(400).json({ error: 'Nome do produto e delta são obrigatórios.' });
    }

    const db = loadDatabase();
    const stockKey = Object.keys(db.stock || {}).find(key => key.toLowerCase() === nome.toLowerCase());

    if (!stockKey) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const item = db.stock[stockKey];
    item.quantidade = Math.max(0, Number(item.quantidade || 0) + delta);
    saveDatabase(db);

    const estoque = Object.entries(db.stock || {}).map(([nome, data]) => ({
        nome,
        quantidade: data.quantidade || 0,
        vendido: data.vendido || 0,
        preco: data.preco || 0
    }));

    broadcastUpdate('stats', getStatsFromDB(db));
    broadcastUpdate('estoque', estoque);

    res.json(estoque);
});

// Tickets
app.get('/api/tickets', (req, res) => {
    const db = loadDatabase();
    
    const tickets = (db.tickets || []).slice(-30).reverse();
    res.json(tickets);
});

// Cupons
app.get('/api/cupons', (req, res) => {
    const db = loadDatabase();
    
    const cupons = db.coupons || [];
    res.json(cupons);
});

// Controle do bot
app.get('/api/control', (req, res) => {
    const db = loadDatabase();
    res.json({
        botEnabled: db.settings?.bot_enabled ?? true,
        lowStockThreshold: db.settings?.low_stock_threshold ?? 5,
        botRunning: isBotRunning()
    });
});

app.post('/api/control', (req, res) => {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'O campo enabled deve ser booleano.' });
    }

    const db = loadDatabase();
    db.settings = db.settings || {};
    db.settings.bot_enabled = enabled;
    saveDatabase(db);

    broadcastUpdate('stats', getStatsFromDB(db));

    res.json({ botEnabled: enabled });
});

app.post('/api/bot', (req, res) => {
    const { action } = req.body;
    if (!action || !['start', 'stop'].includes(action)) {
        return res.status(400).json({ error: 'Ação inválida. Use start ou stop.' });
    }

    try {
        const db = loadDatabase();
        db.settings = db.settings || {};

        if (action === 'start') {
            startBotProcess();
            db.settings.bot_enabled = true;
        } else {
            stopBotProcess();
            db.settings.bot_enabled = false;
        }

        saveDatabase(db);
        broadcastUpdate('stats', getStatsFromDB(db));
        return res.json({ botRunning: isBotRunning(), botEnabled: db.settings.bot_enabled });
    } catch (error) {
        console.error('Falha ao controlar o bot:', error);
        return res.status(500).json({ error: 'Falha ao controlar o bot.' });
    }
});

// Clientes
app.get('/api/clientes', (req, res) => {
    const db = loadDatabase();
    
    // Agrupa vendas por cliente
    const clientesMap = {};
    
    db.sales.forEach(sale => {
        const clientId = sale.clienteId || sale.cliente;
        
        if (!clientesMap[clientId]) {
            clientesMap[clientId] = {
                nome: sale.cliente,
                compras: 0,
                gastoTotal: 0,
                nivel: db.customer_levels?.[clientId]?.level || 'Bronze'
            };
        }
        
        clientesMap[clientId].compras++;
        clientesMap[clientId].gastoTotal += formatCurrency(sale.valor);
    });

    const clientes = Object.values(clientesMap)
        .sort((a, b) => b.gastoTotal - a.gastoTotal)
        .slice(0, 20);

    res.json(clientes);
});

// ===== WEBSOCKET =====
wss.on('connection', (ws) => {
    console.log('WebSocket conectado');

    ws.on('close', () => {
        console.log('WebSocket desconectado');
    });
});

function broadcastUpdate(type, data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, data, timestamp: new Date() }));
        }
    });
}

// ===== MONITOR DATABASE CHANGES (debounced broadcast) =====
let broadcastTimeout = null;
const BROADCAST_DEBOUNCE_MS = 600;

fs.watchFile(DATA_FILE, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
        if (broadcastTimeout) clearTimeout(broadcastTimeout);
        broadcastTimeout = setTimeout(() => {
            const db = loadDatabase();
            // Send compact stats instead of entire DB for faster sync
            const stats = getStatsFromDB(db);
            broadcastUpdate('stats', stats);
            // partial updates for tables
            broadcastUpdate('vendas', getRecentSales(db, 50));
            broadcastUpdate('estoque', getStockSnapshot(db));
            broadcastUpdate('tickets', getRecentTickets(db, 30));
            broadcastUpdate('cupons', getCouponsSnapshot(db));
            broadcastUpdate('clientes', getTopClients(db, 20));
        }, BROADCAST_DEBOUNCE_MS);
    }
});

// ===== SERVER START =====
server.listen(PORT, () => {
    console.log(`🚀 Dashboard Backend rodando em http://localhost:${PORT}`);
});

module.exports = app;
