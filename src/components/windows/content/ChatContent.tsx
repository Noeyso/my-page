const guestbookMessages = [
  {
    name: 'signal_poet',
    nameColor: '#6f7db2',
    message: 'this feels like a memory booting from a crystal drive.',
    timestamp: '2026-03-02 03:12 PM',
  },
  {
    name: 'orbit_tape_99',
    nameColor: '#4f9ab4',
    message: 'the cyan glow is gentle, like late-night CRT sea light.',
    timestamp: '2026-03-02 01:41 PM',
  },
  {
    name: 'quiet_phosphor',
    nameColor: '#5ea37d',
    message: 'this channel hums like archived starlight. perfect.',
    timestamp: '2026-03-01 11:27 PM',
  },
];

export default function ChatContent() {
  return (
    <div>
      <div className="window-heading">Guestbook</div>
      <div className="inset-box mb-3">
        <div className="pixel-font mb-3 text-[20px] text-[#4c7fb4]">Leave a signal!</div>

        {guestbookMessages.map((entry) => (
          <div key={entry.name} className="chat-bubble">
            <div className="font-bold" style={{ color: entry.nameColor }}>
              {entry.name}
            </div>
            <div className="mt-1">{entry.message}</div>
            <div className="mt-1 text-[11px] text-[#4d6480]">{entry.timestamp}</div>
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="broadcast a memory..."
        className="terminal-input w-full rounded-[8px] p-2 text-[15px]"
      />
    </div>
  );
}
