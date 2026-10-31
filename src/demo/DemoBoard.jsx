import React, { useState, useEffect } from "react";
import AuthPopup from "../auth/AuthPopup.jsx";
import RulesModal from "../rules/RulesModal.jsx";
import SettingsPopup from "../settings/SettingsPopup.jsx";
import { getRules, evaluateListRule } from "../lib/rulesStorage.js";
import { isAuthorized } from "../lib/auth.js";
import { PrismListEngineGraphic, CloseIcon } from "../lib/icons.jsx";
import "./demo.css";

// Board lists matching the Target Lists configured in the Rule Studio
const INITIAL_LISTS = [
  {
    id: "list-1",
    name: "Sprint Backlog",
    cards: [
      { id: "c1", title: "API Gateway rate limiting", count: "3", tag: "High", priority: "High" },
      { id: "c2", title: "Database indexing migration", count: "14", tag: "Medium", priority: "Medium" },
      { id: "c3", title: "Update copyright & docs", due: "May 18", age: "201d", tag: "Low", priority: "Low" },
    ],
  },
  {
    id: "list-2",
    name: "In Progress",
    cards: [
      { id: "c4", title: "Critical payment auth failure", count: "6", tag: "Urgent", priority: "Urgent", overdue: true },
      { id: "c5", title: "Component theme switching", count: "6", tag: "Medium", priority: "Medium" },
    ],
  },
  {
    id: "list-3",
    name: "Review & QA",
    cards: [
      { id: "c6", title: "Dark mode CSS contrast audit", count: "5", tag: "Medium", priority: "Medium" },
      { id: "c7", title: "Keyboard navigation tests", due: "Apr 12", tag: "Low", priority: "Low" },
    ],
  },
  {
    id: "list-4",
    name: "Done / Deployed",
    cards: [
      { id: "c8", title: "OAuth handshake protocol", done: true, tag: "Low", priority: "Low" },
      { id: "c9", title: "Vite build configuration", done: true, tag: "Low", priority: "Low" },
    ],
  },
];

