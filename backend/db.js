const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./data.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      sales_order_id TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS billing (
      id TEXT PRIMARY KEY,
      delivery_id TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      billing_id TEXT
    )
  `);
});

module.exports = db;