// Conditional List Colors for Trello - Content Script
(function () {
  "use strict";

  const STORAGE_KEY = "conditional_list_color_rules";

  const COLORS = {
    red: "#e34935",
    orange: "#d97008",
    yellow: "#e2b203",
    green: "#1f845a",
    blue: "#0c66e4",
    teal: "#227d9b",
    purple: "#8270db",
    pink: "#e774bb",
    slate: "#626f86",
  };

  const DEFAULT_RULES = [
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
      lists: [],
      logic: "AND",
      conds: [{ p: "High" }],
      color: "orange",
    },
    {
      id: 3,
      name: "Shipped & Deployed",
      on: true,
      all: false,
      lists: [],
      logic: "AND",
      conds: [{ p: "Low" }],
      color: "green",
    },
  ];

  let currentRules = DEFAULT_RULES;

  // Load rules from chrome.storage or localStorage
  function loadRules(callback) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get([STORAGE_KEY], (res) => {
        if (res && res[STORAGE_KEY] && Array.isArray(res[STORAGE_KEY])) {
          currentRules = res[STORAGE_KEY];
        } else {
          try {
            const local = localStorage.getItem(STORAGE_KEY);
            if (local) currentRules = JSON.parse(local);
          } catch (e) {}
        }
        if (typeof callback === "function") callback(currentRules);
        applyRulesToBoard();
      });
    } else {
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) currentRules = JSON.parse(local);
      } catch (e) {}
      if (typeof callback === "function") callback(currentRules);
      applyRulesToBoard();
    }
  }

  // Listen for storage changes from popup or studio
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[STORAGE_KEY]) {
        currentRules = changes[STORAGE_KEY].newValue || DEFAULT_RULES;
        applyRulesToBoard();
      }
    });
  }

  // Get live board list names from Trello DOM
  function getLiveBoardListNames() {
    const names = [];
    const nameEls = document.querySelectorAll(
      '[data-testid="list-name"], [data-testid="list-name-textarea"], .list-header-name, .list-header-target, h2'
    );
    nameEls.forEach((el) => {
      const val = (el.value || el.textContent || "").trim();
      if (val && !names.includes(val) && !names.includes(val.toLowerCase())) {
        names.push(val);
      }
    });
    return names;
  }

  // Listen for window message from rules iframe
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "CLC_GET_BOARD_LISTS") {
      const lists = getLiveBoardListNames();
      if (event.source) {
        event.source.postMessage({ type: "CLC_BOARD_LISTS_RESPONSE", lists }, "*");
      }
    }
    if (event.data && event.data.type === "CLC_RULES_UPDATED") {
      if (Array.isArray(event.data.rules)) {
        currentRules = event.data.rules;
        applyRulesToBoard();
      }
    }
  });

  // Extract priorities present in a single card
  function getCardPriorities(cardEl) {
    const priorities = [];
    const textPieces = [];

    // 1. Labels
    const labels = cardEl.querySelectorAll(
      '[data-testid="card-label"], .card-label, .js-card-label, [data-testid="compact-card-label"], span[data-color]'
    );
    labels.forEach((l) => textPieces.push(l.textContent || ""));

    // 2. Badges
    const badges = cardEl.querySelectorAll(
      '[data-testid="badge"], .badge, .badge-text, [data-testid="trello-card-badges"] span'
    );
    badges.forEach((b) => textPieces.push(b.textContent || ""));

    // 3. Card Title / Name
    const nameEl = cardEl.querySelector(
      '[data-testid="card-name"], .list-card-title, .js-card-name'
    );
    if (nameEl) textPieces.push(nameEl.textContent || "");

    const fullText = textPieces.join(" ").toLowerCase();

    // Check priorities
    if (
      fullText.includes("urgent") ||
      fullText.includes("blocker") ||
      fullText.includes("critical") ||
      fullText.includes("p0")
    ) {
      priorities.push("Urgent");
    }
    if (
      fullText.includes("high") ||
      fullText.includes("p1") ||
      fullText.includes("important")
    ) {
      priorities.push("High");
    }
    if (
      fullText.includes("medium") ||
      fullText.includes("med") ||
      fullText.includes("p2") ||
      fullText.includes("normal")
    ) {
      priorities.push("Medium");
    }
    if (
      fullText.includes("low") ||
      fullText.includes("p3") ||
      fullText.includes("minor")
    ) {
      priorities.push("Low");
    }

    // Check overdue badge
    const isOverdue = cardEl.querySelector(
      ".is-due-past, .is-overdue, [data-testid='due-date-badge-overdue']"
    );
    if (isOverdue && !priorities.includes("Urgent")) {
      priorities.push("Urgent");
    }

    return priorities;
  }

  // Evaluate rule match for a given list
  function evaluateRule(rule, listName, allPriorities) {
    if (!rule.on) return false;

    // Check list targeting
    if (!rule.all) {
      const targeted = rule.lists || [];
      const matchesTarget = targeted.some(
        (target) =>
          target.toLowerCase().trim() === listName.toLowerCase().trim()
      );
      if (!matchesTarget) return false;
    }

    // Check conditions
    const conds = rule.conds || [];
    if (conds.length === 0) return true;

    const testCondition = (c) => allPriorities.includes(c.p);

    if (rule.logic === "OR") {
      return conds.some(testCondition);
    } else {
      return conds.every(testCondition);
    }
  }

  // Evaluate and apply colors to all lists on the board
  function applyRulesToBoard() {
    const listWrappers = document.querySelectorAll(
      '[data-testid="list-wrapper"], [data-testid="list"], .list-wrapper, .js-list, .list'
    );

    if (!listWrappers || listWrappers.length === 0) return;

    listWrappers.forEach((wrapper) => {
      // Find the actual list container element
      const listContainer = wrapper.matches('[data-testid="list"], .list, .js-list')
        ? wrapper
        : wrapper.querySelector('[data-testid="list"], .list, .js-list') || wrapper;

      // Extract list name
      const nameEl = listContainer.querySelector(
        '[data-testid="list-name"], [data-testid="list-name-textarea"], .list-header-name, h2'
      );
      const listName = nameEl
        ? (nameEl.value || nameEl.textContent || "").trim()
        : "";

      if (!listName) return;

      // Extract all cards in list
      const cardEls = listContainer.querySelectorAll(
        '[data-testid="trello-card"], [data-testid="list-card"], .list-card'
      );

      const allPriorities = [];
      cardEls.forEach((cardEl) => {
        const cardP = getCardPriorities(cardEl);
        cardP.forEach((p) => {
          if (!allPriorities.includes(p)) allPriorities.push(p);
        });
      });

      // Find first matching rule (top-to-bottom precedence)
      let matchedRule = null;
      for (const rule of currentRules) {
        if (evaluateRule(rule, listName, allPriorities)) {
          matchedRule = rule;
          break;
        }
      }

      const headerEl = listContainer.querySelector(
        '[data-testid="list-header"], .list-header'
      );
      const cardsContainer = listContainer.querySelector(
        '[data-testid="list-cards"], .list-cards'
      );

      if (matchedRule) {
        const hex = COLORS[matchedRule.color] || matchedRule.color || "#0c66e4";
        listContainer.setAttribute("data-clc-colored", "true");
        listContainer.setAttribute("data-clc-rule", matchedRule.name);

        // Apply list styling
        listContainer.style.setProperty("border-top", `4px solid ${hex}`, "important");
        listContainer.style.setProperty("background-color", `${hex}18`, "important");
        listContainer.style.setProperty("border-left", `1px solid ${hex}40`, "important");
        listContainer.style.setProperty("border-right", `1px solid ${hex}40`, "important");
        listContainer.style.setProperty("border-bottom", `1px solid ${hex}40`, "important");

        // Allow tint to shine through header and card container
        if (headerEl) {
          headerEl.style.setProperty("background", "transparent", "important");
        }
        if (cardsContainer) {
          cardsContainer.style.setProperty("background", "transparent", "important");
        }
      } else {
        if (listContainer.getAttribute("data-clc-colored") === "true") {
          listContainer.removeAttribute("data-clc-colored");
          listContainer.removeAttribute("data-clc-rule");
          listContainer.style.removeProperty("border-top");
          listContainer.style.removeProperty("background-color");
          listContainer.style.removeProperty("border-left");
          listContainer.style.removeProperty("border-right");
          listContainer.style.removeProperty("border-bottom");

          if (headerEl) headerEl.style.removeProperty("background");
          if (cardsContainer) cardsContainer.style.removeProperty("background");
        }
      }
    });
  }

  // Inject Board Header Button
  function injectHeaderButton() {
    if (document.getElementById("clc-board-btn")) return;

    // Look for board header actions row
    const targetHeader =
      document.querySelector('[data-testid="board-header"]') ||
      document.querySelector(".board-header") ||
      document.querySelector('[data-testid="board-actions"]') ||
      document.querySelector(".board-header-btns") ||
      document.querySelector(".js-board-header");

    if (!targetHeader) return;

    const btn = document.createElement("button");
    btn.id = "clc-board-btn";
    btn.className = "clc-header-btn";
    btn.title = "Configure Conditional List Colors";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
      </svg>
      <span>List Colors</span>
    `;

    btn.addEventListener("click", openRulesModal);

    targetHeader.appendChild(btn);
  }

  // Open Modal Overlay directly on Trello
  function openRulesModal() {
    if (document.getElementById("clc-modal-overlay")) return;

    // Capture live list names
    const liveLists = getLiveBoardListNames();
    try {
      localStorage.setItem("clc_live_board_lists", JSON.stringify(liveLists));
    } catch (e) {}

    const overlay = document.createElement("div");
    overlay.id = "clc-modal-overlay";
    overlay.className = "clc-modal-overlay";

    const frame = document.createElement("div");
    frame.className = "clc-modal-frame";

    const header = document.createElement("div");
    header.className = "clc-modal-header";
    header.innerHTML = `
      <span>Conditional List Color Rule Studio</span>
      <button class="clc-modal-close-btn" title="Close Studio">✕</button>
    `;

    const closeBtn = header.querySelector(".clc-modal-close-btn");
    closeBtn.addEventListener("click", closeRulesModal);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeRulesModal();
    });

    const iframe = document.createElement("iframe");
    iframe.className = "clc-modal-iframe";
    const listsQuery = encodeURIComponent(JSON.stringify(liveLists));
    iframe.src = chrome.runtime.getURL(`rules.html?lists=${listsQuery}`);

    frame.appendChild(header);
    frame.appendChild(iframe);
    overlay.appendChild(frame);
    document.body.appendChild(overlay);
  }

  function closeRulesModal() {
    const overlay = document.getElementById("clc-modal-overlay");
    if (overlay) {
      overlay.remove();
      loadRules();
    }
  }

  // Debounced Mutation Observer for real-time card and list tracking
  let debounceTimeout = null;
  const observer = new MutationObserver(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      injectHeaderButton();
      applyRulesToBoard();
    }, 120);
  });

  // Start initialization
  function init() {
    loadRules(() => {
      injectHeaderButton();
      applyRulesToBoard();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
