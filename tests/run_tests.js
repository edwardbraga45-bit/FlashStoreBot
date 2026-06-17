const path = require('path');
const fs = require('fs');

const Cache = require('../lib/cache');
const AuditLog = require('../lib/auditLog');
const RateLimiter = require('../lib/rateLimiter');
const utils = require('../utils');

// Load a copy of DB
const dbPath = path.join(__dirname, '..', 'data.json');
const originalDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const db = JSON.parse(JSON.stringify(originalDB));

const cache = new Cache();
const auditLog = new AuditLog(path.join(__dirname, '..', 'logs', 'test-audit.log'));
const rateLimiter = new RateLimiter();

function buildStats(localDb) {
  const vendas = localDb.sales.length;
  const receita = localDb.sales.reduce((acc, sale) => acc + Number(sale.valor || 0), 0);
  const lucro = localDb.sales.reduce((acc, sale) => acc + Number(sale.lucro || 0), 0);
  const produtos = Object.keys(localDb.stock).length;
  const estoqueTotal = Object.values(localDb.stock).reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
  const cuponsAtivos = localDb.coupons.filter(c => c.ativo).length;
  const tickets = localDb.tickets.length;
  const estoqueBaixo = Object.values(localDb.stock).filter(item => Number(item.quantidade || 0) > 0 && Number(item.quantidade || 0) <= 3).length;
  const topProduto = Object.values(localDb.stock).sort((a, b) => Number(b.vendido || 0) - Number(a.vendido || 0))[0];

  return { vendas, receita, lucro, produtos, estoqueTotal, cuponsAtivos, tickets, estoqueBaixo, topProduto: topProduto ? topProduto.nome : 'Nenhum' };
}

function makeOptions(opts) {
  return {
    getSubcommand: () => opts.sub,
    getString: (k) => opts[k],
    getInteger: (k) => opts[k],
    getNumber: (k) => opts[k]
  };
}

class MockInteraction {
  constructor(commandName, opts = {}) {
    this.commandName = commandName;
    this.user = { id: 'tester', username: 'tester', tag: 'tester#0001' };
    this.member = { roles: { cache: new Map() } };
    this.guild = { channels: { cache: new Map() } };
    this.options = makeOptions(opts);
    this._replied = false;
    this._deferred = false;
  }
  async deferReply() { this._deferred = true; }
  async reply(obj) { this._replied = true; console.log(`[reply] ${JSON.stringify(obj && (obj.content || obj.embeds ? (obj.content||'embed') : obj))}`); }
  async editReply(obj) { this._replied = true; console.log(`[editReply] ${JSON.stringify(obj && (obj.content || obj.embeds ? (obj.content||'embed') : obj))}`); }
}

