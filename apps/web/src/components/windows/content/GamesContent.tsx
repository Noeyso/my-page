import { getLaunchpadApps } from '../../../data/apps';

const GAME_IDS = ['tetris', 'minesweeper', 'snake', 'fortress'];

const games = getLaunchpadApps().filter((app) => GAME_IDS.includes(app.id));

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
            onDoubleClick={() => openGame(game.id)}
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
