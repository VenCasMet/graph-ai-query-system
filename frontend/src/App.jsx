import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import ForceGraph2D from "react-force-graph-2d";

const API = ""; // same-origin API (IMPORTANT)

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const NODE_COLORS = {
  SalesOrder:   "#3b82f6",
  Delivery:     "#10b981",
  Billing:      "#f59e0b",
  JournalEntry: "#a855f7",
  default:      "#64748b",
};

const NODE_ICONS = {
  SalesOrder:   "📦",
  Delivery:     "🚚",
  Billing:      "🧾",
  JournalEntry: "📒",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getNodeColor(type) {
  return NODE_COLORS[type] || NODE_COLORS.default;
}

function formatJSON(obj) {
  if (typeof obj === "string") return obj;
  return JSON.stringify(obj, null, 2);
}

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handler = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, []);

  return size;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    idle:    { color: "#475569", label: "Idle" },
    loading: { color: "#f59e0b", label: "Loading…" },
    success: { color: "#10b981", label: "Loaded" },
    error:   { color: "#ef4444", label: "Error" },
  };
  const { color, label } = map[status] || map.idle;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: color + "22", border: `1px solid ${color}`,
      color, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
      fontFamily: "monospace", whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: color,
        boxShadow: status === "loading" ? `0 0 6px ${color}` : "none",
        animation: status === "loading" ? "pulse 1s infinite" : "none",
        flexShrink: 0,
      }} />
      {label}
    </span>
  );
}

