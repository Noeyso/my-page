const mineCells = [
  '1', ' ', '1', '💣', '2', '1', ' ', ' ',
  '1', '1', '2', '2', '💣', '1', ' ', ' ',
  ' ', '1', '💣', '2', '1', '1', ' ', ' ',
  ' ', '1', '1', '1', ' ', '1', '1', '1',
  ' ', ' ', ' ', ' ', ' ', '1', '💣', '1',
  '1', '1', ' ', ' ', ' ', '1', '1', '1',
  '💣', '1', ' ', '1', '1', '1', ' ', ' ',
  '1', '1', ' ', '1', '💣', '1', ' ', ' ',
];

export default function SystemContent() {
  return (
    <div>
      <div className="window-heading">Minesweeper</div>
      <div className="mine-panel">
        <div className="mine-topbar">
          <span>🚩 03</span>
          <button className="mine-face">🙂</button>
          <span>021</span>
        </div>

        <div className="mine-grid">
          {mineCells.map((cell, index) => (
            <div key={index} className="mine-cell">
              {cell}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