async function run() {
  console.log('Starting tests...');

  const ctx = {
    db,
    cache,
    auditLog,
    rateLimiter,
    utils,
    Features: require('../features'),
    saveDB: () => {},
    ensureStockItem: (produto) => {
      const key = utils.normalizeName(produto);
      if (!db.stock[key]) db.stock[key] = { nome: produto, quantidade: 0, vendido: 0, preco: 1 };
      return db.stock[key];
    },
    normalizeName: utils.normalizeName,
    buildStats: () => buildStats(db),
    sendLog: () => {},
    sendRestockNotification: () => {},
    PRODUTOS: {},
    CANAL_AVALIACOES_ID: null,
    podeGerenciarTicket: () => true
  };

  // populate PRODUTOS to support catalog commands
  const productFactory = nome => ({ nome, preco: 1.0, estoque: () => (db.stock[utils.normalizeName(nome)] || { quantidade: 0 }).quantidade });
  ctx.PRODUTOS = {
    nitro_mensal: productFactory('Nitro Mensal'),
    nitro_trimestral: productFactory('Nitro Trimensal'),
    nitro_anual: productFactory('Nitro Anual'),
    nitro_link_1mes: productFactory('Nitro Link'),
    link_3_meses: productFactory('Link 3 Meses'),
    impulso_2x1: productFactory('Mensal | 2x 1MPULSO'),
    impulso_8x1: productFactory('Mensal | 8x 1MPULSO'),
    impulso_14x1: productFactory('Mensal | 14x 1MPULSO')
  };

  // Test health
  try {
    const health = require('../commands/health');
    const mi = new MockInteraction('health');
    await health.execute(mi, ctx);
    console.log('health: OK');
  } catch (err) { console.error('health: FAIL', err); }

  // Test stats
  try {
    const stats = require('../commands/stats');
    const mi = new MockInteraction('stats');
    await stats.execute(mi, ctx);
    console.log('stats: OK');
  } catch (err) { console.error('stats: FAIL', err); }

  // Test estoque adicionar
  try {
    const estoqueCmd = require('../commands/estoque');
    const produto = 'Nitro Trimensal';
    const before = (db.stock[utils.normalizeName(produto)] || { quantidade: 0 }).quantidade;
    const mi = new MockInteraction('estoque', { sub: 'adicionar', produto, quantidade: 2 });
    await estoqueCmd.execute(mi, ctx);
    const after = db.stock[utils.normalizeName(produto)].quantidade;
    if (after === before + 2) console.log('estoque.adicionar: OK'); else console.error('estoque.adicionar: FAIL', before, after);
  } catch (err) { console.error('estoque.adicionar: FAIL', err); }

  // Test venda registrar
  try {
    const vendaCmd = require('../commands/venda');
    const produto = 'Nitro Trimensal';
    // ensure stock at a known baseline
    const key = utils.normalizeName(produto);
    if (!db.stock[key]) db.stock[key] = { nome: produto, quantidade: 5, vendido: 0, preco: 3.1 };
    else db.stock[key].quantidade = 5;

    const before = db.stock[key].quantidade;
    const quantidadeVenda = 2;
    const mi = new MockInteraction('venda', { sub: 'registrar', cliente: '<@12345>', produto, valor: 10.0, custo: 2.0, pagamento: 'pix', quantidade: quantidadeVenda });
    await vendaCmd.execute(mi, ctx);
    if (db.stock[key].quantidade === before - quantidadeVenda && db.sales.find(s => s.produto === produto)) {
      console.log('venda.registrar: OK');
    } else {
      console.error('venda.registrar: FAIL', { before, after: db.stock[key].quantidade, sold: db.stock[key].vendido, saleExists: !!db.sales.find(s => s.produto === produto) });
    }
  } catch (err) { console.error('venda.registrar: FAIL', err); }

  console.log('Tests finished. Check logs/test-audit.log and data.json (not modified by tests).');
  // Additional tests: cupom create/delete
  try {
    const cupom = require('../commands/cupom');
    const miCreate = new MockInteraction('cupom', { sub: 'criar', nome: 'TESTE', desconto: 10, validade: '2026-12-31', usos: 2 });
    await cupom.execute(miCreate, ctx);
    const exists = ctx.db.coupons.find(c => c.nome === 'TESTE');
    console.log('cupom.criar:', exists ? 'OK' : 'FAIL');

    const miDelete = new MockInteraction('cupom', { sub: 'deletar', nome: 'TESTE' });
    await cupom.execute(miDelete, ctx);
    const existsAfter = ctx.db.coupons.find(c => c.nome === 'TESTE');
    console.log('cupom.deletar:', !existsAfter ? 'OK' : 'FAIL');
  } catch (err) { console.error('cupom tests failed', err); }

  // catalogo, nitrolink, impulsos
  try {
    const catalogo = require('../commands/catalogo');
    await catalogo.execute(new MockInteraction('catalogo'), ctx);
    const nitrolink = require('../commands/nitrolink');
    await nitrolink.execute(new MockInteraction('nitrolink'), ctx);
    const impulsos = require('../commands/impulsos');
    await impulsos.execute(new MockInteraction('impulsos'), ctx);
    console.log('catalogo/nitrolink/impulsos: OK');
  } catch (err) { console.error('catalogo/nitrolink/impulsos failed', err); }

  // lucro total/hoje
  try {
    const lucroCmd = require('../commands/lucro');
    await lucroCmd.execute(new MockInteraction('lucro', { sub: 'total' }), ctx);
    await lucroCmd.execute(new MockInteraction('lucro', { sub: 'hoje' }), ctx);
    console.log('lucro: OK');
  } catch (err) { console.error('lucro failed', err); }

  // metas definir/ver
  try {
    const metas = require('../commands/metas');
    await metas.execute(new MockInteraction('metas', { sub: 'definir', vendas: 10 }), ctx);
    await metas.execute(new MockInteraction('metas', { sub: 'ver' }), ctx);
    console.log('metas: OK');
  } catch (err) { console.error('metas failed', err); }

  // niveis meu-nivel / ranking
  try {
    const niveis = require('../commands/niveis');
    await niveis.execute(new MockInteraction('niveis', { sub: 'meu-nivel' }), ctx);
    await niveis.execute(new MockInteraction('niveis', { sub: 'ranking' }), ctx);
    console.log('niveis: OK');
  } catch (err) { console.error('niveis failed', err); }

  // painel and setup
  try {
    const painel = require('../commands/painel');
    await painel.execute(new MockInteraction('painel'), ctx);
    const setupCmd = require('../commands/setup');
    const miSetup = new MockInteraction('setup');
    // prepare guild channels for rules and terms
    miSetup.guild.channels.cache.set('rules-channel-id', { send: async () => {} });
    miSetup.guild.channels.cache.set('terms-channel-id', { send: async () => {} });
    // set ctx ids referenced by setup
    ctx.CANAL_REGRAS_ID = 'rules-channel-id';
    ctx.CANAL_TERMOS_ID = 'terms-channel-id';
    await setupCmd.execute(miSetup, ctx);
    console.log('painel/setup: OK');
  } catch (err) { console.error('painel/setup failed', err); }

  // backup (create/list)
  try {
    const backup = require('../commands/backup');
    await backup.execute(new MockInteraction('backup', { sub: 'criar' }), ctx);
    await backup.execute(new MockInteraction('backup', { sub: 'listar' }), ctx);
    console.log('backup: OK');
  } catch (err) { console.error('backup failed', err); }
}

run().catch(err => { console.error('Runner error', err); process.exit(1); });
