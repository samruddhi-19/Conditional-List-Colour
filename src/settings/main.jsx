import React from "react";
import ReactDOM from "react-dom/client";
import SettingsPopup from "./SettingsPopup.jsx";

const t =
  typeof window !== "undefined" && window.TrelloPowerUp
    ? window.TrelloPowerUp.iframe()
    : null;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SettingsPopup t={t} />
  </React.StrictMode>
);
