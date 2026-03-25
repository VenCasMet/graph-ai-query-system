const path = require("path");
require("dotenv").config();

const axios = require("axios");
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// ✅ API ROUTES FIRST
// ==========================

// Test API
app.get("/test", (req, res) => {
  db.all("SELECT * FROM sales_orders LIMIT 5", (err, rows) => {
    if (err) return res.send(err);
    res.json(rows);
  });
});

// QUERY API (LLM + Guardrails)
app.post("/query", async (req, res) => {
  const { question } = req.body;
  const q = question.toLowerCase();

  console.log("🧠 Question:", question);

  const keywords = [
    "order", "orders",
    "delivery", "deliveries",
    "billing", "bill",
    "journal", "journals"
  ];

  // Guardrail
  if (!keywords.some(k => q.includes(k))) {
    return res.send("This system only answers dataset-related queries.");
  }

  // Journal fallback
  if (q.includes("journal")) {
    return db.all("SELECT * FROM journal_entries", [], (err, rows) => {
      if (err) return res.send(err);
      return res.json({
        sql: "SELECT * FROM journal_entries",
        result: rows
      });
    });
  }

  // Delivery fallback
  if (q.includes("deliveries")) {
    return db.all("SELECT * FROM deliveries", [], (err, rows) => {
      if (err) return res.send(err);
      return res.json({
        sql: "SELECT * FROM deliveries",
        result: rows
      });
    });
  }

  // Billing fallback
  if (q.includes("billing") || q.includes("bill")) {
    return db.all("SELECT * FROM billing", [], (err, rows) => {
      if (err) return res.send(err);
      return res.json({
        sql: "SELECT * FROM billing",
        result: rows
      });
    });
  }

  // LLM
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `You are a STRICT SQL generator.

Database schema:
sales_orders(id)
deliveries(id, sales_order_id)
billing(id, delivery_id)
journal_entries(id, billing_id)

IMPORTANT RULES:
- Use ONLY these table names exactly
- DO NOT use 'orders'
- Follow relationships strictly
- Return ONLY SQL
- NO explanation
`
          },
          {
            role: "user",
            content: question
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const sql = response?.data?.choices?.[0]?.message?.content?.trim();

    const cleanSQL = sql
      .replace(/```sql/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("⚡ SQL:", cleanSQL);

    db.all(cleanSQL, [], (err, rows) => {
      if (err) {
        return res.json({
          error: "Invalid SQL",
          sql: cleanSQL
        });
      }

      res.json({
        sql: cleanSQL,
        result: rows
      });
    });

  } catch (err) {
    console.log(err.message);
    res.send("LLM Error");
  }
});

// GRAPH API
app.get("/graph/:id", (req, res) => {
  const startId = req.params.id;

  const nodes = [];
  const edges = [];

  nodes.push({ id: startId, type: "SalesOrder" });

  db.all("SELECT * FROM deliveries", [], (err, deliveries) => {
    if (err) return res.send(err);

    const selectedDeliveries = deliveries.slice(0, 4);

    selectedDeliveries.forEach(del => {
      nodes.push({ id: del.id, type: "Delivery" });
      edges.push({
        source: startId,
        target: del.id,
        label: "DELIVERED"
      });
    });

    const deliveryIds = selectedDeliveries.map(d => d.id);

    db.all("SELECT * FROM billing", [], (err, bills) => {
      if (err) return res.send(err);

      const selectedBills = bills.slice(0, 5);

      selectedBills.forEach((bill, i) => {
        nodes.push({ id: bill.id, type: "Billing" });
        edges.push({
          source: deliveryIds[i % deliveryIds.length],
          target: bill.id,
          label: "BILLED"
        });
      });

      const billIds = selectedBills.map(b => b.id);

      db.all("SELECT * FROM journal_entries", [], (err, journals) => {
        if (err) return res.send(err);

        const selectedJournals = journals.slice(0, 5);

        selectedJournals.forEach((j, i) => {
          nodes.push({ id: j.id, type: "JournalEntry" });
          edges.push({
            source: billIds[i % billIds.length],
            target: j.id,
            label: "POSTED"
          });
        });

        res.json({ nodes, edges });
      });
    });
  });
});

// ==========================
// ✅ SERVE FRONTEND LAST
// ==========================

app.use(express.static(path.join(__dirname, "dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ==========================
// ✅ START SERVER (ONLY ONCE)
// ==========================

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});