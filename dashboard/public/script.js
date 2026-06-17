// ===== GLOBALS =====
const API_BASE = (() => {
    if (!location.origin || location.protocol === 'file:') {
        return 'http://localhost:3000/api';
    }
    return `${location.origin}/api`;
})();
let chartsInstances = {};
let wsConnection = null;
let currentPage = 'dashboard';

function initDashboard() {
    setupEventListeners();
    updateTime();
    switchPage(currentPage);
    loadDashboard();
    checkBotStatus();

    if (window.connectWS) {
        wsConnection = connectWS(handleWSMessageRouter);
    }

    setInterval(updateTime, 1000);
    setInterval(loadDashboard, 30000);
    setInterval(() => {
        if (currentPage === 'estoque') loadEstoque();
        if (currentPage === 'tickets') loadTickets();
    }, 30000);

    window.addEventListener('focus', () => {
        if (currentPage === 'estoque') loadEstoque();
        if (currentPage === 'tickets') loadTickets();
        loadDashboard();
    });
}

// ===== INITIALIZE =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const pageName = item.dataset.page;
            if (pageName) {
                currentPage = pageName;
                switchPage(pageName);
            }
        });
    });

    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });
    }

    const vendasSearch = document.getElementById('vendasSearch');
    if (vendasSearch) {
        vendasSearch.addEventListener('input', (e) => filterVendas(e.target.value));
    }

    const estoqueSearch = document.getElementById('estoqueSearch');
    if (estoqueSearch) {
        estoqueSearch.addEventListener('input', (e) => filterEstoque(e.target.value));
    }

    const botToggleButton = document.getElementById('botToggleButton');
    if (botToggleButton) {
        botToggleButton.addEventListener('click', toggleBotEnabled);
    }

    const botProcessButton = document.getElementById('botProcessToggleButton');
    if (botProcessButton) {
        botProcessButton.addEventListener('click', toggleBotProcess);
    }
}

