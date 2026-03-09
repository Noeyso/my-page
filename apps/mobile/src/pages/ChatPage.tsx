import { useEffect, useRef, useState } from 'react';
import {
  useSessionStore,
  fetchMessages,
  sendMessage,
  type MessageRow,
} from '@my-page/shared';
import PageShell from '../components/layout/PageShell';
import dayjs from 'dayjs';

export default function ChatPage() {
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
      // 실패 시 무시
    } finally {
      setIsSending(false);
    }
  };

  return (
    <PageShell title="방명록 채팅">
      <div className="flex flex-col h-[calc(100dvh-7.5rem)]">
        {/* 메시지 목록 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              첫 번째 메시지를 보내보세요!
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.nickname === nickname;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] p-2.5 ${
                    isMine
                      ? 'bg-primary text-white'
                      : 'bg-white border border-win-dark'
                  }`}
                  style={{
                    boxShadow: isMine
                      ? 'none'
                      : 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080',
                  }}
                >
                  {!isMine && (
                    <p className="text-xs font-bold mb-1">{msg.nickname}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                    {dayjs(msg.created_at).format('HH:mm')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 입력 영역 */}
        <div className="p-3 bg-win-gray border-t-2 border-white flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지 입력..."
            className="flex-1 p-2.5 border-2 border-win-dark text-sm"
            style={{ boxShadow: 'inset 1px 1px 0 #000, inset -1px -1px 0 #fff' }}
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={isSending || !draft.trim()}
            className="btn-retro px-5 text-sm disabled:opacity-50"
          >
            전송
          </button>
        </div>
      </div>
    </PageShell>
  );
}
