const paintColors = ['#000000', '#ff2e2e', '#ff8f1f', '#ffe34a', '#47cf58', '#2ca5ff', '#9f67ff', '#ff76cc'];

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
