import iconTetris from '../../../../assets/icon-tetris.png';
import iconMinesweeper from '../../../../assets/icon-minsweeper.png';
import iconSnake from '../../../../assets/icon-snake.png';

interface GameItem {
  id: string;
  img: string;
  label: string;
  windowType: string;
}

const games: GameItem[] = [
  { id: 'tetris', img: iconTetris, label: 'Tetris', windowType: 'tetris' },
  { id: 'minesweeper', img: iconMinesweeper, label: 'Minesweeper', windowType: 'minesweeper' },
  { id: 'snake', img: iconSnake, label: 'Snake', windowType: 'snake' },
];

export default function GamesContent() {
  const openGame = (windowType: string) => {
    window.dispatchEvent(
      new CustomEvent('open-window', { detail: { windowType } }),
    );
  };

  return (
    <div className="games-folder">
      <div className="games-folder-grid">
        {games.map((game) => (
          <div
            key={game.id}
            className="games-folder-item"
            onDoubleClick={() => openGame(game.windowType)}
          >
            <img
              src={game.img}
              alt={game.label}
              className="games-folder-icon-img"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="games-folder-label">{game.label}</div>
          </div>
        ))}
      </div>
      <div className="games-folder-statusbar">
        {games.length} object(s)
      </div>
    </div>
  );
}
