import React, { useEffect, useRef, useState } from "react";
import {
  APP_NAME,
  AUTH_MESSAGE_SOURCE,
  BROADCAST_CHANNEL_NAME,
  buildAuthorizeUrl,
  saveToken,
} from "../lib/auth.js";
import {
  PrismListEngineGraphic,
  ShieldLockIcon,
  SparkleWandIcon,
  ZapIcon,
  CheckIcon,
  SpinnerIcon,
} from "../lib/icons.jsx";
import "./auth.css";

const PREVIEW_THEMES = [
  { id: "flow", name: "Flow", color: "#6366f1" },
  { id: "done", name: "Done", color: "#10b981" },
  { id: "alert", name: "Alert", color: "#ef4444" },
  { id: "limit", name: "WIP Limit", color: "#f59e0b" },
];

export default function AuthPopup({ t }) {
  const [status, setStatus] = useState("idle"); // idle | waiting | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTheme, setActiveTheme] = useState(PREVIEW_THEMES[0]);
  const [showDetails, setShowDetails] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    async function handleToken(token) {
      if (!token) return;
      try {
        await saveToken(t, token);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          "Failed to store authorization credentials: " +
            (err.message || "Unknown error")
        );
      }
    }

    async function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.source !== AUTH_MESSAGE_SOURCE) return;

      if (!event.data.token) {
        setStatus("error");
        setErrorMessage("No authorization token was received from Trello.");
        return;
      }

      await handleToken(event.data.token);
    }

    // BroadcastChannel support
    let bc = null;
    try {
      bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data && event.data.token) {
          handleToken(event.data.token);
        }
      };
    } catch (e) {}

    // Storage event support
    function handleStorage(e) {
      if (e.key === "trello_token" && e.newValue) {
        handleToken(e.newValue);
      }
    }

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
    };
  }, [t]);

  // Dynamically resize Trello popup container
  useEffect(() => {
    if (t && typeof t.sizeTo === "function") {
      t.sizeTo("#root").catch(() => {});
    }
  }, [t, status, showDetails]);

  function handleAuthorize() {
    setStatus("waiting");
    setErrorMessage("");

    const returnUrl = `${window.location.origin}/authorized.html`;
    const authUrl = buildAuthorizeUrl(returnUrl);

    const width = 580;
    const height = 750;

    const screenWidth =
      window.screen?.availWidth || window.screen?.width || 1280;
    const screenHeight =
      window.screen?.availHeight || window.screen?.height || 800;

    const left = Math.max(0, Math.round((screenWidth - width) / 2));
    const top = Math.max(0, Math.round((screenHeight - height) / 2));

    popupRef.current = window.open(
      authUrl,
      "trelloAuthPopup",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
    );

    if (
      !popupRef.current ||
      popupRef.current.closed ||
      typeof popupRef.current.closed === "undefined"
    ) {
      setStatus("error");
      setErrorMessage(
        "Popup was blocked by your browser. Please allow popups for this site and click Try Again."
      );
    }
  }

  // Instant simulator for local testing
  function handleSimulateSuccess() {
    setStatus("waiting");
    setTimeout(async () => {
      const mockToken = "mock_trello_token_" + Date.now();
      await saveToken(t, mockToken);
      setStatus("success");
    }, 700);
  }

  function handleOpenRulesManager() {
    if (t && typeof t.modal === "function") {
      t.modal({
        url: "./rules.html",
        accentColor: activeTheme.color,
        fullscreen: false,
        height: 520,
        width: 700,
        title: "Conditional List Colour - Rules & Presets",
      });
    } else {
      window.location.href = "./rules.html";
    }
    if (t && typeof t.closePopup === "function") {
      t.closePopup();
    }
  }

  function handleClose() {
    if (t && typeof t.closePopup === "function") {
      t.closePopup();
    }
  }

  // Success view with celebratory feedback
  if (status === "success") {
    return (
      <div className="auth-popup-container">
        <div className="auth-success-circle">
          <CheckIcon width={30} height={30} />
        </div>
        <h3 className="auth-title">Connected to {APP_NAME}</h3>
        <p className="auth-subtitle" style={{ marginBottom: "20px" }}>
          Your Trello board is now ready for dynamic list tints, automated WIP limit alerts, and custom conditions.
        </p>

        <button
          type="button"
          onClick={handleOpenRulesManager}
          className="auth-btn-primary"
        >
          <SparkleWandIcon width={16} height={16} />
          <span>Configure List Colors</span>
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="auth-toggle-link"
          style={{ marginTop: "16px" }}
        >
          Close &amp; Return to Board
        </button>
      </div>
    );
  }

  return (
    <div className="auth-popup-container">
      {/* Brand Identity Badge */}
      <div className="auth-brand-badge">
        <ZapIcon width={12} height={12} />
        <span>Trello Power-Up</span>
      </div>

      {/* Main Header Title */}
      <h3 className="auth-title">{APP_NAME}</h3>

      {/* Hero Subtitle */}
      <p className="auth-subtitle">
        Automatically tint lists and highlight overdue work with conditional rules.
      </p>

      {/* Bespoke Interactive Chromatic Engine Visual */}
      <div
        className={`auth-hero-visual ${
          status === "waiting" ? "is-waiting" : ""
        }`}
      >
        <PrismListEngineGraphic
          activeColor={activeTheme.color}
          width={130}
          height={90}
        />
      </div>

      {/* Interactive Theme Switcher Pills */}
      <div className="auth-theme-pills">
        {PREVIEW_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`theme-pill-btn ${
              activeTheme.id === theme.id ? "is-active" : ""
            }`}
            onClick={() => setActiveTheme(theme)}
            title={`Preview ${theme.name} palette`}
          >
            <span
              className="theme-dot"
              style={{ backgroundColor: theme.color }}
            />
            <span>{theme.name}</span>
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {status === "error" && (
        <div className="auth-error-banner">
          {errorMessage ||
            "Unable to connect with Trello. Please ensure popups are permitted."}
        </div>
      )}

      {/* Elevated Gradient Action Button */}
      <button
        type="button"
        onClick={handleAuthorize}
        disabled={status === "waiting"}
        className="auth-btn-primary"
        id="btn-auth-connect"
      >
        {status === "waiting" ? (
          <>
            <SpinnerIcon width={16} height={16} />
            Waiting for approval…
          </>
        ) : status === "error" ? (
          "Try Again"
        ) : (
          <>
            <SparkleWandIcon width={16} height={16} />
            <span>Connect with Trello</span>
          </>
        )}
      </button>

      {/* Waiting Status Feedback */}
      {status === "waiting" && (
        <div className="auth-waiting-box">
          <div>
            <span className="dot-pulse" />
            Complete authorization in the opened Trello window.
          </div>
          <button
            type="button"
            onClick={handleAuthorize}
            className="auth-action-link"
          >
            Re-open authorization popup
          </button>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="auth-action-link"
            style={{ color: "var(--pu-text-muted)", fontSize: "11px" }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Trust & Privacy Reassurance */}
      <div className="auth-trust-row">
        <div className="trust-badge-item">
          <ShieldLockIcon width={13} height={13} />
          <span>Member-Private</span>
        </div>
        <div className="trust-badge-item">
          <ZapIcon width={13} height={13} />
          <span>Zero External Storage</span>
        </div>
      </div>

      {/* Interactive Accordion for Feature Transparency */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="auth-toggle-link"
      >
        {showDetails ? "Hide rule details" : "How conditional rules work"}
      </button>

      {showDetails && (
        <div className="auth-feature-drawer">
          <div className="auth-feature-row">
            <span>🏷️</span>
            <span>
              <strong>List Name:</strong> Highlight when title contains "Done",
              "Review", "Blocked".
            </span>
          </div>
          <div className="auth-feature-row">
            <span>📊</span>
            <span>
              <strong>WIP Limits:</strong> Color-code lists exceeding maximum card
              limits.
            </span>
          </div>
          <div className="auth-feature-row">
            <span>⏰</span>
            <span>
              <strong>Overdue Check:</strong> Amber/Red warning on lists with past-due
              cards.
            </span>
          </div>
        </div>
      )}

      {/* Local Simulation for Testing */}
      <div className="auth-dev-ribbon">
        <span>Dev Preview:</span>
        <button
          type="button"
          onClick={handleSimulateSuccess}
          className="auth-dev-tag-btn"
          title="Simulate instant OAuth success for testing"
        >
          Simulate Auth
        </button>
      </div>
    </div>
  );
}
