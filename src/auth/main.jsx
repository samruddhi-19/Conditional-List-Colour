import React from "react";
import ReactDOM from "react-dom/client";
import AuthPopup from "./AuthPopup.jsx";

const t =
  typeof window !== "undefined" && window.TrelloPowerUp
    ? window.TrelloPowerUp.iframe()
    : null;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthPopup t={t} />
  </React.StrictMode>
);
