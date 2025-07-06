import { createBrowserRouter } from "react-router-dom";

import GamePage from "@/pages/GamePage.jsx";
import MainPage from "@/pages/MainPage.jsx";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <MainPage />,
  },
  {
    path: "/game",
    element: <GamePage />,
  },
]);

export default routes;
