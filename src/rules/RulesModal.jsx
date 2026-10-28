import React, { useEffect, useState } from "react";
import {
  getRules,
  saveRules,
  COLOR_PRESETS,
} from "../lib/rulesStorage.js";
import {
  PlusIcon,
  TrashIcon,
  PaletteIcon,
  CheckIcon,
} from "../lib/icons.jsx";
import "./rules.css";

export default function RulesModal({ t }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // New rule draft state
  const [newRule, setNewRule] = useState({
    name: "",
    conditionType: "title_contains",
    conditionValue: "",
    color: "#10b981",
    applyTo: "both",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const loaded = await getRules(t);
      setRules(loaded);
      setLoading(false);
    }
    load();
  }, [t]);

  async function handleToggleRule(ruleId) {
    const updated = rules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    setRules(updated);
    await saveRules(t, updated);
  }

  async function handleDeleteRule(ruleId) {
    const updated = rules.filter((r) => r.id !== ruleId);
    setRules(updated);
    await saveRules(t, updated);
  }

  async function handleSaveNewRule(e) {
    e.preventDefault();
    if (!newRule.name.trim()) return;

    const created = {
      ...newRule,
      id: "rule-" + Date.now(),
      enabled: true,
    };

    const updated = [...rules, created];
    setRules(updated);
    await saveRules(t, updated);
    setIsAdding(false);
    setNewRule({
      name: "",
      conditionType: "title_contains",
      conditionValue: "",
      color: "#10b981",
      applyTo: "both",
    });
  }

  return (
    <div className="rules-modal-container">
      <div className="rules-header">
        <div className="rules-title-group">
          <PaletteIcon width={24} height={24} />
          <div>
            <h2 className="rules-title">Conditional List Color Rules</h2>
            <p className="rules-subtitle">
              Lists dynamically reflect these colors based on title keywords or card limits.
            </p>
          </div>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="btn-add-rule"
          >
            <PlusIcon width={16} height={16} />
            Add Rule
          </button>
        )}
      </div>

      {/* Add New Rule Form */}
      {isAdding && (
        <form onSubmit={handleSaveNewRule} className="rule-editor-card">
          <h3 className="editor-title">Create Conditional Color Rule</h3>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Rule Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Blocked & Waiting"
                value={newRule.name}
                onChange={(e) =>
                  setNewRule({ ...newRule, name: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Condition Type</label>
              <select
                className="form-select"
                value={newRule.conditionType}
                onChange={(e) =>
                  setNewRule({ ...newRule, conditionType: e.target.value })
                }
              >
                <option value="title_contains">Title Contains</option>
                <option value="title_equals">Title Equals</option>
                <option value="card_count_gt">Card Count &gt;</option>
                <option value="card_count_lt">Card Count &lt;</option>
                <option value="has_overdue">Has Overdue Cards</option>
              </select>
            </div>
          </div>

          {newRule.conditionType !== "has_overdue" && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  {newRule.conditionType.startsWith("card_count")
                    ? "Card Count Threshold"
                    : "Keyword / Match Text"}
                </label>
                <input
                  type={
                    newRule.conditionType.startsWith("card_count")
                      ? "number"
                      : "text"
                  }
                  className="form-input"
                  placeholder={
                    newRule.conditionType.startsWith("card_count")
                      ? "e.g. 5"
                      : "e.g. Blocked, Done, Review"
                  }
                  value={newRule.conditionValue}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      conditionValue: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Apply Styling To</label>
                <select
                  className="form-select"
                  value={newRule.applyTo}
                  onChange={(e) =>
                    setNewRule({ ...newRule, applyTo: e.target.value })
                  }
                >
                  <option value="both">Header Bar &amp; Background Tint</option>
                  <option value="header">Header Bar Only</option>
                  <option value="background">Background Tint Only</option>
                </select>
              </div>
            </div>
          )}

          {/* Color Palette Selector */}
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label">List Accent Color</label>
            <div className="color-picker-row">
              {COLOR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.hex}
                  onClick={() =>
                    setNewRule({ ...newRule, color: preset.hex })
                  }
                  className={`color-swatch-btn ${
                    newRule.color === preset.hex ? "selected" : ""
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          <div className="editor-btn-row">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-add-rule">
              Save Rule
            </button>
          </div>
        </form>
      )}

      {/* Rules List */}
      <div className="rules-list">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`rule-card ${!rule.enabled ? "is-disabled" : ""}`}
          >
            <div
              className="rule-color-badge"
              style={{ backgroundColor: rule.color }}
            />

            <div className="rule-info">
              <div className="rule-name-row">
                <span className="rule-name">{rule.name}</span>
                <span className="rule-condition-badge">
                  {rule.conditionType.replace(/_/g, " ")}
                  {rule.conditionValue ? `: "${rule.conditionValue}"` : ""}
                </span>
              </div>
              <div className="rule-desc">
                Applies {rule.color} tint to {rule.applyTo} of matching lists.
              </div>
            </div>

            <div className="rule-actions">
              <div
                className={`rule-toggle ${rule.enabled ? "active" : ""}`}
                onClick={() => handleToggleRule(rule.id)}
                title={rule.enabled ? "Disable Rule" : "Enable Rule"}
              >
                <div className="rule-toggle-dot" />
              </div>

              <button
                type="button"
                onClick={() => handleDeleteRule(rule.id)}
                className="btn-icon-danger"
                title="Delete Rule"
              >
                <TrashIcon width={16} height={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