function NodeLegend() {
  return (
    <div style={{
      position: "absolute", bottom: 12, left: 12,
      background: "rgba(2,6,23,0.88)",
      border: "1px solid #1e293b",
      borderRadius: 10, padding: "8px 12px",
      display: "flex", flexDirection: "column", gap: 5,
      backdropFilter: "blur(8px)", zIndex: 10,
    }}>
      <div style={{ color: "#475569", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2 }}>
        NODE TYPES
      </div>
      {Object.entries(NODE_COLORS).filter(([k]) => k !== "default").map(([type, color]) => (
        <div key={type} style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: color, boxShadow: `0 0 5px ${color}66`, flexShrink: 0,
          }} />
          <span style={{ color: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}>
            {NODE_ICONS[type]} {type}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 8, marginBottom: 12, alignItems: "flex-start",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13,
        background: isUser ? "#1d4ed8" : "#0f3027",
        border: `1px solid ${isUser ? "#2563eb" : "#10b981"}`,
      }}>
        {isUser ? "👤" : "🤖"}
      </div>
      <div style={{
        maxWidth: "78%",
        background: isUser ? "#1e3a5f" : "#0a1f18",
        border: `1px solid ${isUser ? "#2563eb44" : "#10b98144"}`,
        borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
        padding: "8px 12px",
      }}>
        <pre style={{
          margin: 0, color: isUser ? "#bfdbfe" : "#6ee7b7",
          fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {msg.content}
        </pre>
      </div>
    </div>
  );
}

// ─── MOBILE TAB BAR ──────────────────────────────────────────────────────────
function MobileTabBar({ activeTab, onSwitch, nodeCount }) {
  return (
    <div style={{
      display: "flex",
      borderTop: "1px solid #0f172a",
      background: "rgba(2,6,23,0.97)",
      backdropFilter: "blur(10px)",
      zIndex: 50,
      flexShrink: 0,
    }}>
      {[
        { id: "graph", icon: "⬡", label: "Graph", badge: nodeCount > 0 ? nodeCount : null },
        { id: "chat",  icon: "💬", label: "AI Chat" },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => onSwitch(tab.id)}
          style={{
            flex: 1, padding: "10px 0",
            background: "none", border: "none",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
            cursor: "pointer",
            borderTop: `2px solid ${activeTab === tab.id ? "#3b82f6" : "transparent"}`,
            transition: "border-color 0.2s",
          }}
        >
          <span style={{ fontSize: 18, position: "relative" }}>
            {tab.icon}
            {tab.badge && (
              <span style={{
                position: "absolute", top: -4, right: -8,
                background: "#3b82f6", color: "white",
                fontSize: 8, fontWeight: 700,
                borderRadius: 10, padding: "1px 4px",
                fontFamily: "monospace",
              }}>
                {tab.badge}
              </span>
            )}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: activeTab === tab.id ? "#3b82f6" : "#475569",
            fontFamily: "monospace", letterSpacing: "0.04em",
          }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { width, height } = useWindowSize();
  const isMobile = width < 768;

  const [graphData, setGraphData]       = useState({ nodes: [], links: [] });
  const [orderId, setOrderId]           = useState("");
  const [graphStatus, setGraphStatus]   = useState("idle");
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab]       = useState("graph"); // mobile only

  const [question, setQuestion]         = useState("");
  const [chatHistory, setChatHistory]   = useState([]);
  const [chatLoading, setChatLoading]   = useState(false);

  const fgRef      = useRef();
  const chatEndRef = useRef();

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // ── Load Graph ──────────────────────────────────────────────────────────────
  const loadGraph = async () => {
    if (!orderId.trim()) return;
    setGraphStatus("loading");
    setSelectedNode(null);
    try {
      const res = await axios.get(`/graph/${orderId.trim()}`);
      const formatted = {
        nodes: res.data.nodes.map(n => ({ ...n, __color: getNodeColor(n.type) })),
        links: res.data.edges.map(e => ({
          source: e.source,
          target: e.target,
          label:  e.label,
        })),
      };
      setGraphData(formatted);
      setGraphStatus("success");
      setTimeout(() => fgRef.current?.zoomToFit(400, 40), 600);
    } catch (err) {
      console.error(err);
      setGraphStatus("error");
    }
  };

  const handleOrderKeyDown = (e) => {
    if (e.key === "Enter") loadGraph();
  };

  // ── Node renderer ───────────────────────────────────────────────────────────
  const paintNode = useCallback((node, ctx, globalScale) => {
    const radius = 10;
    const label  = node.id;
    const color  = node.__color || NODE_COLORS.default;

    ctx.shadowColor = color;
    ctx.shadowBlur  = selectedNode?.id === node.id ? 18 : 8;

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color + "cc";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth   = selectedNode?.id === node.id ? 2.5 : 1.2;
    ctx.stroke();

    ctx.shadowBlur = 0;

    const fontSize = Math.max(9 / globalScale, 3);
    ctx.font        = `${fontSize}px "JetBrains Mono", monospace`;
    ctx.textAlign   = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle   = "#e2e8f0";
    ctx.fillText(label, node.x, node.y + radius + fontSize + 1);
  }, [selectedNode]);

  // ── Ask question ─────────────────────────────────────────────────────────────
  const askQuestion = async () => {
    const q = question.trim();
    if (!q || chatLoading) return;
    setQuestion("");
    setChatHistory(h => [...h, { role: "user", content: q }]);
    setChatLoading(true);
    try {
      const res = await axios.post(`/query`, { question: q });
      const answer = formatJSON(res.data);
      setChatHistory(h => [...h, { role: "assistant", content: answer }]);
    } catch (err) {
      setChatHistory(h => [...h, { role: "assistant", content: "⚠️ Error: " + (err.message || "Request failed") }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  // ── Derived dimensions ────────────────────────────────────────────────────────
  const TOPBAR_H = isMobile ? 52 : 56;
  const TABBAR_H = isMobile ? 56 : 0;
  const graphPanelH = isMobile
    ? height - TOPBAR_H - TABBAR_H
    : height - TOPBAR_H;
  const graphPanelW = isMobile ? width : Math.floor(width * 0.72);

  // ── Graph panel ──────────────────────────────────────────────────────────────
  const GraphPanel = (
    <div style={{
      flex: isMobile ? "none" : 3,
      width: isMobile ? "100%" : undefined,
      height: isMobile ? graphPanelH : "100%",
      display: isMobile && activeTab !== "graph" ? "none" : "flex",
      flexDirection: "column",
      minWidth: 0,
    }}>
      {/* Graph area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {graphData.nodes.length === 0 && graphStatus !== "loading" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "#1e293b", gap: 12, pointerEvents: "none",
          }}>
            <div style={{ fontSize: 48, filter: "grayscale(1) opacity(0.3)" }}>⬡</div>
            <div style={{ fontSize: 13, color: "#334155", fontWeight: 500, textAlign: "center", padding: "0 20px" }}>
              Enter an Order ID to visualise the graph
            </div>
          </div>
        )}

        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={graphPanelW}
          height={graphPanelH}
          backgroundColor="#020617"
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => "replace"}
          onNodeClick={node => setSelectedNode(prev => prev?.id === node.id ? null : node)}
          onNodeHover={node => { document.body.style.cursor = node ? "pointer" : "default"; }}
          linkColor={() => "#1e293b"}
          linkWidth={1.2}
          linkDirectionalArrowLength={5}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={() => "#334155"}
          linkLabel={link => link.label}
          linkCurvature={0.1}
          d3AlphaDecay={0.04}
          d3VelocityDecay={0.35}
          cooldownTicks={120}
        />

        <NodeLegend />

        {/* Selected node card */}
        {selectedNode && (
          <div style={{
            position: "absolute",
            top: isMobile ? "auto" : 16,
            bottom: isMobile ? 12 : "auto",
            right: 12,
            left: isMobile ? 12 : "auto",
            background: "rgba(2,6,23,0.93)",
            border: `1px solid ${getNodeColor(selectedNode.type)}55`,
            borderRadius: 12, padding: "12px 14px",
            backdropFilter: "blur(10px)",
            boxShadow: `0 0 24px ${getNodeColor(selectedNode.type)}22`,
            animation: "fadeIn 0.2s ease",
            zIndex: 20,
            maxHeight: isMobile ? "45%" : undefined,
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                color: getNodeColor(selectedNode.type),
                fontFamily: "monospace",
              }}>
                {NODE_ICONS[selectedNode.type]} {selectedNode.type?.toUpperCase()}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: "none", border: "none", color: "#475569",
                  cursor: "pointer", fontSize: 16, lineHeight: 1,
                  padding: "2px 6px",
                }}
              >✕</button>
            </div>
            {Object.entries(selectedNode)
              .filter(([k]) => !["x","y","vx","vy","fx","fy","index","__color"].includes(k))
              .map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                  <span style={{ color: "#475569", fontSize: 11, fontFamily: "monospace", minWidth: 60 }}>{k}</span>
                  <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>
                    {String(v)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Chat panel ───────────────────────────────────────────────────────────────
  const ChatPanel = (
    <div style={{
      flex: isMobile ? "none" : 1,
      width: isMobile ? "100%" : undefined,
      maxWidth: isMobile ? "100%" : 380,
      height: isMobile ? graphPanelH : "100%",
      display: isMobile && activeTab !== "chat" ? "none" : "flex",
      flexDirection: "column",
      borderLeft: isMobile ? "none" : "1px solid #0f172a",
      background: "#020617",
    }}>
      {/* Chat header */}
      <div style={{
        height: 48, padding: "0 14px",
        borderBottom: "1px solid #0f172a",
        display: "flex", alignItems: "center", gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: "linear-gradient(135deg,#065f46,#10b981)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, flexShrink: 0,
        }}>🤖</div>
        <div>
          <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>AI Assistant</div>
          <div style={{ color: "#10b981", fontSize: 10, fontFamily: "monospace" }}>
            {chatLoading ? "● typing…" : "● online"}
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "14px 12px",
        display: "flex", flexDirection: "column",
        WebkitOverflowScrolling: "touch",
      }}>
        {chatHistory.length === 0 && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 8, color: "#1e293b",
          }}>
            <div style={{ fontSize: 32 }}>💬</div>
            <div style={{ fontSize: 12, color: "#334155", textAlign: "center", lineHeight: 1.6 }}>
              Ask anything about your data.<br />
              <span style={{ color: "#1e3a5f", fontFamily: "monospace", fontSize: 11 }}>
                e.g. "Show all pending orders"
              </span>
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className="chat-msg">
            <ChatMessage msg={msg} />
          </div>
        ))}

        {chatLoading && (
          <div className="chat-msg" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "#0f3027", border: "1px solid #10b981",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>🤖</div>
            <div style={{
              background: "#0a1f18", border: "1px solid #10b98144",
              borderRadius: "12px 12px 12px 4px", padding: "10px 14px",
              display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#10b981",
                  animation: `pulse 1.2s ${i*0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: "10px 12px",
        borderTop: "1px solid #0f172a",
        background: "#020617",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", gap: 8, alignItems: "flex-end",
          background: "#0b1220", border: "1px solid #1e293b",
          borderRadius: 10, padding: "8px 10px",
          transition: "border-color 0.2s",
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = "#10b981"}
          onBlurCapture={e => e.currentTarget.style.borderColor = "#1e293b"}
        >
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleChatKeyDown}
            placeholder={isMobile ? "Ask a question…" : "Ask a question… (Enter to send)"}
            rows={2}
            style={{
              flex: 1, background: "none", border: "none",
              color: "#e2e8f0", fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              resize: "none", lineHeight: 1.6,
            }}
          />
          <button
            onClick={askQuestion}
            disabled={chatLoading || !question.trim()}
            style={{
              width: 36, height: 36, flexShrink: 0,
              background: chatLoading || !question.trim() ? "#0f172a" : "#16a34a",
              border: "none", borderRadius: 8,
              color: "white", cursor: chatLoading ? "not-allowed" : "pointer",
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
          >↑</button>
        </div>
        {!isMobile && (
          <div style={{ color: "#1e293b", fontSize: 10, marginTop: 6, textAlign: "center", fontFamily: "monospace" }}>
            Shift+Enter for newline · Enter to send
          </div>
        )}
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        body { background: #020617; font-family: 'Space Grotesk', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        .chat-msg { animation: fadeIn 0.2s ease; }
        textarea:focus, input:focus { outline: none; }
        button:active { transform: scale(0.97); }
        /* Prevent iOS bounce */
        #root { height: 100%; overflow: hidden; }
      `}</style>

      <div style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#020617",
        overflow: "hidden",
      }}>

        {/* ── TOP BAR (always visible) ── */}
        <div style={{
          height: TOPBAR_H, padding: "0 12px",
          background: "rgba(2,6,23,0.97)",
          borderBottom: "1px solid #0f172a",
          display: "flex", alignItems: "center", gap: 10,
          backdropFilter: "blur(10px)",
          flexShrink: 0,
          zIndex: 30,
        }}>
          {/* Logo */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            paddingRight: 12, borderRight: "1px solid #1e293b",
            flexShrink: 0,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13,
            }}>⬡</div>
            {!isMobile && (
              <span style={{
                color: "#e2e8f0", fontWeight: 700, fontSize: 14,
                letterSpacing: "-0.02em",
              }}>GraphIQ</span>
            )}
          </div>

          {/* Input */}
          <div style={{ position: "relative", flex: 1, maxWidth: isMobile ? "100%" : 280 }}>
            <input
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              onKeyDown={handleOrderKeyDown}
              placeholder="Enter Order ID…"
              style={{
                width: "100%", padding: "7px 10px",
                borderRadius: 8, border: "1px solid #1e293b",
                background: "#0b1220", color: "#e2e8f0",
                fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                transition: "border-color 0.2s",
                minWidth: 0,
              }}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#1e293b"}
            />
          </div>

          <button
            onClick={loadGraph}
            disabled={graphStatus === "loading"}
            style={{
              padding: isMobile ? "7px 12px" : "7px 18px",
              background: "#2563eb",
              border: "none", borderRadius: 8,
              color: "white", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              opacity: graphStatus === "loading" ? 0.6 : 1,
              transition: "background 0.2s, opacity 0.2s",
              whiteSpace: "nowrap", flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#1d4ed8"}
            onMouseLeave={e => e.currentTarget.style.background = "#2563eb"}
          >
            {isMobile ? "⬡" : "Load Graph"}
          </button>

          <StatusPill status={graphStatus} />

          {/* Node count badge — desktop only */}
          {!isMobile && graphData.nodes.length > 0 && (
            <span style={{
              marginLeft: "auto", color: "#475569",
              fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap",
            }}>
              {graphData.nodes.length} nodes · {graphData.links.length} edges
            </span>
          )}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          overflow: "hidden",
          minHeight: 0,
        }}>
          {GraphPanel}
          {!isMobile && (
            <div style={{ width: 1, background: "#0f172a", flexShrink: 0 }} />
          )}
          {ChatPanel}
        </div>

        {/* ── MOBILE TAB BAR ── */}
        {isMobile && (
          <MobileTabBar
            activeTab={activeTab}
            onSwitch={setActiveTab}
            nodeCount={graphData.nodes.length}
          />
        )}
      </div>
    </>
  );
}