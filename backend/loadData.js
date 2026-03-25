const fs = require("fs");
const path = require("path");
const db = require("./db");

// Read JSONL
function readJSONL(filePath) {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  return lines.filter(Boolean).map(line => JSON.parse(line));
}

// Get JSONL file
function getJSONLFile(folderPath) {
  if (!fs.existsSync(folderPath)) return null;

  const files = fs.readdirSync(folderPath);
  const file = files.find(f => f.endsWith(".jsonl"));

  return file ? path.join(folderPath, file) : null;
}

////////////////////////////////////////////////////

// SALES ORDERS
function loadSalesOrders() {
  const filePath = getJSONLFile(
    path.join(__dirname, "data/sales_order_headers")
  );
  if (!filePath) return;

  const data = readJSONL(filePath);

  data.forEach(row => {
    if (!row.salesOrder) return;

    db.run(
      `INSERT OR IGNORE INTO sales_orders (id) VALUES (?)`,
      [row.salesOrder]
    );
  });

  console.log("✅ Sales Orders Loaded");
}

////////////////////////////////////////////////////

// DELIVERIES (TEMP LINK FIX)
function loadDeliveries() {
  const filePath = getJSONLFile(
    path.join(__dirname, "data/outbound_delivery_headers")
  );
  if (!filePath) return;

  const data = readJSONL(filePath);

  data.forEach(row => {
    if (!row.deliveryDocument) return;

    db.run(
      `INSERT OR IGNORE INTO deliveries (id, sales_order_id) VALUES (?, ?)`,
      [
        row.deliveryDocument,
        row.deliveryDocument // TEMP LINK
      ]
    );
  });

  console.log("✅ Deliveries Loaded");
}

////////////////////////////////////////////////////

// BILLING (TEMP LINK FIX)
function loadBilling() {
  const filePath = getJSONLFile(
    path.join(__dirname, "data/billing_document_headers")
  );
  if (!filePath) return;

  const data = readJSONL(filePath);

  data.forEach(row => {
    if (!row.billingDocument) return;

    db.run(
      `INSERT OR IGNORE INTO billing (id, delivery_id) VALUES (?, ?)`,
      [
        row.billingDocument,
        row.billingDocument // TEMP LINK
      ]
    );
  });

  console.log("✅ Billing Loaded");
}

////////////////////////////////////////////////////

// JOURNAL (REAL LINK)
function loadJournal() {
  const filePath = getJSONLFile(
    path.join(__dirname, "data/journal_entry_items_accounts_receivable")
  );
  if (!filePath) return;

  const data = readJSONL(filePath);

  data.forEach(row => {
    if (!row.accountingDocument) return;

    db.run(
      `INSERT OR IGNORE INTO journal_entries (id, billing_id) VALUES (?, ?)`,
      [
        row.accountingDocument,
        row.referenceDocument // correct link
      ]
    );
  });

  console.log("✅ Journal Entries Loaded");
}

////////////////////////////////////////////////////

// RUN ALL
function runAll() {
  console.log("🚀 Loading Data...\n");

  loadSalesOrders();
  loadDeliveries();
  loadBilling();
  loadJournal();

  console.log("\n🎉 Data Loaded Successfully!");
}

runAll();