import React, { useState, useEffect } from "react";
import AuthPopup from "../auth/AuthPopup.jsx";
import RulesModal from "../rules/RulesModal.jsx";
import SettingsPopup from "../settings/SettingsPopup.jsx";
import { getRules, evaluateListRule } from "../lib/rulesStorage.js";
import { PrismListEngineGraphic, CloseIcon } from "../lib/icons.jsx";
import "./demo.css";

// Sample board lists mirroring user's Trello screenshot
const INITIAL_LISTS = [
  {
    id: "list-1",
    name: "Cardlytics",
    cards: [
      { id: "c1", title: "Overdue cards", count: "3", tag: "Urgent", overdue: true },
      { id: "c2", title: "Assigned to me on all Workspace boards", count: "14" },
      { id: "c3", title: "new card", due: "May 18", age: "201d" },
    ],
  },
  {
    id: "list-2",
    name: "Trello Starter Guide",
    cards: [
      { id: "c4", title: "Dashboard", count: "6" },
      { id: "c5", title: "Dashboard", count: "6" },
      { id: "c6", title: "Dashboard", count: "6" },
    ],
  },
  {
    id: "list-3",
    name: "Today",
    cards: [
      { id: "c7", title: "Today setup card", count: "5" },
      { id: "c8", title: "HIII", gradient: true },
      { id: "c9", title: "test checklist card", checkItems: "1/3", age: "218d" },
    ],
  },
  {
    id: "list-4",
    name: "This Week",
    cards: [
      { id: "c10", title: "Weekly review items", count: "5" },
      { id: "c11", title: "new card release", age: "327d" },
      { id: "c12", title: "test3", due: "Apr 12", blocker: true },
    ],
  },
  {
    id: "list-5",
    name: "Done",
    cards: [
      { id: "c13", title: "OAuth handshake protocol", done: true },
      { id: "c14", title: "Vite build configuration", done: true },
    ],
  },
];

export default function DemoBoard() {
  const [lists, setLists] = useState(INITIAL_LISTS);
  const [rules, setRules] = useState([]);
  const [showPopup, setShowPopup] = useState(true);
  const [activeView, setActiveView] = useState("board"); // board | rules | settings | standalone_auth
  const [authed, setAuthed] = useState(false);

  // Mock Trello object for standalone / demo testing
  const mockT = {
    get: async (scope, visibility, key) => {
      try {
        return JSON.parse(localStorage.getItem(`demo_${scope}_${key}`));
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
          <PrismListEngineGraphic activeColor="#6366f1" width={24} height={18} />
          <span>Conditional List Colour Power-Up</span>
          <span className="demo-badge">Interactive Demo &amp; Preview</span>
        </div>

        <div className="demo-actions">
          <button
            type="button"
            className={`demo-btn ${activeView === "board" ? "active" : ""}`}
            onClick={() => {
              setActiveView("board");
              setShowPopup(true);
            }}
          >
            Board View (Screenshot Match)
          </button>
          <button
            type="button"
            className={`demo-btn ${activeView === "rules" ? "active" : ""}`}
            onClick={() => setActiveView("rules")}
          >
            Rules Manager
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
            {showPopup ? "Hide Auth Popup" : "Open Auth Popup"}
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
            {authed ? "● Connected" : "○ Not Authorized"}
          </span>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#6366f1",
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
        <h1 className="board-title">My Trello board</h1>
        <div className="board-actions">
          <button
            type="button"
            onClick={() => {
              setActiveView("board");
              setShowPopup(true);
            }}
            className="board-btn-pu"
          >
            <PrismListEngineGraphic activeColor="#6366f1" width={18} height={14} />
            <span>Conditional List Colour</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("rules")}
            className="board-btn-pu"
          >
            Configure Rules
          </button>
        </div>
      </div>

      {/* Board Lists Canvas */}
      {activeView === "board" && (
        <div className="board-canvas">
          {lists.map((list) => {
            const match = evaluateListRule(list, list.cards, rules);
            const listBgStyle =
              match && (match.applyTo === "both" || match.applyTo === "background")
                ? {
                    backgroundColor: `${match.color}1c`,
                    borderColor: `${match.color}66`,
                    boxShadow: `0 4px 16px ${match.color}26`,
                  }
                : {};

            const headerStyle =
              match && (match.applyTo === "both" || match.applyTo === "header")
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
                            background: c.overdue
                              ? "rgba(239, 68, 68, 0.25)"
                              : "#3b82f6",
                            color: c.overdue ? "#fca5a5" : "#fff",
                          }}
                        >
                          {c.tag}
                        </div>
                      )}
                      <div className="card-title">{c.title}</div>
                      {c.count && (
                        <div
                          style={{
                            fontSize: "28px",
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
                        {c.checkItems && <span>☑ {c.checkItems}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Interactive Floating Auth Popup - exactly positioned like screenshot */}
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

              {/* The interactive AuthPopup component! */}
              <AuthPopup t={mockT} />
            </div>
          )}
        </div>
      )}

      {/* Rules Modal View */}
      {activeView === "rules" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <RulesModal t={mockT} />
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
