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

export const CONDITION_TYPES = [
  { id: "due_date", label: "Due Date", icon: "📅" },
  { id: "task_count", label: "Number of Task", icon: "🔢" },
  { id: "checklist", label: "Checklist", icon: "☑️" },
  { id: "priority", label: "Priority", icon: "⚡" },
];

export const CONDITION_OPTIONS = {
  due_date: [
    { value: "overdue", label: "🔴 Due Date Crossed (Overdue)" },
    { value: "today", label: "🟡 Due Today" },
    { value: "tomorrow", label: "🟠 Due Within 24 Hours / Tomorrow" },
    { value: "week", label: "🔵 Due This Week" },
    { value: "no_date", label: "⚪ No Due Date Set" },
    { value: "complete", label: "🟢 Due Date Marked Completed" },
  ],
  task_count: [
    { value: "gt_10", label: "🚨 More than 10 Tasks (> 10)" },
    { value: "gt_5", label: "⚠️ More than 5 Tasks (> 5)" },
    { value: "gt_3", label: "📊 More than 3 Tasks (> 3)" },
    { value: "lt_3", label: "📉 Less than 3 Tasks (< 3)" },
    { value: "empty", label: "📭 Empty List (0 Tasks)" },
    { value: "has_tasks", label: "✨ Has at least 1 Task" },
  ],
  checklist: [
    { value: "incomplete", label: "⏳ Has Incomplete Checklist Items" },
    { value: "complete", label: "✅ All Checklist Items Completed" },
    { value: "has_checklist", label: "📝 Has Any Checklist" },
    { value: "no_checklist", label: "📋 Has No Checklist" },
  ],
  priority: [
    { value: "Urgent", label: "⚡ Urgent Priority (Blocker/P0)" },
    { value: "High", label: "🔥 High Priority (P1)" },
    { value: "Medium", label: "🟡 Medium Priority (P2)" },
    { value: "Low", label: "🟢 Low Priority (P3)" },
    { value: "Any", label: "✨ Any Card (Always Match)" },
  ],
};

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
      { id: "sb-1", title: "API Gateway rate limiting", count: "3", priority: "High" },
      { id: "sb-2", title: "Database indexing migration", count: "14", priority: "Medium" },
      { id: "sb-3", title: "Update copyright & docs", due: "May 18", count: "2", priority: "Low" },
    ],
  },
  {
    name: "In Progress",
    cards: [
      { id: "ip-1", title: "Critical payment auth failure", count: "6", priority: "Urgent", overdue: true },
      { id: "ip-2", title: "Component theme switching", count: "6", priority: "Medium" },
    ],
  },
  {
    name: "Review & QA",
    cards: [
      { id: "qa-1", title: "Dark mode CSS contrast audit", count: "5", priority: "Medium" },
      { id: "qa-2", title: "Keyboard navigation tests", due: "Apr 12", count: "1", priority: "Low" },
    ],
  },
  {
    name: "Done / Deployed",
    cards: [
      { id: "dn-1", title: "Vite 5 bundling setup", done: true, count: "4", priority: "Low" },
    ],
  },
];

export const DEFAULT_RULES = [
  {
    id: 1,
    name: "Critical Overdue Alert",
    on: true,
    all: true,
    lists: [],
    logic: "AND",
    conds: [{ type: "due_date", value: "overdue" }],
    color: "red",
  },
  {
    id: 2,
    name: "Active High-Priority Work",
    on: true,
    all: false,
    lists: ["Sprint Backlog", "In Progress"],
    logic: "AND",
    conds: [{ type: "priority", value: "High" }],
    color: "orange",
  },
  {
    id: 3,
    name: "Overloaded Backlog Notice",
    on: true,
    all: false,
    lists: ["Sprint Backlog"],
    logic: "AND",
    conds: [{ type: "task_count", value: "gt_5" }],
    color: "yellow",
  },
  {
    id: 4,
    name: "Shipped & Completed",
    on: true,
    all: false,
    lists: ["Done / Deployed"],
    logic: "AND",
    conds: [{ type: "checklist", value: "complete" }],
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
    conds: [{ type: "due_date", value: "overdue" }],
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
        ? r.conds.map((c) => {
            if (c.type && c.value) return c;
            if (c.p) return { type: "priority", value: c.p };
            return { type: "due_date", value: "overdue" };
          })
        : [{ type: "due_date", value: "overdue" }],
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
 * Evaluates a single condition against a list's cards and priorities
 */
export function evaluateSingleCondition(cond, cards = [], listPriorities = []) {
  const type = cond.type || (cond.p ? "priority" : "due_date");
  const value = cond.value || cond.p || (type === "due_date" ? "overdue" : "Urgent");

  // 1. Task Count (Number of Task)
  if (type === "task_count") {
    const count = cards.length;
    if (value === "gt_10") return count > 10;
    if (value === "gt_5") return count > 5;
    if (value === "gt_3") return count > 3;
    if (value === "lt_3") return count > 0 && count < 3;
    if (value === "empty") return count === 0;
    if (value === "has_tasks") return count > 0;
    return false;
  }

  // 2. Due Date
  if (type === "due_date") {
    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const endOfToday = new Date().setHours(23, 59, 59, 999);
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;

    return cards.some((card) => {
      // Demo mock card overdue flag
      if (card.overdue && value === "overdue") return true;

      if (value === "no_date") return !card.due;
      if (!card.due) return false;

      const dueTime = new Date(card.due).getTime();
      const isComplete = Boolean(card.dueComplete);

      if (value === "complete") return isComplete;
      if (isComplete) return false;

      if (value === "overdue") return dueTime < now || card.overdue;
      if (value === "today") return dueTime >= startOfToday && dueTime <= endOfToday;
      if (value === "tomorrow") return dueTime >= now && dueTime <= now + oneDayMs;
      if (value === "week") return dueTime >= now && dueTime <= now + sevenDaysMs;
      return false;
    });
  }

  // 3. Checklist
  if (type === "checklist") {
    return cards.some((card) => {
      const badges = card.badges || {};
      const total =
        badges.checkItems !== undefined
          ? badges.checkItems
          : card.count
            ? parseInt(card.count, 10)
            : 0;
      const checked =
        badges.checkItemsChecked !== undefined
          ? badges.checkItemsChecked
          : card.done
            ? total
            : 0;

      if (value === "no_checklist") return total === 0;
      if (value === "has_checklist") return total > 0;
      if (value === "incomplete") return total > 0 && checked < total;
      if (value === "complete") return total > 0 && checked === total;
      return false;
    });
  }

  // 4. Priority
  if (type === "priority") {
    if (value === "Any") return cards.length > 0;
    if (listPriorities.includes(value)) return true;
    return cards.some((card) => {
      const p = card.priority || card.tag;
      if (p === value) return true;
      if (
        value === "Urgent" &&
        (card.overdue ||
          (card.labels &&
            card.labels.some(
              (l) =>
                (l.name || l.color || "").toLowerCase().includes("urgent") ||
                l.color === "red"
            )))
      ) {
        return true;
      }
      return false;
    });
  }

  return false;
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

  const cards = Array.isArray(list.cards) ? list.cards : [];
  let priorities = [];
  if (Array.isArray(list.c)) {
    priorities = list.c;
  } else if (cards.length > 0) {
    priorities = cards.map((c) =>
      typeof c === "string" ? c : (c.priority || c.tag || (c.overdue ? "Urgent" : "Low"))
    );
  }

  const conds = rule.conds || [];
  if (conds.length === 0) return true;

  const testCondition = (cond) => evaluateSingleCondition(cond, cards, priorities);

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
