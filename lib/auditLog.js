const fs = require('fs');
const path = require('path');

class AuditLog {
  constructor(filePath) {
    this.filePath = filePath || path.join(__dirname, '..', 'logs', 'audit.log');
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  logAction(action, actor, details = {}) {
    try {
      const entry = {
        time: new Date().toISOString(),
        action,
        actor,
        details
      };
      fs.appendFileSync(this.filePath, JSON.stringify(entry) + '\n', 'utf8');
    } catch (err) {
      // best-effort logging, do not throw
      console.error('AuditLog error:', err && err.message);
    }
  }
}

module.exports = AuditLog;
