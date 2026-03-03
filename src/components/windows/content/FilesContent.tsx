const paintColors = ['#182a4d', '#365f8a', '#5f83af', '#77bdd4', '#79ba98', '#9a93c8', '#c1d7e7', '#e8f2f9'];

export default function FilesContent() {
  return (
    <div>
      <div className="window-heading">MS Paint</div>

      <div className="paint-toolbar">
        <button className="paint-tool">🖌</button>
        <button className="paint-tool">✏️</button>
        <button className="paint-tool">⬜</button>
        <button className="paint-tool">⭕</button>
        <button className="paint-tool">🪣</button>
      </div>

      <div className="paint-palette">
        {paintColors.map((color) => (
          <span key={color} style={{ background: color }} className="paint-color" />
        ))}
      </div>

      <div className="paint-canvas">
        <div className="paint-stroke stroke-1" />
        <div className="paint-stroke stroke-2" />
        <div className="paint-stroke stroke-3" />
      </div>
    </div>
  );
}
