import { useEffect, useRef, useState } from 'react';
import {
  useSessionStore,
  fetchMessages,
  sendMessage,
  type MessageRow,
} from '@my-page/shared';
import dayjs from 'dayjs';

export default function ChatContent() {
  const nickname = useSessionStore((s) => s.nickname);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages('chat').then(setMessages).catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending) return;
    setIsSending(true);
    try {
      const msg = await sendMessage(text, 'chat');
      setMessages((prev) => [...prev, msg]);
      setDraft('');
    } catch {
      // ignore
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[#5f7ca3] py-8">
            첫 번째 메시지를 보내보세요!
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.nickname === nickname;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] p-2.5 ${
                  isMine
                    ? 'bg-[#385f98] text-white'
                    : 'bg-[#132247] border border-[#3f5f88] text-[#dbedff]'
                }`}
              >
                {!isMine && (
                  <p className="text-xs font-bold mb-1 text-[#a6bed8]">{msg.nickname}</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-[#5f7ca3]'} text-right`}>
                  {dayjs(msg.created_at).format('HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#3f5f88] flex gap-2 bg-[#0b1230]">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="메시지 입력..."
          className="mobile-input flex-1"
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={isSending || !draft.trim()}
          className="mobile-btn px-5 text-sm disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  );
}