function filterVendas(query) {
    query = (query || '').toLowerCase().trim();
    document.querySelectorAll('#vendasTable tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

function filterEstoque(query) {
    query = (query || '').toLowerCase().trim();
    document.querySelectorAll('#estoqueTable tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

// ===== PAGE SWITCHING =====
function switchPage(pageName) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const selectedNav = document.querySelector(`[data-page="${pageName}"]`);
    if (selectedNav) selectedNav.classList.add('active');

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const section = document.getElementById(`${pageName}-page`);
    if (section) section.classList.add('active');

    const titles = {
        dashboard: { title: 'Dashboard', subtitle: 'Bem-vindo ao painel de controle' },
        vendas: { title: 'Vendas', subtitle: 'Histórico completo de vendas' },
        estoque: { title: 'Estoque', subtitle: 'Controle de produtos' },
        cupons: { title: 'Cupons', subtitle: 'Gerenciamento de descontos' },
        tickets: { title: 'Tickets', subtitle: 'Acompanhamento de atendimento' },
        clientes: { title: 'Clientes', subtitle: 'Top clientes e níveis' }
    };

    const header = titles[pageName] || titles.dashboard;
    document.getElementById('pageTitle').textContent = header.title;
    document.getElementById('pageSubtitle').textContent = header.subtitle;

    if (pageName === 'vendas') loadVendas();
    else if (pageName === 'estoque') loadEstoque();
    else if (pageName === 'cupons') loadCupons();
    else if (pageName === 'tickets') loadTickets();
    else if (pageName === 'clientes') loadClientes();
}

// ===== TIME =====
function updateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('pt-BR');
    document.getElementById('currentDate').textContent = now.toLocaleDateString('pt-BR');
}

function updateBotStatusIndicator(enabled, online = true) {
    const indicator = document.querySelector('.status-indicator');
    const label = document.getElementById('botStatus');
    if (!indicator || !label) return;

    indicator.classList.remove('online', 'disabled', 'offline');
    if (!online) {
        indicator.classList.add('offline');
        label.textContent = 'Painel Offline';
        return;
    }

    if (enabled) {
        indicator.classList.add('online');
        label.textContent = 'Bot Ligado';
    } else {
        indicator.classList.add('disabled');
        label.textContent = 'Bot Desligado';
    }
}

// ===== BOT STATUS =====
async function checkBotStatus() {
    await loadDashboard();
}

// ===== DASHBOARD =====
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        applyStatsPayload(data);
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function applyStatsPayload(stats) {
    if (!stats) return;
    document.getElementById('receita').textContent = formatCurrency(stats.totalRevenue);
    document.getElementById('totalVendas').textContent = stats.totalSales;
    document.getElementById('totalClientes').textContent = stats.totalCustomers;
    document.getElementById('lucroTotal').textContent = formatCurrency(stats.totalProfit);
    document.getElementById('openTickets').textContent = stats.openTickets ?? 0;
    document.getElementById('stockItems').textContent = stats.inStockItems ?? 0;
    const lowStockCountEl = document.getElementById('lowStockCount');
    if (lowStockCountEl) lowStockCountEl.textContent = stats.lowStockCount ?? 0;
    const openTicketsMiniEl = document.getElementById('openTicketsMini');
    if (openTicketsMiniEl) openTicketsMiniEl.textContent = stats.openTickets ?? 0;

    const salesGoal = stats.monthlySalesGoal || 1;
    const metaPercent = stats.monthlySalesGoal ? Math.min(Math.round((stats.currentSales / salesGoal) * 100), 100) : 0;
    document.getElementById('metaProgress').style.width = `${metaPercent}%`;
    document.getElementById('metaText').textContent = `${stats.currentSales} / ${salesGoal} vendas`;
    document.getElementById('metaPercent').textContent = `${metaPercent}%`;
    const metaPercentMini = document.getElementById('metaPercentMini');
    if (metaPercentMini) metaPercentMini.textContent = `${metaPercent}%`;

    const botStatus = stats.botEnabled ? 'Ligado' : 'Desligado';
    const processStatus = stats.botRunning ? 'Processo ativo' : 'Processo parado';

    const toggleButton = document.getElementById('botToggleButton');
    const botProcessButton = document.getElementById('botProcessToggleButton');
    const toggleStatus = document.getElementById('heroBotToggleStatus') || document.getElementById('botToggleStatus');
    const processStatusLabel = document.getElementById('heroBotProcessStatus') || document.getElementById('botProcessStatus');

    if (toggleStatus) toggleStatus.textContent = botStatus;
    if (processStatusLabel) processStatusLabel.textContent = `Execução: ${processStatus}`;

    if (toggleButton) {
        toggleButton.textContent = stats.botEnabled ? 'Desligar Bot' : 'Ligar Bot';
        toggleButton.disabled = false;
    }

    if (botProcessButton) {
        botProcessButton.textContent = stats.botRunning ? 'Parar Processo' : 'Iniciar Processo';
        botProcessButton.disabled = false;
    }

    // update sidebar indicator with bot enabled + running state
    updateBotStatusIndicator(stats.botEnabled, stats.botRunning);

    // ensure sidebar label matches bot enabled state (avoid mismatches)
    try {
        const sidebarIndicator = document.querySelector('.status-indicator');
        const sidebarLabel = document.getElementById('botStatus');
        if (sidebarIndicator && sidebarLabel) {
            sidebarIndicator.classList.remove('online', 'disabled', 'offline');
            if (stats.botEnabled) {
                sidebarIndicator.classList.add('online');
                sidebarLabel.textContent = 'Bot Ligado';
            } else {
                sidebarIndicator.classList.add('disabled');
                sidebarLabel.textContent = 'Bot Desligado';
            }
        }
    } catch (e) {
        // noop
    }

    if (stats.dailySales) updateVendidosChart(stats.dailySales);
    if (stats.topProducts) updateProdutosChart(stats.topProducts);
}

async function toggleBotEnabled() {
    try {
        const statusText = document.getElementById('heroBotToggleStatus') || document.getElementById('botToggleStatus') || document.getElementById('summaryBotToggleStatus');
        const button = document.getElementById('botToggleButton');
        if (!button) return;

        button.disabled = true;
        const currentEnabled = statusText ? (statusText.textContent === 'Ligado') : button.textContent.includes('Desligar');
        const response = await fetch(`${API_BASE}/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: !currentEnabled })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao atualizar controle.');
        }

        const data = await response.json();
        if (statusText) statusText.textContent = data.botEnabled ? 'Ligado' : 'Desligado';
        // also update summary/status fallbacks if present
        const summaryEl = document.getElementById('summaryBotToggleStatus');
        if (summaryEl) summaryEl.textContent = data.botEnabled ? 'Ligado' : 'Desligado';
        button.textContent = data.botEnabled ? 'Desligar Bot' : 'Ligar Bot';
        await loadDashboard();
    } catch (error) {
        console.error('Erro ao alternar bot:', error);
        alert(error.message);
    } finally {
        const button = document.getElementById('botToggleButton');
        if (button) button.disabled = false;
    }
}

async function toggleBotProcess() {
    try {
        const button = document.getElementById('botProcessToggleButton');
        if (!button) return;

        button.disabled = true;
        const currentText = button.textContent || '';
        const action = currentText.includes('Iniciar') ? 'start' : 'stop';

        const response = await fetch(`${API_BASE}/bot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao controlar o bot.');
        }

        await loadDashboard();
    } catch (error) {
        console.error('Erro ao alternar processo do bot:', error);
        alert(error.message);
    } finally {
        const button = document.getElementById('botProcessToggleButton');
        if (button) button.disabled = false;
    }
}

// ===== WEBSOCKET =====
function handleWSMessageRouter(payload) {
    if (!payload || !payload.type) return;
    if (payload.type === 'stats') {
        applyStatsPayload(payload.data);
    } else {
        handlePartialUpdate(payload);
    }
}

function handlePartialUpdate(payload) {
    if (!payload || !payload.type) return;
    switch (payload.type) {
        case 'vendas':
            updateVendasTable(payload.data);
            break;
        case 'estoque':
            updateEstoqueTable(payload.data);
            loadDashboard();
            break;
        case 'tickets':
            updateTicketsTable(payload.data);
            loadDashboard();
            break;
        case 'cupons':
            updateCuponsTable(payload.data);
            break;
        case 'clientes':
            updateClientesTable(payload.data);
            break;
    }
}

// ===== VENDAS =====
async function loadVendas() {
    try {
        const response = await fetch(`${API_BASE}/vendas`);
        const vendas = await response.json();
        updateVendasTable(vendas);
    } catch (error) {
        console.error('Erro ao carregar vendas:', error);
    }
}

function updateVendasTable(vendas) {
    const tbody = document.getElementById('vendasTable');
    tbody.innerHTML = '';
    if (!Array.isArray(vendas) || vendas.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Nenhuma venda registrada</td></tr>';
        return;
    }
    vendas.forEach(venda => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(venda.data)}</td>
            <td>${venda.cliente || '-'}</td>
            <td>${venda.produto || '-'}</td>
            <td>${formatCurrency(venda.valor)}</td>
            <td>${formatCurrency(venda.lucro)}</td>
            <td>${venda.pagamento || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// ===== ESTOQUE =====
async function loadEstoque() {
    try {
        const response = await fetch(`${API_BASE}/estoque`);
        const estoque = await response.json();
        updateEstoqueTable(estoque);
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
    }
}

function updateEstoqueTable(estoque) {
    const tbody = document.getElementById('estoqueTable');
    tbody.innerHTML = '';
    if (!Array.isArray(estoque) || estoque.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Nenhum produto registrado</td></tr>';
        return;
    }

    estoque.forEach(item => {
        const status = item.quantidade <= 5 ? '<span class="badge badge-danger">Baixo</span>' : '<span class="badge badge-success">Normal</span>';
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = item.nome || '-';

        const quantityCell = document.createElement('td');
        quantityCell.textContent = item.quantidade;

        const soldCell = document.createElement('td');
        soldCell.textContent = item.vendido || 0;

        const priceCell = document.createElement('td');
        priceCell.innerHTML = formatCurrency(item.preco);

        const statusCell = document.createElement('td');
        statusCell.innerHTML = status;

        const adjustCell = document.createElement('td');
        adjustCell.className = 'adjust-buttons';

        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'btn btn-small btn-secondary';
        decreaseBtn.type = 'button';
        decreaseBtn.textContent = '-';
        decreaseBtn.addEventListener('click', () => adjustStock(item.nome, -1));

        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'btn btn-small btn-primary';
        increaseBtn.type = 'button';
        increaseBtn.textContent = '+';
        increaseBtn.addEventListener('click', () => adjustStock(item.nome, 1));

        adjustCell.appendChild(decreaseBtn);
        adjustCell.appendChild(increaseBtn);

        row.appendChild(nameCell);
        row.appendChild(quantityCell);
        row.appendChild(soldCell);
        row.appendChild(priceCell);
        row.appendChild(statusCell);
        row.appendChild(adjustCell);

        tbody.appendChild(row);
    });
}

async function adjustStock(nome, delta) {
    try {
        const response = await fetch(`${API_BASE}/estoque/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, delta })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao ajustar estoque.');
        }

        const estoque = await response.json();
        updateEstoqueTable(estoque);
        await loadDashboard();
        await new Promise(r => setTimeout(r, 500));
        if (currentPage === 'estoque') await loadEstoque();
    } catch (error) {
        console.error('Erro ao ajustar estoque:', error);
        alert(error.message);
    }
}

// ===== TICKETS =====
async function loadTickets() {
    try {
        const response = await fetch(`${API_BASE}/tickets`);
        const tickets = await response.json();
        updateTicketsTable(tickets);
    } catch (error) {
        console.error('Erro ao carregar tickets:', error);
    }
}

function updateTicketsTable(tickets) {
    const tbody = document.getElementById('ticketsTable');
    tbody.innerHTML = '';
    if (!Array.isArray(tickets) || tickets.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="5">Nenhum ticket registrado</td></tr>';
        return;
    }
    tickets.forEach(ticket => {
        const statusBadge = `<span class="badge badge-${getStatusColor(ticket.status)}">${ticket.status || 'aberto'}</span>`;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${ticket.id || '-'}</td>
            <td>${ticket.cliente || '-'}</td>
            <td>${statusBadge}</td>
            <td>${formatDate(ticket.criadoEm)}</td>
            <td>${ticket.responsavel || 'Sem atribuição'}</td>
        `;
        tbody.appendChild(row);
    });
}

// ===== CUPONS =====
async function loadCupons() {
    try {
        const response = await fetch(`${API_BASE}/cupons`);
        const cupons = await response.json();
        updateCuponsTable(cupons);
    } catch (error) {
        console.error('Erro ao carregar cupons:', error);
    }
}

function updateCuponsTable(cupons) {
    const tbody = document.getElementById('cupomsTable');
    tbody.innerHTML = '';
    if (!Array.isArray(cupons) || cupons.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="5">Nenhum cupom registrado</td></tr>';
        return;
    }
    cupons.forEach(cupom => {
        const statusBadge = cupom.ativo ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-danger">Inativo</span>';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${cupom.nome || '-'}</strong></td>
            <td>${cupom.desconto || 0}%</td>
            <td>${formatDate(cupom.validade)}</td>
            <td>${cupom.usosRestantes || 0} / ${cupom.usosMaximos || 0}</td>
            <td>${statusBadge}</td>
        `;
        tbody.appendChild(row);
    });
}

// ===== CLIENTES =====
async function loadClientes() {
    try {
        const response = await fetch(`${API_BASE}/clientes`);
        const clientes = await response.json();
        updateClientesTable(clientes);
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

function updateClientesTable(clientes) {
    const tbody = document.getElementById('clientesTable');
    tbody.innerHTML = '';
    if (!Array.isArray(clientes) || clientes.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="5">Nenhum cliente registrado</td></tr>';
        return;
    }
    clientes.forEach((cliente, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${index + 1}</td>
            <td>${cliente.nome || '-'}</td>
            <td>${cliente.nivel || 'Bronze'}</td>
            <td>${cliente.compras || 0}</td>
            <td>${formatCurrency(cliente.gastoTotal || 0)}</td>
        `;
        tbody.appendChild(row);
    });
}

// ===== CHARTS =====
function updateVendidosChart(data = { labels: [], values: [] }) {
    const ctx = document.getElementById('vendidosChart');
    if (!ctx) return;

    if (chartsInstances.vendidos) chartsInstances.vendidos.destroy();
    chartsInstances.vendidos = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Vendas por Dia',
                data: data.values,
                borderColor: '#00D9FF',
                backgroundColor: 'rgba(0, 217, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8A2BE2',
                pointBorderColor: '#00D9FF',
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: '#B0B5C0', font: { size: 12 } } }
            },
            scales: {
                x: { grid: { color: '#2A2F45', drawBorder: false }, ticks: { color: '#B0B5C0' } },
                y: { grid: { color: '#2A2F45', drawBorder: false }, ticks: { color: '#B0B5C0' } }
            }
        }
    });
}

function updateProdutosChart(data = { labels: [], values: [] }) {
    const ctx = document.getElementById('produtosChart');
    if (!ctx) return;

    if (chartsInstances.produtos) chartsInstances.produtos.destroy();
    const colors = ['#8A2BE2', '#00D9FF', '#FF006E', '#00D084', '#FFB703'];
    chartsInstances.produtos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: colors.slice(0, data.values.length),
                borderColor: '#0A0E27',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: '#B0B5C0', font: { size: 12 }, padding: 15 } }
            }
        }
    });
}

// ===== UTIL =====
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusColor(status) {
    const colors = {
        aberto: 'warning',
        'em-progresso': 'warning',
        fechado: 'success',
        cancelado: 'danger'
    };
    return colors[(status || '').toLowerCase()] || 'warning';
}
