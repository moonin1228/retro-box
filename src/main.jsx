import "@/index.css";

import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { initDatabase } from "@/emulator/util/indexedDBUtils.js";
import routes from "@/routers/routes.jsx";
import useRomCacheStore from "@/stores/useRomCacheStore.js";
import useSaveStore from "@/stores/useSaveStore.js";

async function initializeApp() {
  try {
    const db = await initDatabase();
    await useSaveStore.getState().initialize();
    await useRomCacheStore.getState().initialize();
  } catch (error) {
    console.error("앱 초기화 실패:", error);
  }
}

initializeApp();

createRoot(document.getElementById("root")).render(<RouterProvider router={routes} />);
