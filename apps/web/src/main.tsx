import React from "react";
import ReactDOM from "react-dom/client";
import AppHybrid from "./AppHybrid";
import "./styles/global.css";

// Hybrid Interaction System - seamlessly transitions between dialogue, action, exploration, encounters, and reflection
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppHybrid />
  </React.StrictMode>
);
