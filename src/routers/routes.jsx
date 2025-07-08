import { createBrowserRouter } from "react-router-dom";

import GamePage from "@/pages/GamePage.jsx";
import LibraryPage from "@/pages/LibraryPage.jsx";
import MainPage from "@/pages/MainPage.jsx";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <MainPage />,
  },
  {
    path: "/library",
    element: <LibraryPage />,
  },
  {
    path: "/game",
    element: <GamePage />,
  },
]);

export default routes;
