import React, { useState, useEffect } from "react";
import {
  COLORS,
  PRIORITIES,
  BOARD_LIST_NAMES,
  PREVIEW_BOARD_LISTS,
  DEFAULT_RULES,
  createNewRule,
  getRules,
  saveRules,
  evaluateRuleMatch,
  STORAGE_KEY_THEME,
} from "../lib/rulesStorage.js";
import "./rules.css";

export default function RulesModal({ t, onClose }) {
  const [rules, setRules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [loading, setLoading] = useState(true);

  // Initialize theme from localStorage or system preference
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
    const newRule = createNewRule(`New Conditional Rule ${rules.length + 1}`);
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

    // If no specific lists are selected, fallback to ALL
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

  // Close handler
  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    } else if (t && typeof t.closeModal === "function") {
      t.closeModal();
    } else if (t && typeof t.closePopup === "function") {
      t.closePopup();
    }
  };

  return (
    <div className="studio-backdrop" data-theme={theme}>
      <div className="studio-modal">
        {/* Header */}
        <header className="studio-header">
          <div className="studio-logo-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </div>

          <div className="studio-header-text">
            <h1 className="studio-title">Conditional List Color Rule Studio</h1>
            <p className="studio-subtitle">
              Rules evaluate from top to bottom. The highest matching rule styles the list.
            </p>
          </div>

          <div className="studio-header-actions">
            <button
              type="button"
              className="studio-theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? (
                <>
                  <span>☀️</span>
                  <span>Light</span>
                </>
              ) : (
                <>
                  <span>🌙</span>
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="studio-close-btn"
              onClick={handleClose}
              aria-label="Close"
              title="Close Rule Studio"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Studio Body: Two Columns */}
        <div className="studio-body">
          {/* Left Sidebar */}
          <aside className="studio-sidebar">
            <div className="sidebar-header">
              <span className="evaluation-order-label">
                Evaluation Order ({rules.length})
              </span>
              <button
                type="button"
                className="btn-add-rule"
                onClick={handleAddRule}
              >
                + Add Rule
              </button>
            </div>

            <div className="sidebar-rules-list">
              {rules.length === 0 ? (
                <div className="sidebar-empty-state">
                  No rules yet.<br />Click "+ Add Rule" to create one.
                </div>
              ) : (
                rules.map((rule, idx) => {
                  const isSelected = rule.id === selectedId;
                  const isFirst = idx === 0;
                  const isLast = idx === rules.length - 1;
                  const colorHex = COLORS[rule.color] || rule.color || "#1d4ed8";
                  const condCount = rule.conds ? rule.conds.length : 1;
                  const listSummary = rule.all
                    ? "All lists"
                    : `${rule.lists.length} list(s)`;

                  return (
                    <div
                      key={rule.id}
                      className={`sidebar-rule-item ${
                        isSelected ? "is-selected" : ""
                      } ${!rule.on ? "is-disabled" : ""}`}
                      onClick={() => setSelectedId(rule.id)}
                    >
                      <div
                        className="rule-color-square"
                        style={{ backgroundColor: colorHex }}
                      />
                      <div className="rule-meta-info">
                        <span className="rule-name-heading">{rule.name}</span>
                        <span className="rule-summary-text">
                          {listSummary} · {condCount} condition(s)
                        </span>
                      </div>
                      <div className="reorder-arrows-col">
                        <button
                          type="button"
                          className="arrow-btn"
                          disabled={isFirst}
                          onClick={(e) => handleMoveRule(idx, -1, e)}
                          title="Move rule higher in evaluation order"
                          aria-label="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="arrow-btn"
                          disabled={isLast}
                          onClick={(e) => handleMoveRule(idx, 1, e)}
                          title="Move rule lower in evaluation order"
                          aria-label="Move Down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Panel (Selected Rule Editor) */}
          <main className="studio-main-panel">
            {!selectedRule ? (
              <div className="empty-editor-container">
                <div className="empty-editor-icon">📋</div>
                <h3 style={{ margin: 0 }}>No Rule Selected</h3>
                <p style={{ margin: 0, fontSize: "13px" }}>
                  Select an existing rule from the evaluation list or create a new one.
                </p>
                <button
                  type="button"
                  className="btn-add-rule"
                  onClick={handleAddRule}
                  style={{ marginTop: "8px" }}
                >
                  + Add Rule
                </button>
              </div>
            ) : (
              <>
                {/* 1. Rule Name & Top Actions */}
                <div className="editor-top-bar">
                  <div className="rule-name-field-group">
                    <label className="field-label-cap" htmlFor="rule-name-input">
                      Rule Name
                    </label>
                    <input
                      id="rule-name-input"
                      type="text"
                      className="rule-name-input"
                      value={selectedRule.name}
                      onChange={(e) =>
                        updateSelectedRule({ name: e.target.value })
                      }
                      placeholder="e.g. Urgent Priority Blocker Alert"
                    />
                  </div>

                  <label className="rule-enabled-toggle-btn">
                    <input
                      type="checkbox"
                      className="rule-enabled-checkbox"
                      checked={Boolean(selectedRule.on)}
                      onChange={(e) =>
                        updateSelectedRule({ on: e.target.checked })
                      }
                    />
                    <span>Rule Enabled</span>
                  </label>

                  <button
                    type="button"
                    className="action-icon-btn"
                    title="Duplicate this rule"
                    onClick={() => handleDuplicateRule(selectedRule)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="action-icon-btn is-danger"
                    title="Delete this rule"
                    onClick={() => handleDeleteRule(selectedRule)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>

                {/* 2. Target Lists Chips */}
                <div>
                  <h3 className="section-title">Target Lists</h3>
                  <div className="target-lists-chips">
                    <button
                      type="button"
                      className={`target-chip ${selectedRule.all ? "is-active" : ""}`}
                      onClick={() => handleTargetListToggle("ALL")}
                    >
                      All Lists on Board
                    </button>
                    {BOARD_LIST_NAMES.map((name) => {
                      const isListSelected =
                        !selectedRule.all &&
                        Array.isArray(selectedRule.lists) &&
                        selectedRule.lists.includes(name);

                      return (
                        <button
                          key={name}
                          type="button"
                          className={`target-chip ${
                            isListSelected ? "is-active" : ""
                          }`}
                          onClick={() => handleTargetListToggle(name)}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Conditions Trigger Box */}
                <div className="conditions-trigger-box">
                  <div className="conditions-box-header">
                    <span className="field-label-cap">Conditions Trigger</span>
                    <div className="segmented-logic-control">
                      <button
                        type="button"
                        className={`segmented-toggle-btn ${
                          selectedRule.logic === "AND" ? "is-active" : ""
                        }`}
                        onClick={() => updateSelectedRule({ logic: "AND" })}
                      >
                        Match ALL (AND)
                      </button>
                      <button
                        type="button"
                        className={`segmented-toggle-btn ${
                          selectedRule.logic === "OR" ? "is-active" : ""
                        }`}
                        onClick={() => updateSelectedRule({ logic: "OR" })}
                      >
                        Match ANY (OR)
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn-add-condition-link"
                      onClick={handleAddCondition}
                      disabled={selectedRule.conds && selectedRule.conds.length >= 6}
                      title={
                        selectedRule.conds && selectedRule.conds.length >= 6
                          ? "Maximum 6 conditions allowed"
                          : "Add another condition"
                      }
                    >
                      + Add Condition
                      {selectedRule.conds && selectedRule.conds.length >= 6 && " (Max 6)"}
                    </button>
                  </div>

                  <div className="conditions-cards-container">
                    {(selectedRule.conds || [{ p: "Urgent" }]).map((cond, idx) => {
                      const canRemove =
                        selectedRule.conds && selectedRule.conds.length > 1;

                      return (
                        <div key={idx} className="condition-card">
                          <div className="condition-card-header">
                            <span>CONDITION #{idx + 1}</span>
                            <button
                              type="button"
                              className="btn-remove-condition"
                              disabled={!canRemove}
                              onClick={() => handleRemoveCondition(idx)}
                              title={
                                canRemove
                                  ? "Remove this condition"
                                  : "At least one condition is required"
                              }
                            >
                              <span>🗑</span>
                              <span>Remove</span>
                            </button>
                          </div>

                          <div className="condition-row-controls">
                            <span className="condition-connector-text">Type:</span>
                            <select
                              disabled
                              title="Condition trigger type hardcoded to Priority"
                            >
                              <option value="priority">⚡ Priority</option>
                            </select>

                            <span className="condition-connector-text">→</span>
                            <span className="condition-connector-text">
                              List has a card with
                            </span>

                            <select
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
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. List Styling & Color Swatches */}
                <div>
                  <h3 className="section-title">🎨 List Styling &amp; Color</h3>
                  <div className="color-swatches-grid">
                    {Object.entries(COLORS).map(([colorKey, colorHex]) => {
                      const isSelected = selectedRule.color === colorKey;

                      return (
                        <div
                          key={colorKey}
                          className={`color-swatch-circle ${
                            isSelected ? "is-selected" : ""
                          }`}
                          style={{ backgroundColor: colorHex }}
                          onClick={() =>
                            updateSelectedRule({ color: colorKey })
                          }
                          title={`${colorKey.charAt(0).toUpperCase() + colorKey.slice(1)} (${colorHex})`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 5. Live Preview Mini Board */}
                <div className="live-preview-section">
                  <div className="live-preview-header">
                    <h3 className="section-title" style={{ margin: 0 }}>
                      Live Preview
                    </h3>
                    <span className="preview-subtext">
                      Top-to-bottom evaluation across sample board lists
                    </span>
                  </div>

                  <div className="live-preview-board">
                    {PREVIEW_BOARD_LISTS.map((list) => {
                      // Find first matching enabled rule
                      const matchedRule = rules.find((r) =>
                        evaluateRuleMatch(r, list)
                      );
                      const matchedColorHex = matchedRule
                        ? COLORS[matchedRule.color] || matchedRule.color
                        : null;

                      const listColumnStyle = matchedColorHex
                        ? {
                            backgroundColor: matchedColorHex,
                            borderColor: matchedColorHex,
                            color: "#ffffff",
                          }
                        : {};

                      return (
                        <div
                          key={list.name}
                          className="preview-list-column"
                          style={listColumnStyle}
                        >
                          <div className="preview-list-header">
                            <h4
                              className="preview-list-title"
                              style={{
                                color: matchedColorHex ? "#ffffff" : "inherit",
                              }}
                            >
                              {list.name}
                            </h4>
                            <span
                              className="preview-rule-badge"
                              style={{
                                color: matchedColorHex
                                  ? "rgba(255, 255, 255, 0.9)"
                                  : "var(--muted)",
                              }}
                            >
                              {matchedRule
                                ? `● ${matchedRule.name}`
                                : "○ No matching rule"}
                            </span>
                          </div>

                          <div className="preview-cards-container">
                            {list.cards.map((c) => (
                              <div key={c.id} className="preview-card-item">
                                <span className="preview-card-title">
                                  {c.title}
                                </span>
                                <span className={`priority-pill ${c.priority}`}>
                                  {c.priority}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
