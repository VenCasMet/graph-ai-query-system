# 🚀 Graph AI Query System

An interactive full-stack application that transforms relational ERP-style data into a dynamic graph and enables natural language querying using an LLM.

🔗 **Live Demo:** https://graph-ai-query-system-1.onrender.com/

---

## 🧠 Overview

This project bridges structured database systems with intuitive graph visualization and AI-powered querying.

It allows users to:

* Visualize relationships between business entities (Sales Orders → Deliveries → Billing → Journal Entries)
* Explore data interactively using a graph
* Ask questions in natural language and get SQL-based results

---

## 🏗️ Architecture

```
User Input (UI)
   ↓
Graph Visualization (React + Force Graph)
   ↓
Backend API (Node.js + Express)
   ↓
SQLite Database
   ↓
LLM (Groq API) → SQL Generation → Query Execution
```

---

## 🔗 Data Flow

The system models real-world ERP relationships:

```
SalesOrder → Delivery → Billing → JournalEntry
```

These relationships are transformed into a graph structure:

* **Nodes** → Entities (Orders, Deliveries, etc.)
* **Edges** → Relationships (DELIVERED, BILLED, POSTED)

---

## ✨ Features

### 🔹 Graph Visualization

* Interactive force-directed graph
* Color-coded node types:

  * 🔵 SalesOrder
  * 🟢 Delivery
  * 🟡 Billing
  * 🟣 JournalEntry
* Zoom, drag, and explore relationships

---

### 🔹 AI-Powered Querying

* Ask questions like:

  * *"Show all deliveries"*
  * *"Find journal entries for order 740506"*
* LLM converts natural language → SQL
* Executes query and returns results

---

### 🔹 Smart Fallback System

* Handles common queries without LLM:

  * Deliveries
  * Billing
  * Journal entries
* Improves speed and reliability

---

### 🔹 Robust Backend

* REST APIs:

  * `/graph/:id` → Graph data
  * `/query` → AI + SQL response
* Error handling for invalid SQL
* Clean SQL sanitization

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* react-force-graph-2d
* Axios

### Backend

* Node.js
* Express.js
* SQLite3

### AI Integration

* Groq API (LLM for SQL generation)

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/graph-ai-query-system.git
cd graph-ai-query-system
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```
GROQ_API_KEY=your_api_key_here
```

Run backend:

```bash
node server.js
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 API Endpoints

### 🔹 Get Graph

```http
GET /graph/:id
```

Example:

```
/graph/740506
```

---

### 🔹 Query with AI

```http
POST /query
```

Body:

```json
{
  "question": "Find journal entries for order 740506"
}
```

---

## 📊 Example Use Cases

* Visualize order lifecycle
* Trace billing and financial postings
* Query ERP-style data using natural language
* Understand relationships in complex datasets

---

## ⚠️ Notes

* Due to dataset inconsistencies, relationships are dynamically constructed for visualization
* The system ensures meaningful graph representation even with imperfect data

---

## 🎯 Conclusion

This project demonstrates:

* Graph-based data modeling
* Natural language to SQL using LLMs
* Full-stack system design
* Interactive data visualization

---

## 👨‍💻 Author

Piyush Sharma

---

## ⭐ If you like this project

Give it a star and share feedback!
