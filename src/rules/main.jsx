import React from "react";
import ReactDOM from "react-dom/client";
import RulesModal from "./RulesModal.jsx";

const t =
  typeof window !== "undefined" && window.TrelloPowerUp
    ? window.TrelloPowerUp.iframe()
    : null;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RulesModal t={t} />
  </React.StrictMode>
);
