import GameCart from "@/components/cartridge/GameCart.jsx";

function GameList({ games, onPlay, onDelete }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-5 lg:gap-5">
      {games.map((game) => (
        <GameCart
          key={game.id}
          romData={game.romData}
          title={game.title}
          onPlay={() => onPlay(game)}
          onDelete={() => onDelete(game)}
          isUserGame={game.isUserGame}
        />
      ))}
    </div>
  );
}

export default GameList;
