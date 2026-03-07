import { useEffect, useRef, useState } from 'react';
import { type FSNode, VIRTUAL_FS, deepCloneFS, resolvePath, getPrompt } from '../../../data/virtualFileSystem';
import { COMMAND_REGISTRY } from './terminalCommands';

const WELCOME = [
  'Microsoft(R) Windows 98',
  '   (C)Copyright Microsoft Corp 1981-1998.',
  '',
];

export default function TerminalContent() {
  const [fs, setFs] = useState<FSNode>(() => deepCloneFS(VIRTUAL_FS));
  const [cwd, setCwd] = useState<string[]>([]);
  const [lines, setLines] = useState<string[]>([...WELCOME]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fsRef = useRef(fs);
  const cwdRef = useRef(cwd);
  fsRef.current = fs;
  cwdRef.current = cwd;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const execute = (cmd: string) => {
    const trimmed = cmd.trim();
    const prompt = getPrompt(cwdRef.current);
    const promptLine = `${prompt}${trimmed}`;

    if (!trimmed) {
      setLines((prev) => [...prev, promptLine]);
      return;
    }

    const match = trimmed.match(/^(\S+)\s*(.*)/);
    const command = (match?.[1] ?? '').toLowerCase();
    const args = (match?.[2] ?? '').trim();
    const root = fsRef.current;
    const currentCwd = cwdRef.current;

    // Handle clear/cls separately (they clear lines)
    if (command === 'clear' || command === 'cls') {
      setLines([]);
      setHistory((h) => [...h, trimmed]);
      setHistoryIdx(-1);
      return;
    }

    const handler = COMMAND_REGISTRY[command];
    if (!handler) {
      setLines((prev) => [
        ...prev,
        promptLine,
        `'${trimmed}' is not recognized as an internal or external command,`,
        'operable program or batch file.',
        '',
      ]);
      setHistory((h) => [...h, trimmed]);
      setHistoryIdx(-1);
      return;
    }

    const getCwdNode = (): FSNode => {
      const { node } = resolvePath(root, [], currentCwd.join('\\'));
      return node ?? root;
    };

    const result = handler({ root, cwd: currentCwd, args, getCwdNode });

    if (result.newCwd !== undefined) setCwd(result.newCwd);
    if (result.mutatedFs) setFs({ ...root });

    const appendLines = (newLines: string[]) => {
      setLines((prev) => [...prev, ...newLines]);
    };

    if (result.asyncHandler) {
      setLines((prev) => [...prev, promptLine, ...result.output]);
      setHistory((h) => [...h, trimmed]);
      setHistoryIdx(-1);
      result.asyncHandler(appendLines);
      return;
    }

    setLines((prev) => [...prev, promptLine, ...result.output]);
    setHistory((h) => [...h, trimmed]);
    setHistoryIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      execute(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setInput(history[idx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const idx = historyIdx + 1;
      if (idx >= history.length) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        setHistoryIdx(idx);
        setInput(history[idx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (!input) return;
      const parts = input.split(/\s+/);
      const partial = parts[parts.length - 1].toLowerCase();
      const { node } = resolvePath(fsRef.current, cwdRef.current, '.');
      if (!node?.children) return;
      const tabMatch = Object.keys(node.children).find((name) =>
        name.toLowerCase().startsWith(partial),
      );
      if (tabMatch) {
        parts[parts.length - 1] = tabMatch;
        setInput(parts.join(' '));
      }
    }
  };

  const prompt = getPrompt(cwd);

  return (
    <div
      className="terminal-window"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="terminal-output">
        {lines.map((line, i) => (
          <div key={i} className="terminal-line">{line || '\u00A0'}</div>
        ))}
        <div className="terminal-input-line">
          <span>{prompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