export default function DemoBoard() {
  const [lists, setLists] = useState(INITIAL_LISTS);
  const [rules, setRules] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [activeView, setActiveView] = useState("rules"); // default to Rule Studio!
  const [authed, setAuthed] = useState(false);

  // Mock Trello object for standalone / demo testing
  const mockT = {
    isDemo: true,
    get: async (scope, visibility, key) => {
      try {
        const val = localStorage.getItem(`demo_${scope}_${key}`);
        return val ? JSON.parse(val) : null;
      } catch (e) {
        return null;
      }
    },
    set: async (scope, visibility, key, val) => {
      try {
        localStorage.setItem(`demo_${scope}_${key}`, JSON.stringify(val));
      } catch (e) {}
    },
    remove: async (scope, visibility, key) => {
      try {
        localStorage.removeItem(`demo_${scope}_${key}`);
      } catch (e) {}
    },
    sizeTo: () => Promise.resolve(),
    closePopup: () => setShowPopup(false),
    closeModal: () => setActiveView("board"),
    modal: () => setActiveView("rules"),
    popup: () => setShowPopup(true),
  };

  useEffect(() => {
    async function refresh() {
      const r = await getRules(mockT);
      setRules(r);
      const a = await isAuthorized(mockT);
      setAuthed(a);
    }
    refresh();

    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="trello-app-frame">
      {/* Top Demo Toolbar */}
      <div className="demo-control-bar">
        <div className="demo-title-tag">
          <PrismListEngineGraphic activeColor="#3b82f6" width={24} height={18} />
          <span>Conditional List Color Rule Studio</span>
          <span className="demo-badge">Trello Power-Up</span>
        </div>

        <div className="demo-actions">
          <button
            type="button"
            className={`demo-btn ${activeView === "rules" ? "active" : ""}`}
            onClick={() => setActiveView("rules")}
          >
            Rule Studio (Modal)
          </button>
          <button
            type="button"
            className={`demo-btn ${activeView === "board" ? "active" : ""}`}
            onClick={() => {
              setActiveView("board");
            }}
          >
            Board Live View
          </button>
          <button
            type="button"
            className={`demo-btn ${activeView === "settings" ? "active" : ""}`}
            onClick={() => setActiveView("settings")}
          >
            Settings
          </button>
          <button
            type="button"
            className={`demo-btn ${showPopup ? "active" : ""}`}
            onClick={() => setShowPopup(!showPopup)}
          >
            {showPopup ? "Hide Auth Popup" : "Auth Popup"}
          </button>
        </div>
      </div>

      {/* Main Trello Top Navigation */}
      <div className="trello-nav">
        <div className="trello-nav-left">
          <div className="trello-logo-brand">
            <span>⬚</span>
            <span>Trello</span>
          </div>
          <input
            type="text"
            className="trello-search-box"
            placeholder="Search"
            readOnly
          />
          <button type="button" className="trello-btn-create">
            Create
          </button>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#9fadbc" }}>
            {authed ? "● Connected" : "○ Local Mode"}
          </span>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#1d4ed8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "600",
              color: "#fff",
            }}
          >
            E
          </div>
        </div>
      </div>

      {/* Trello Board Header Bar */}
      <div className="board-header-bar">
        <h1 className="board-title">Sprint Engineering Board</h1>
        <div className="board-actions">
          <button
            type="button"
            onClick={() => setActiveView("rules")}
            className="board-btn-pu"
          >
            <PrismListEngineGraphic activeColor="#3b82f6" width={18} height={14} />
            <span>Conditional List Color Rule Studio</span>
          </button>
        </div>
      </div>

      {/* Rule Studio View */}
      {activeView === "rules" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <RulesModal t={mockT} onClose={() => setActiveView("board")} />
        </div>
      )}

      {/* Board Lists Canvas */}
      {activeView === "board" && (
        <div className="board-canvas">
          {lists.map((list) => {
            const match = evaluateListRule(list, list.cards, rules);
            const listBgStyle = match
              ? {
                  backgroundColor: `${match.color}1c`,
                  borderColor: `${match.color}66`,
                  boxShadow: `0 4px 16px ${match.color}26`,
                }
              : {};

            const headerStyle = match
              ? {
                  borderLeft: `4px solid ${match.color}`,
                  paddingLeft: "8px",
                }
              : {};

            return (
              <div key={list.id} className="trello-list" style={listBgStyle}>
                <div className="trello-list-header" style={headerStyle}>
                  <span className="list-title-text">{list.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="list-count-badge">
                      {list.cards.length}
                    </span>
                    {match && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: match.color,
                        }}
                        title={`Rule matched: ${match.name}`}
                      />
                    )}
                  </div>
                </div>

                <div className="trello-cards-col">
                  {list.cards.map((c) => (
                    <div key={c.id} className="trello-card">
                      {c.tag && (
                        <div
                          className="card-pill-tag"
                          style={{
                            background:
                              c.tag === "Urgent"
                                ? "#c9372c"
                                : c.tag === "High"
                                ? "#e56910"
                                : c.tag === "Medium"
                                ? "#946f00"
                                : "#4c6b1f",
                            color: "#fff",
                          }}
                        >
                          {c.tag}
                        </div>
                      )}
                      <div className="card-title">{c.title}</div>
                      {c.count && (
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#fff",
                            margin: "4px 0",
                          }}
                        >
                          {c.count}
                        </div>
                      )}
                      <div className="card-meta-row">
                        {c.due && <span>📅 {c.due}</span>}
                        {c.age && <span>Age: {c.age}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Floating Auth Popup */}
          {showPopup && (
            <div className="trello-popup-wrapper">
              <div className="trello-popup-header">
                <span className="trello-popup-header-title">
                  Authorize Conditional List Colour
                </span>
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  className="trello-popup-close"
                  title="Close popup"
                >
                  <CloseIcon width={14} height={14} />
                </button>
              </div>
              <AuthPopup t={mockT} />
            </div>
          )}
        </div>
      )}

      {/* Settings View */}
      {activeView === "settings" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#22272b",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.12)",
              padding: "20px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            }}
          >
            <SettingsPopup t={mockT} />
          </div>
        </div>
      )}
    </div>
  );
}
