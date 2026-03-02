const guestbookMessages = [
  {
    name: 'pixel_fairy',
    nameColor: '#ff4fb0',
    message: 'this desktop is sooo cute omg ♡',
    timestamp: '2026-03-02 03:12 PM',
  },
  {
    name: 'cd_ripper_99',
    nameColor: '#2d89ff',
    message: 'xp sky + stickers = peak internet bedroom',
    timestamp: '2026-03-02 01:41 PM',
  },
  {
    name: 'tinyminesweeper',
    nameColor: '#2fcf67',
    message: 'dropping by to lose at minesweeper again',
    timestamp: '2026-03-01 11:27 PM',
  },
];

export default function ChatContent() {
  return (
    <div>
      <div className="window-heading">Guestbook</div>
      <div className="inset-box mb-3">
        <div className="pixel-font mb-3 text-[20px] text-[#ff4fb0]">Leave a message!</div>

        {guestbookMessages.map((entry) => (
          <div key={entry.name} className="chat-bubble">
            <div className="font-bold" style={{ color: entry.nameColor }}>
              {entry.name}
            </div>
            <div className="mt-1">{entry.message}</div>
            <div className="mt-1 text-[11px] text-[#666]">{entry.timestamp}</div>
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="write something cute..."
        className="terminal-input w-full rounded-[8px] p-2 text-[15px]"
      />
    </div>
  );
}
