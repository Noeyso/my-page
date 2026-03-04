import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMessages, MessageRow, sendMessage } from '../services/messageService';

interface ChatWindowProps {
  type?: string;
  heading: string;
  placeholder: string;
}

const formatMessageTime = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export default function ChatWindow({ type = 'chat', heading, placeholder }: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isActive = true;

    const loadMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const rows = await fetchMessages(type);
        if (isActive) setMessages([...rows].reverse());
      } catch {
        if (isActive) setError('Failed to load messages.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadMessages();

    return () => {
      isActive = false;
    };
  }, [type]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const canSubmit = useMemo(() => draft.trim().length > 0 && !isSending, [draft, isSending]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const inserted = await sendMessage(next, type);
      setMessages((prev) => [...prev, inserted]);
      setDraft('');
    } catch {
      setError('Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="window-heading">{heading}</div>
      <div className="chat-window-panel">
        <div className="chat-window-list" ref={listRef}>
          {isLoading ? (
            <div className="chat-window-empty">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="chat-window-empty">No messages yet.</div>
          ) : (
            messages.map((message) => (
              <div className="chat-window-line" key={message.id}>
                [{formatMessageTime(message.created_at)}] {message.nickname}: {message.content}
              </div>
            ))
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="chat-window-form">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          className="terminal-input w-full p-2 text-[14px]"
          disabled={isSending}
        />
        <button type="submit" className="glossy-btn !rounded-none !px-3" disabled={!canSubmit}>
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>

      {error && <div className="text-[11px] text-[#8d1f1f]">{error}</div>}
    </div>
  );
}
