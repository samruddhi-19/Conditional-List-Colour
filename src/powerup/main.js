/* global TrelloPowerUp */
import { isAuthorized } from "../lib/auth.js";

const ICON_URL =
  typeof window !== "undefined"
    ? new URL("./icons/icon.svg", window.location.href).href
    : "./icons/icon.svg";

TrelloPowerUp.initialize({
  // Capability: Check authorization status
  "authorization-status": async function (t) {
    const authorized = await isAuthorized(t);
    return { authorized };
  },

  // Capability: Show authorization popup
  "show-authorization": function (t) {
    return t.popup({
      title: "Authorize Conditional List Colors",
      url: "./auth.html",
      height: 380,
    });
  },

  // Capability: Show Power-Up settings
  "show-settings": function (t) {
    return t.popup({
      title: "Conditional List Colors Settings",
      url: "./settings.html",
      height: 380,
    });
  },

  // Capability: Board header button for opening List Colors manager
  "board-buttons": function () {
    return [
      {
        icon: {
          dark: ICON_URL,
          light: ICON_URL,
        },
        text: "List Colors",
        callback: async function (t) {
          const authorized = await isAuthorized(t);
          if (!authorized) {
            return t.popup({
              title: "Authorize Conditional List Colors",
              url: "./auth.html",
              height: 380,
            });
          }

          return t.modal({
            url: "./rules.html",
            accentColor: "#0c66e4",
            fullscreen: false,
            height: 520,
            width: 700,
            title: "Conditional List Colors - Rules & Themes",
          });
        },
      },
    ];
  },

  // Capability: List action dropdown item
  "list-actions": function (t) {
    return [
      {
        text: "Configure List Colors…",
        callback: async function (t) {
          const authorized = await isAuthorized(t);
          if (!authorized) {
            return t.popup({
              title: "Authorize Conditional List Colors",
              url: "./auth.html",
              height: 380,
            });
          }

          return t.modal({
            url: "./rules.html",
            accentColor: "#0c66e4",
            fullscreen: false,
            height: 520,
            width: 700,
            title: "Conditional List Colors - Rules & Themes",
          });
        },
      },
    ];
  },
});
