const Database = require("better-sqlite3");

const db = new Database("data.db");

// Create tables (same as before)
db.exec(`
  CREATE TABLE IF NOT EXISTS sales_orders (
    id TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    sales_order_id TEXT
  );

  CREATE TABLE IF NOT EXISTS billing (
    id TEXT PRIMARY KEY,
    delivery_id TEXT
  );

  CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    billing_id TEXT
  );
`);

// Wrapper to match your existing db.all(...) usage
module.exports = {
  all: (query, params = [], callback) => {
    try {
      const stmt = db.prepare(query);
      const rows = stmt.all(params);
      callback(null, rows);
    } catch (err) {
      callback(err, null);
    }
  }
};