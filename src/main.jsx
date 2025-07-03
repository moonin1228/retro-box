import "@/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import GameBoyEmulator from "./components/GameBoyEmulator.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GameBoyEmulator />
  </StrictMode>,
);
