import React, { useState, useEffect } from "react";
import {
  COLORS,
  COLOR_PRESETS,
  PRIORITIES,
  BOARD_LIST_NAMES,
  createNewRule,
  getRules,
  saveRules,
  STORAGE_KEY_THEME,
} from "../lib/rulesStorage.js";
import "./rules.css";

export default function RulesModal({ t, onClose }) {
  const [rules, setRules] = useState([]);
  const [boardLists, setBoardLists] = useState(BOARD_LIST_NAMES);
  const [selectedId, setSelectedId] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [loading, setLoading] = useState(true);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = prefersDark ? "dark" : "light";
      setTheme(initial);
      document.documentElement.setAttribute("data-theme", initial);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY_THEME, nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Dynamically load live board list names
  useEffect(() => {
    async function fetchLiveLists() {
      // 1. From URL query params (Extension mode)
      try {
        const params = new URLSearchParams(window.location.search);
        const urlLists = params.get("lists");
        if (urlLists) {
          const parsed = JSON.parse(decodeURIComponent(urlLists));
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBoardLists(parsed);
            return;
          }
        }
      } catch (e) {}

      // 2. From cached live lists
      try {
        const cached = localStorage.getItem("clc_live_board_lists");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBoardLists(parsed);
          }
        }
      } catch (e) {}

      // 3. From Trello Power-Up client
      if (t && typeof t.lists === "function") {
        try {
          const trelloLists = await t.lists("id", "name");
          if (Array.isArray(trelloLists) && trelloLists.length > 0) {
            const names = trelloLists.map((l) => l.name).filter(Boolean);
            if (names.length > 0) {
              setBoardLists(names);
              return;
            }
          }
        } catch (e) {}
      }

      // 4. Request from parent window via postMessage
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "CLC_GET_BOARD_LISTS" }, "*");
        }
      } catch (e) {}
    }

    fetchLiveLists();

    function handleMessage(e) {
      if (
        e.data &&
        e.data.type === "CLC_BOARD_LISTS_RESPONSE" &&
        Array.isArray(e.data.lists) &&
        e.data.lists.length > 0
      ) {
        setBoardLists(e.data.lists);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [t]);

  // Load rules on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      const loaded = await getRules(t);
      setRules(loaded);
      if (loaded.length > 0) {
        setSelectedId(loaded[0].id);
      }
      setLoading(false);
    }
    load();
  }, [t]);

  // Synchronize updates to storage
  const persistRules = async (updatedRules) => {
    setRules(updatedRules);
    await saveRules(t, updatedRules);
  };

  // Currently selected rule
  const selectedRule = rules.find((r) => r.id === selectedId) || null;

  // Add rule
  const handleAddRule = async () => {
    const newRule = createNewRule(`Rule #${rules.length + 1}`);
    const updated = [...rules, newRule];
    await persistRules(updated);
    setSelectedId(newRule.id);
  };

  // Duplicate rule
  const handleDuplicateRule = async (ruleToDuplicate) => {
    if (!ruleToDuplicate) return;
    const index = rules.findIndex((r) => r.id === ruleToDuplicate.id);
    const duplicated = {
      ...JSON.parse(JSON.stringify(ruleToDuplicate)),
      id: Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      name: `${ruleToDuplicate.name} (copy)`,
    };
    const updated = [...rules];
    updated.splice(index + 1, 0, duplicated);
    await persistRules(updated);
    setSelectedId(duplicated.id);
  };

  // Delete rule
  const handleDeleteRule = async (ruleToDelete) => {
    if (!ruleToDelete) return;
    const index = rules.findIndex((r) => r.id === ruleToDelete.id);
    const updated = rules.filter((r) => r.id !== ruleToDelete.id);
    await persistRules(updated);

    if (updated.length > 0) {
      const nextIndex = Math.min(index, updated.length - 1);
      setSelectedId(updated[nextIndex].id);
    } else {
      setSelectedId(null);
    }
  };

  // Reorder rule up/down
  const handleMoveRule = async (index, direction, e) => {
    e.stopPropagation();
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rules.length) return;

    const updated = [...rules];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    await persistRules(updated);
  };

  // Update selected rule fields
  const updateSelectedRule = async (changes) => {
    if (!selectedRule) return;
    const updated = rules.map((r) =>
      r.id === selectedRule.id ? { ...r, ...changes } : r
    );
    await persistRules(updated);
  };

  // Target list chip click
  const handleTargetListToggle = (listName) => {
    if (!selectedRule) return;

    if (listName === "ALL") {
      updateSelectedRule({ all: true, lists: [] });
      return;
    }

    let nextLists = selectedRule.lists ? [...selectedRule.lists] : [];
    if (nextLists.includes(listName)) {
      nextLists = nextLists.filter((n) => n !== listName);
    } else {
      nextLists.push(listName);
    }

    if (nextLists.length === 0) {
      updateSelectedRule({ all: true, lists: [] });
    } else {
      updateSelectedRule({ all: false, lists: nextLists });
    }
  };

  // Conditions Trigger: Add condition
  const handleAddCondition = () => {
    if (!selectedRule) return;
    if (selectedRule.conds && selectedRule.conds.length >= 6) return;

    const nextConds = [...(selectedRule.conds || []), { p: "High" }];
    updateSelectedRule({ conds: nextConds });
  };

  // Conditions Trigger: Remove condition
  const handleRemoveCondition = (indexToRemove) => {
    if (!selectedRule || !selectedRule.conds) return;
    if (selectedRule.conds.length <= 1) return;

    const nextConds = selectedRule.conds.filter((_, idx) => idx !== indexToRemove);
    updateSelectedRule({ conds: nextConds });
  };

  // Conditions Trigger: Update priority in condition
  const handleConditionPriorityChange = (indexToUpdate, newPriority) => {
    if (!selectedRule || !selectedRule.conds) return;
    const nextConds = selectedRule.conds.map((c, idx) =>
      idx === indexToUpdate ? { ...c, p: newPriority } : c
    );
    updateSelectedRule({ conds: nextConds });
  };

  const activePreset =
    COLOR_PRESETS.find((p) => p.key === selectedRule?.color) || COLOR_PRESETS[0];

  const activeRulesCount = rules.filter((r) => r.on).length;

  // Generate natural formula summary
  let formulaSummary = "";
  if (selectedRule) {
    const targetText = selectedRule.all
      ? "any list on board"
      : `[${(selectedRule.lists || []).join(", ")}]`;
    const condText = (selectedRule.conds || [])
      .map((c) => `[Priority = ${c.p}]`)
      .join(` ${selectedRule.logic || "AND"} `);
    const ruleIdx = rules.findIndex((r) => r.id === selectedRule.id) + 1;
    formulaSummary = `Rule #${ruleIdx}: If card in ${targetText} matches ${condText} → Style list with ${activePreset.name} accent.`;
  }

  return (
    <div className="studio-backdrop" data-theme={theme}>
      <div className="studio-modal">
        {/* Seamless Toolbar: No redundant duplicate window header */}
        <div className="studio-toolbar">
          <div className="studio-toolbar-left">
            <span className="studio-status-pill">
              <span className="studio-status-dot" />
              {activeRulesCount} of {rules.length} Active
            </span>
            <span className="studio-toolbar-hint">
              Rules evaluate top-to-bottom · Highest matching rule styles the list
            </span>
          </div>

          <div className="studio-toolbar-actions">
            <button
              type="button"
              className="theme-pill-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              <span>{theme === "dark" ? "☀️" : "🌙"}</span>
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
            {typeof onClose === "function" && (
              <button
                type="button"
                className="action-btn-clean"
                onClick={onClose}
                aria-label="Close"
                title="Close Studio"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Two-Sided Body Grid */}
        <div className="studio-body">
          {/* Left Sidebar: Precedence Ladder */}
          <aside className="studio-sidebar">
            <div className="sidebar-header">
              <div className="sidebar-title-badge">
                <span>Rules Order</span>
                <span className="rule-count-pill">{rules.length}</span>
              </div>
              <button
                type="button"
                className="btn-add-rule-action"
                onClick={handleAddRule}
              >
                <span>+</span>
                <span>New Rule</span>
              </button>
            </div>

            <div className="sidebar-flow-hint">
              <span>↓ Order of priority (1st match wins)</span>
            </div>

            <div className="sidebar-rules-list">
              {rules.length === 0 ? (
                <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  No rules yet.<br />Click "+ New" to create one.
                </div>
              ) : (
                rules.map((rule, idx) => {
                  const isSelected = rule.id === selectedId;
                  const isFirst = idx === 0;
                  const isLast = idx === rules.length - 1;
                  const colorHex = COLORS[rule.color] || rule.color || "#0c66e4";
                  const condCount = rule.conds ? rule.conds.length : 1;
                  const listSummary = rule.all
                    ? "All lists"
                    : `${rule.lists.length} list(s)`;

                  return (
                    <div
                      key={rule.id}
                      className={`pipeline-rule-card ${
                        isSelected ? "is-active" : ""
                      } ${!rule.on ? "is-disabled" : ""}`}
                      onClick={() => setSelectedId(rule.id)}
                    >
                      <div
                        className="rule-stripe-accent"
                        style={{ backgroundColor: colorHex }}
                      />
                      <div className="rule-card-content">
                        <div className="rule-card-title-row">
                          <span className="rule-step-number">0{idx + 1}</span>
                          <span className="rule-card-title">{rule.name}</span>
                        </div>
                        <div className="rule-card-meta">
                          <span>{listSummary}</span>
                          <span>•</span>
                          <span>{condCount} {condCount === 1 ? "cond." : "conds."}</span>
                        </div>
                      </div>
                      <div className="rule-card-actions">
                        <button
                          type="button"
                          className="arrow-btn-clean"
                          disabled={isFirst}
                          onClick={(e) => handleMoveRule(idx, -1, e)}
                          title="Move up in priority"
                          aria-label="Move Up"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="arrow-btn-clean"
                          disabled={isLast}
                          onClick={(e) => handleMoveRule(idx, 1, e)}
                          title="Move down in priority"
                          aria-label="Move Down"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Panel: Clean Unified Canvas */}
          <main className="studio-main-panel">
            {!selectedRule ? (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                <h3>No Rule Selected</h3>
                <p style={{ fontSize: "12px" }}>Select a rule from the left ladder or create a new one.</p>
              </div>
            ) : (
              <>
                {/* 1. Rule Name & Status Row */}
                <div className="editor-title-row">
                  <input
                    type="text"
                    className="rule-name-input-styled"
                    value={selectedRule.name}
                    onChange={(e) =>
                      updateSelectedRule({ name: e.target.value })
                    }
                    placeholder="e.g. Critical Blocker Alert"
                  />

                  <div
                    className="switch-control-pill"
                    onClick={() => updateSelectedRule({ on: !selectedRule.on })}
                    title={selectedRule.on ? "Rule is active" : "Rule is paused"}
                  >
                    <span className="switch-label-text">
                      {selectedRule.on ? "Active" : "Paused"}
                    </span>
                    <div className={`switch-track-styled ${selectedRule.on ? "is-on" : ""}`}>
                      <div className="switch-thumb-styled" />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="action-btn-clean"
                    title="Duplicate Rule"
                    onClick={() => handleDuplicateRule(selectedRule)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="action-btn-clean is-delete"
                    title="Delete Rule"
                    onClick={() => handleDeleteRule(selectedRule)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>

                {/* 2. Target Lists Section */}
                <div className="editor-section">
                  <span className="editor-section-eyebrow">Target Lists</span>
                  <div className="scope-chips-wrapper">
                    <button
                      type="button"
                      className={`scope-chip-btn ${selectedRule.all ? "is-active" : ""}`}
                      onClick={() => handleTargetListToggle("ALL")}
                    >
                      <span>🌐</span>
                      <span>All Board Lists</span>
                    </button>
                    {boardLists.map((name) => {
                      const isListSelected =
                        !selectedRule.all &&
                        Array.isArray(selectedRule.lists) &&
                        selectedRule.lists.includes(name);

                      return (
                        <button
                          key={name}
                          type="button"
                          className={`scope-chip-btn ${
                            isListSelected ? "is-active" : ""
                          }`}
                          onClick={() => handleTargetListToggle(name)}
                        >
                          <span>📋</span>
                          <span>{name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Conditions Section */}
                <div className="editor-section">
                  <div className="conditions-header-row">
                    <span className="editor-section-eyebrow">When Conditions Match</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div className="logic-pill-control">
                        <button
                          type="button"
                          className={`logic-toggle-item ${
                            selectedRule.logic === "AND" ? "is-selected" : ""
                          }`}
                          onClick={() => updateSelectedRule({ logic: "AND" })}
                        >
                          Match ALL (AND)
                        </button>
                        <button
                          type="button"
                          className={`logic-toggle-item ${
                            selectedRule.logic === "OR" ? "is-selected" : ""
                          }`}
                          onClick={() => updateSelectedRule({ logic: "OR" })}
                        >
                          Match ANY (OR)
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn-add-condition-styled"
                        onClick={handleAddCondition}
                        disabled={selectedRule.conds && selectedRule.conds.length >= 6}
                        title="Add another condition"
                      >
                        <span>+</span>
                        <span>Add Condition</span>
                        {selectedRule.conds && selectedRule.conds.length >= 6 && " (6 max)"}
                      </button>
                    </div>
                  </div>

                  <div className="conditions-stack">
                    {(selectedRule.conds || [{ p: "Urgent" }]).map((cond, idx) => {
                      const canRemove =
                        selectedRule.conds && selectedRule.conds.length > 1;

                      return (
                        <div key={idx} className="condition-statement-card">
                          <div className="condition-controls-sentence">
                            <span className="cond-sentence-label">List has card with</span>
                            <div className="type-badge-pill">
                              <span>⚡</span>
                              <span>Priority</span>
                            </div>

                            <span className="cond-sentence-label">equal to</span>

                            <select
                              className="select-priority-styled"
                              value={cond.p}
                              onChange={(e) =>
                                handleConditionPriorityChange(idx, e.target.value)
                              }
                            >
                              {PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                  {p} Priority
                                </option>
                              ))}
                            </select>
                          </div>

                          {canRemove && (
                            <button
                              type="button"
                              className="btn-remove-condition-clean"
                              onClick={() => handleRemoveCondition(idx)}
                              title="Remove condition"
                              aria-label="Remove Condition"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. List Accent Color Section - Sleek 1-Row Swatch Bar */}
                <div className="editor-section">
                  <div className="appearance-header-row">
                    <span className="editor-section-eyebrow">List Accent Color</span>
                    <span
                      className="selected-color-tag"
                      style={{
                        color: activePreset.hex,
                        backgroundColor: `${activePreset.hex}18`,
                        borderColor: `${activePreset.hex}40`,
                      }}
                    >
                      <span
                        className="color-dot-indicator"
                        style={{ backgroundColor: activePreset.hex }}
                      />
                      <span>{activePreset.name}</span>
                      <span className="selected-color-role">({activePreset.subtitle})</span>
                    </span>
                  </div>

                  <div className="swatches-row">
                    {COLOR_PRESETS.map((preset) => {
                      const isSelected = selectedRule.color === preset.key;

                      return (
                        <button
                          key={preset.key}
                          type="button"
                          className={`swatch-pill-btn ${isSelected ? "is-selected" : ""}`}
                          style={{ backgroundColor: preset.hex }}
                          onClick={() => updateSelectedRule({ color: preset.key })}
                          title={`${preset.name} (${preset.subtitle})`}
                          aria-label={preset.name}
                        >
                          {isSelected && (
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Natural Language Live Summary */}
                <div
                  className="rule-formula-bar"
                  style={{ borderLeftColor: activePreset.hex }}
                >
                  <span className="formula-icon">⚡</span>
                  <span className="formula-text">{formulaSummary}</span>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
