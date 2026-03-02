const guestbookMessages = [
  {
    name: 'Anonymous 💙',
    nameColor: '#0055FF',
    message: 'wow this page is so cool!!! 😍',
    timestamp: '2026-03-01 12:34 PM',
  },
  {
    name: 'StarGirl ⭐',
    nameColor: '#FF1493',
    message: 'love the vibes here!! ^_^',
    timestamp: '2026-03-01 11:20 AM',
  },
  {
    name: 'RetroFan 🌟',
    nameColor: '#00CC00',
    message: 'takes me back to MSN messenger days 💚',
    timestamp: '2026-02-28 8:15 PM',
  },
];

export default function ChatContent() {
  return (
    <div>
      <div className="window-heading">Guestbook Zone</div>
      <div className="mb-3 rounded border-2 border-[#ccc] bg-[#f0f0f0] p-3 [border-style:inset]">
        <div className="stretch-font mb-3 text-[24px] text-[#FF00C8]">💬 MY GUESTBOOK</div>

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
        placeholder="leave a message... 💌"
        className="w-full rounded-[10px] border-2 border-[#1f67d3] bg-[#f3fbff] p-2 text-lg"
      />
    </div>
  );
}
