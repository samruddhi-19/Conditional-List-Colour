// Rules engine & storage for Conditional List Color Rule Studio

export const STORAGE_KEY_RULES = "conditional_list_color_rules";
export const STORAGE_KEY_THEME = "conditional_list_color_theme";

export const COLORS = {
  blue: "#0c66e4",
  red: "#e34935",
  orange: "#d97008",
  yellow: "#e2b203",
  green: "#1f845a",
  teal: "#227d9b",
  purple: "#8270db",
  pink: "#e774bb",
  slate: "#626f86",
};

export const COLOR_PRESETS = [
  { name: "Coral Red", key: "red", hex: "#e34935", subtitle: "Critical Alerts" },
  { name: "Amber Orange", key: "orange", hex: "#d97008", subtitle: "Active Focus" },
  { name: "Sun Gold", key: "yellow", hex: "#e2b203", subtitle: "Attention Needed" },
  { name: "Emerald Green", key: "green", hex: "#1f845a", subtitle: "Shipped & Done" },
  { name: "Ocean Blue", key: "blue", hex: "#0c66e4", subtitle: "Sprint Backlog" },
  { name: "Teal Cyan", key: "teal", hex: "#227d9b", subtitle: "In Progress" },
  { name: "Amethyst Purple", key: "purple", hex: "#8270db", subtitle: "Review & QA" },
  { name: "Rose Pink", key: "pink", hex: "#e774bb", subtitle: "Design & UX" },
  { name: "Slate Charcoal", key: "slate", hex: "#626f86", subtitle: "Archived & Other" },
];

export const PRIORITIES = ["Urgent", "High", "Medium", "Low", "Any"];

export const BOARD_LIST_NAMES = [
  "Sprint Backlog",
  "In Progress",
  "Review & QA",
  "Done / Deployed",
];

// Sample board lists with realistic card tasks & priority badges for live preview
export const PREVIEW_BOARD_LISTS = [
  {
    name: "Sprint Backlog",
    cards: [
      { id: "sb-1", title: "API Gateway rate limiting", priority: "High" },
      { id: "sb-2", title: "Database indexing migration", priority: "Medium" },
      { id: "sb-3", title: "Update copyright & docs", priority: "Low" },
    ],
  },
  {
    name: "In Progress",
    cards: [
      { id: "ip-1", title: "Critical payment auth failure", priority: "Urgent" },
      { id: "ip-2", title: "Component theme switching", priority: "Medium" },
    ],
  },
  {
    name: "Review & QA",
    cards: [
      { id: "qa-1", title: "Dark mode CSS contrast audit", priority: "Medium" },
      { id: "qa-2", title: "Keyboard navigation tests", priority: "Low" },
    ],
  },
  {
    name: "Done / Deployed",
    cards: [
      { id: "dn-1", title: "Vite 5 bundling setup", priority: "Low" },
    ],
  },
];

export const DEFAULT_RULES = [
  {
    id: 1,
    name: "Critical Blocker Alert",
    on: true,
    all: true,
    lists: [],
    logic: "AND",
    conds: [{ p: "Urgent" }],
    color: "red",
  },
  {
    id: 2,
    name: "Active High-Priority Work",
    on: true,
    all: false,
    lists: ["Sprint Backlog", "In Progress"],
    logic: "AND",
    conds: [{ p: "High" }],
    color: "orange",
  },
  {
    id: 3,
    name: "Shipped & Deployed",
    on: true,
    all: false,
    lists: ["Done / Deployed"],
    logic: "AND",
    conds: [{ p: "Low" }],
    color: "green",
  },
];

/**
 * Creates a blank new rule with sensible defaults
 */
let uidCounter = 100;
export function createNewRule(name = "New Conditional Rule") {
  return {
    id: ++uidCounter + "-" + Date.now(),
    name,
    on: true,
    all: true,
    lists: [],
    logic: "AND",
    conds: [{ p: "Urgent" }],
    color: "blue",
  };
}

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

  if (rules && Array.isArray(rules) && rules.length > 0) {
    // Normalize format in case rules were stored in legacy structure
    return rules.map((r, idx) => ({
      id: r.id || idx + 1,
      name: r.name || `Rule #${idx + 1}`,
      on: r.on !== undefined ? Boolean(r.on) : (r.enabled !== undefined ? Boolean(r.enabled) : true),
      all: r.all !== undefined ? Boolean(r.all) : (!r.lists || r.lists.length === 0),
      lists: Array.isArray(r.lists) ? r.lists : [],
      logic: r.logic === "OR" ? "OR" : "AND",
      conds: Array.isArray(r.conds) && r.conds.length > 0
        ? r.conds
        : [{ p: r.priority || "Urgent" }],
      color: COLORS[r.color] ? r.color : (Object.keys(COLORS).find(k => COLORS[k] === r.color) || "blue"),
    }));
  }

  return DEFAULT_RULES;
}

/**
 * Saves rules to Trello board-scoped shared storage and localStorage
 */
export async function saveRules(t, rules) {
  try {
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
  } catch (e) {}

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    try {
      chrome.storage.sync.set({ [STORAGE_KEY_RULES]: rules });
    } catch (e) {}
  }

  // Notify parent window (e.g., Trello extension content script)
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "CLC_RULES_UPDATED", rules }, "*");
    }
  } catch (e) {}

  if (t && typeof t.set === "function") {
    try {
      await t.set("board", "shared", STORAGE_KEY_RULES, rules);
    } catch (e) {}
  }
}

/**
 * Checks if a single rule matches a list
 * @param {object} rule
 * @param {object} list - { name or n, cards or c }
 * @returns {boolean}
 */
export function evaluateRuleMatch(rule, list) {
  const isEnabled = rule.on !== undefined ? rule.on : rule.enabled;
  if (!isEnabled) return false;

  const listName = list.n || list.name || "";
  if (!rule.all) {
    const targetLists = rule.lists || [];
    const matchesTarget = targetLists.some(
      (tgt) => tgt.trim().toLowerCase() === listName.trim().toLowerCase()
    );
    if (!matchesTarget) {
      return false;
    }
  }

  // Extract priorities in the list
  let priorities = [];
  if (Array.isArray(list.c)) {
    priorities = list.c;
  } else if (Array.isArray(list.cards)) {
    priorities = list.cards.map((c) =>
      typeof c === "string" ? c : (c.priority || c.tag || (c.overdue ? "Urgent" : "Low"))
    );
  }

  const conds = rule.conds || [];
  if (conds.length === 0) return true;

  const testCondition = (c) => c.p === "Any" || priorities.includes(c.p);

  if (rule.logic === "OR") {
    return conds.some(testCondition);
  } else {
    return conds.every(testCondition);
  }
}

/**
 * Evaluates rules from top to bottom. The first matching rule styles the list.
 * @param {object} list
 * @param {Array} rules
 * @returns {object|null} the first matching rule, or null if none match
 */
export function getMatchingRule(list, rules = []) {
  if (!list || !Array.isArray(rules)) return null;
  for (const rule of rules) {
    if (evaluateRuleMatch(rule, list)) {
      return rule;
    }
  }
  return null;
}

/**
 * Backward compatibility evaluator for board views
 */
export function evaluateListRule(list, cards = [], rules = []) {
  if (!list || !Array.isArray(rules)) return null;
  const listObj = {
    name: list.name || list.n || "",
    cards: cards || list.cards || [],
  };
  const match = getMatchingRule(listObj, rules);
  if (!match) return null;

  const hex = COLORS[match.color] || match.color || "#1d4ed8";
  return {
    ...match,
    color: hex,
    colorKey: match.color,
    applyTo: "both",
  };
}
