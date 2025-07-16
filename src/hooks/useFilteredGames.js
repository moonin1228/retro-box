import { useEffect, useState } from "react";

function useFilteredGames(games, searchTerm) {
  const [filteredGames, setFilteredGames] = useState([]);

  useEffect(() => {
    const filtered = games.filter((game) =>
      game.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredGames(filtered);
  }, [games, searchTerm]);

  return filteredGames;
}

export default useFilteredGames;
