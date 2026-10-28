// Rules engine & storage for Conditional List Colors

export const STORAGE_KEY_RULES = "conditional_list_color_rules";

export const COLOR_PRESETS = [
  { name: "Emerald Green", hex: "#10b981", bg: "rgba(16, 185, 129, 0.18)", border: "#059669" },
  { name: "Ocean Blue", hex: "#0c66e4", bg: "rgba(12, 102, 228, 0.18)", border: "#0052cc" },
  { name: "Coral Red", hex: "#ef4444", bg: "rgba(239, 68, 68, 0.18)", border: "#dc2626" },
  { name: "Amber Gold", hex: "#f59e0b", bg: "rgba(245, 158, 11, 0.18)", border: "#d97706" },
  { name: "Amethyst Purple", hex: "#8b5cf6", bg: "rgba(139, 92, 246, 0.18)", border: "#7c3aed" },
  { name: "Teal Cyan", hex: "#06b6d4", bg: "rgba(6, 182, 212, 0.18)", border: "#0891b2" },
  { name: "Rose Pink", hex: "#ec4899", bg: "rgba(236, 72, 153, 0.18)", border: "#db2777" },
  { name: "Charcoal Dark", hex: "#4b5563", bg: "rgba(75, 85, 99, 0.22)", border: "#374151" },
];

export const DEFAULT_RULES = [
  {
    id: "rule-1",
    enabled: true,
    name: "Completed / Done Lists",
    conditionType: "title_contains",
    conditionValue: "Done",
    color: "#10b981",
    applyTo: "both",
  },
  {
    id: "rule-2",
    enabled: true,
    name: "Work in Progress",
    conditionType: "title_contains",
    conditionValue: "Progress",
    color: "#0c66e4",
    applyTo: "both",
  },
  {
    id: "rule-3",
    enabled: true,
    name: "Urgent & Blocked",
    conditionType: "title_contains",
    conditionValue: "Blocked",
    color: "#ef4444",
    applyTo: "both",
  },
  {
    id: "rule-4",
    enabled: true,
    name: "High Card Overload (> 7 cards)",
    conditionType: "card_count_gt",
    conditionValue: "7",
    color: "#f59e0b",
    applyTo: "header",
  },
  {
    id: "rule-5",
    enabled: false,
    name: "Lists with Overdue Cards",
    conditionType: "has_overdue",
    conditionValue: "",
    color: "#ef4444",
    applyTo: "both",
  },
];

/**
 * Loads rules from Trello board-scoped shared storage with localStorage fallback
 */
export async function getRules(t) {
  let rules = null;
  if (t && typeof t.get === "function") {
    try {
      rules = await t.get("board", "shared", STORAGE_KEY_RULES);
    } catch (e) {}
  }

  if (!rules) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RULES);
      if (raw) rules = JSON.parse(raw);
    } catch (e) {}
  }

  return rules && Array.isArray(rules) && rules.length > 0 ? rules : DEFAULT_RULES;
}

/**
 * Saves rules to Trello board-scoped shared storage and localStorage
 */
export async function saveRules(t, rules) {
  try {
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
  } catch (e) {}

  if (t && typeof t.set === "function") {
    try {
      await t.set("board", "shared", STORAGE_KEY_RULES, rules);
    } catch (e) {}
  }
}

/**
 * Evaluates which rule matches a given list
 * @param {object} list - { id, name }
 * @param {Array} cards - cards in this list
 * @param {Array} rules - array of active rules
 * @returns {object|null} matching rule or null
 */
export function evaluateListRule(list, cards = [], rules = []) {
  if (!list || !Array.isArray(rules)) return null;

  for (const rule of rules) {
    if (!rule.enabled) continue;

    const listName = (list.name || "").toLowerCase();
    const val = (rule.conditionValue || "").toLowerCase();
    const count = cards.length;

    switch (rule.conditionType) {
      case "title_contains":
        if (val && listName.includes(val)) return rule;
        break;

      case "title_equals":
        if (val && listName.trim() === val.trim()) return rule;
        break;

      case "card_count_gt": {
        const threshold = parseInt(rule.conditionValue, 10);
        if (!isNaN(threshold) && count > threshold) return rule;
        break;
      }

      case "card_count_lt": {
        const threshold = parseInt(rule.conditionValue, 10);
        if (!isNaN(threshold) && count < threshold) return rule;
        break;
      }

      case "card_count_equals": {
        const threshold = parseInt(rule.conditionValue, 10);
        if (!isNaN(threshold) && count === threshold) return rule;
        break;
      }

      case "has_overdue": {
        const now = new Date().toISOString();
        const hasOverdue = cards.some(
          (c) => c.due && !c.dueComplete && c.due < now
        );
        if (hasOverdue) return rule;
        break;
      }

      default:
        break;
    }
  }

  return null;
}
