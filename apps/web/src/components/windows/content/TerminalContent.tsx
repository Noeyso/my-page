import { useCallback, useEffect, useRef, useState } from 'react';
import { type FSNode, VIRTUAL_FS, deepCloneFS, resolvePath, getPrompt } from '../../../data/virtualFileSystem';
import { COMMAND_REGISTRY, type EditorConfig } from './terminalCommands';

/* ── Constants ──────────────────────────────── */

const WELCOME = [
  'Microsoft(R) Windows 98',
  '   (C)Copyright Microsoft Corp 1981-1998.',
  '',
  'Type "help" for available commands. Try "neofetch" or "vi" for fun!',
  '',
];

const DEFAULT_ENV: Record<string, string> = {
  HOME: 'C:\\Users\\visitor',
  USER: 'visitor',
  PATH: 'C:\\WINDOWS;C:\\WINDOWS\\SYSTEM32',
  COMPUTERNAME: 'YANGSOYEON-PC',
  OS: 'Windows_98',
  TEMP: 'C:\\WINDOWS\\TEMP',
  SHELL: 'C:\\WINDOWS\\SYSTEM32\\cmd.exe',
  TERM: 'vt100',
  LANG: 'en_US.UTF-8',
};

const VI_VISIBLE_LINES = 18;

/* ── Vi Editor State ──────────────────────────── */

interface ViState {
  fileName: string;
  filePath: string[];
  lines: string[];
  cursorRow: number;
  cursorCol: number;
  mode: 'normal' | 'insert' | 'command';
  commandBuffer: string;
  statusMessage: string;
  isNewFile: boolean;
  modified: boolean;
  scrollOffset: number;
  yankBuffer: string;
  pendingKey: string;
}

/* ── Component ──────────────────────────────── */

export default function TerminalContent() {
  const [fs, setFs] = useState<FSNode>(() => deepCloneFS(VIRTUAL_FS));
  const [cwd, setCwd] = useState<string[]>([]);
  const [lines, setLines] = useState<string[]>([...WELCOME]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [env, setEnv] = useState<Record<string, string>>({ ...DEFAULT_ENV });
  const [viState, setViState] = useState<ViState | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const viRef = useRef<HTMLDivElement>(null);
  const fsRef = useRef(fs);
  const cwdRef = useRef(cwd);
  const envRef = useRef(env);
  const historyRef = useRef(history);
  fsRef.current = fs;
  cwdRef.current = cwd;
  envRef.current = env;
  historyRef.current = history;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  useEffect(() => {
    if (viState) {
      viRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [viState]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* ── Env Var Expansion ──────────────────────── */

  const expandEnvVars = useCallback((text: string): string => {
    return text.replace(/\$(\w+)/g, (_, name) => envRef.current[name] ?? '');
  }, []);

  /* ── Pipe / Redirect / Chain Parsing ──────── */

  const parseAndExecute = useCallback((rawCmd: string) => {
    const trimmed = rawCmd.trim();
    const prompt = getPrompt(cwdRef.current);
    const promptLine = `${prompt}${trimmed}`;

    if (!trimmed) {
      setLines((prev) => [...prev, promptLine]);
      return;
    }

    // Split by && and ; for chaining
    const chains = trimmed.split(/\s*&&\s*|\s*;\s*/);

    setLines((prev) => [...prev, promptLine]);
    setHistory((h) => [...h, trimmed]);
    setHistoryIdx(-1);

    for (const chain of chains) {
      if (!chain.trim()) continue;
      executePipeline(chain.trim());
    }
  }, []);

  const executePipeline = useCallback((pipeline: string) => {
    // Split by pipe
    const segments = pipeline.split(/\s*\|\s*/);
    let stdin: string[] | undefined;

    for (let i = 0; i < segments.length; i++) {
      let segment = segments[i].trim();
      if (!segment) continue;

      // Check for output redirect (only on last segment)
      let redirectFile = '';
      let appendMode = false;

      if (i === segments.length - 1) {
        const appendMatch = segment.match(/^(.*?)\s*>>\s*(.+)$/);
        const writeMatch = segment.match(/^(.*?)\s*>\s*(.+)$/);
        if (appendMatch) {
          segment = appendMatch[1].trim();
          redirectFile = appendMatch[2].trim();
          appendMode = true;
        } else if (writeMatch) {
          segment = writeMatch[1].trim();
          redirectFile = writeMatch[2].trim();
        }
      }

      const expanded = expandEnvVars(segment);
      const match = expanded.match(/^(\S+)\s*(.*)/);
      const command = (match?.[1] ?? '').toLowerCase();
      const args = (match?.[2] ?? '').trim();
      const root = fsRef.current;
      const currentCwd = cwdRef.current;

      // Handle clear/cls
      if (command === 'clear' || command === 'cls') {
        setLines([]);
        return;
      }

      const handler = COMMAND_REGISTRY[command];
      if (!handler) {
        setLines((prev) => [
          ...prev,
          `'${expanded}' is not recognized as an internal or external command,`,
          'operable program or batch file.',
          '',
        ]);
        return;
      }

      const getCwdNode = (): FSNode => {
        const { node } = resolvePath(root, currentCwd, currentCwd.join('\\') || '.');
        return node ?? root;
      };

      const result = handler({
        root,
        cwd: currentCwd,
        args,
        getCwdNode,
        stdin,
        env: envRef.current,
        history: historyRef.current,
      });

      if (result.newCwd !== undefined) setCwd(result.newCwd);
      if (result.mutatedFs) setFs({ ...root });
      if (result.setEnv) setEnv((prev) => ({ ...prev, ...result.setEnv }));
      if (result.unsetEnv) {
        setEnv((prev) => {
          const next = { ...prev };
          result.unsetEnv!.forEach((k) => delete next[k]);
          return next;
        });
      }

      // Handle editor mode
      if (result.editorMode) {
        enterViMode(result.editorMode);
        return;
      }

      // Handle async commands
      if (result.asyncHandler) {
        setLines((prev) => [...prev, ...result.output]);
        result.asyncHandler((newLines) => setLines((prev) => [...prev, ...newLines]));
        return;
      }

      // Handle redirect
      if (redirectFile) {
        const outputText = result.output.filter((l) => l !== '').join('\n');
        writeToFile(redirectFile, outputText, appendMode);
        // Don't show output when redirecting
        stdin = undefined;
        continue;
      }

      // Pass output as stdin to next pipe segment, or display if last
      if (i < segments.length - 1) {
        stdin = result.output.filter((l) => l !== '');
      } else {
        setLines((prev) => [...prev, ...result.output]);
      }
    }
  }, [expandEnvVars]);

  const writeToFile = useCallback((fileName: string, content: string, append: boolean) => {
    const root = fsRef.current;
    const currentCwd = cwdRef.current;

    const parts = fileName.split(/[/\\]/);
    const fName = parts.pop()!;
    const dirPath = parts.length > 0 ? parts.join('\\') : '.';
    const { node: dirNode } = resolvePath(root, currentCwd, dirPath);

    if (!dirNode || dirNode.type !== 'dir') {
      setLines((prev) => [...prev, `Cannot write to ${fileName}: directory not found.`, '']);
      return;
    }

    const existing = dirNode.children?.[fName];
    if (append && existing && existing.type === 'file') {
      existing.content = (existing.content ?? '') + '\n' + content;
      existing.size = (existing.content ?? '').length;
    } else {
      dirNode.children![fName] = {
        type: 'file',
        content,
        size: content.length,
        date: new Date().toLocaleDateString(),
      };
    }
    setFs({ ...root });
  }, []);

  /* ── Regular Terminal Execute ──────────────── */

  const execute = useCallback((cmd: string) => {
    parseAndExecute(cmd);
  }, [parseAndExecute]);

  /* ── Vi Editor ──────────────────────────────── */

  const enterViMode = useCallback((config: EditorConfig) => {
    const contentLines = config.content ? config.content.split('\n') : [''];
    setViState({
      fileName: config.fileName,
      filePath: config.filePath,
      lines: contentLines,
      cursorRow: 0,
      cursorCol: 0,
      mode: 'normal',
      commandBuffer: '',
      statusMessage: config.isNewFile ? `"${config.fileName}" [New File]` : `"${config.fileName}" ${contentLines.length}L`,
      isNewFile: config.isNewFile,
      modified: false,
      scrollOffset: 0,
      yankBuffer: '',
      pendingKey: '',
    });
  }, []);

  const viSave = useCallback((vi: ViState) => {
    const root = fsRef.current;
    const content = vi.lines.join('\n');

    // Navigate to parent directory
    const parentPath = vi.filePath.slice(0, -1);
    const fileName = vi.filePath[vi.filePath.length - 1];

    let parentNode = root;
    for (const segment of parentPath) {
      if (!parentNode.children?.[segment]) {
        parentNode.children![segment] = { type: 'dir', children: {} };
      }
      parentNode = parentNode.children![segment];
    }

    parentNode.children![fileName] = {
      type: 'file',
      content,
      size: content.length,
      date: new Date().toLocaleDateString(),
    };

    setFs({ ...root });
    return `"${vi.fileName}" ${vi.lines.length}L, ${content.length}C written`;
  }, []);

  const handleViKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!viState) return;
    e.preventDefault();
    e.stopPropagation();

    const vi = { ...viState, lines: [...viState.lines] };

    const clampCol = (row: number, col: number) =>
      Math.min(col, Math.max(0, (vi.lines[row] ?? '').length - (vi.mode === 'normal' ? 1 : 0)));

    const ensureVisible = () => {
      if (vi.cursorRow < vi.scrollOffset) vi.scrollOffset = vi.cursorRow;
      if (vi.cursorRow >= vi.scrollOffset + VI_VISIBLE_LINES) {
        vi.scrollOffset = vi.cursorRow - VI_VISIBLE_LINES + 1;
      }
    };

    if (vi.mode === 'command') {
      if (e.key === 'Enter') {
        const cmd = vi.commandBuffer;
        if (cmd === 'w') {
          vi.statusMessage = viSave(vi);
          vi.modified = false;
          vi.mode = 'normal';
          vi.commandBuffer = '';
        } else if (cmd === 'q') {
          if (vi.modified) {
            vi.statusMessage = 'E37: No write since last change (add ! to override)';
            vi.mode = 'normal';
            vi.commandBuffer = '';
          } else {
            setViState(null);
            return;
          }
        } else if (cmd === 'q!') {
          setViState(null);
          return;
        } else if (cmd === 'wq' || cmd === 'x') {
          viSave(vi);
          setViState(null);
          return;
        } else if (cmd.startsWith('w ')) {
          // :w filename - save as
          const newName = cmd.slice(2).trim();
          if (newName) {
            vi.fileName = newName;
            vi.filePath = [...cwdRef.current, newName];
            vi.statusMessage = viSave(vi);
            vi.modified = false;
          }
          vi.mode = 'normal';
          vi.commandBuffer = '';
        } else {
          vi.statusMessage = `E492: Not an editor command: ${cmd}`;
          vi.mode = 'normal';
          vi.commandBuffer = '';
        }
      } else if (e.key === 'Escape') {
        vi.mode = 'normal';
        vi.commandBuffer = '';
        vi.statusMessage = '';
      } else if (e.key === 'Backspace') {
        vi.commandBuffer = vi.commandBuffer.slice(0, -1);
        if (vi.commandBuffer === '') {
          vi.mode = 'normal';
        }
      } else if (e.key.length === 1) {
        vi.commandBuffer += e.key;
      }
      setViState(vi);
      return;
    }

    if (vi.mode === 'insert') {
      if (e.key === 'Escape') {
        vi.mode = 'normal';
        vi.cursorCol = Math.max(0, vi.cursorCol - 1);
        vi.statusMessage = '';
      } else if (e.key === 'Enter') {
        const line = vi.lines[vi.cursorRow];
        const before = line.slice(0, vi.cursorCol);
        const after = line.slice(vi.cursorCol);
        vi.lines[vi.cursorRow] = before;
        vi.lines.splice(vi.cursorRow + 1, 0, after);
        vi.cursorRow++;
        vi.cursorCol = 0;
        vi.modified = true;
      } else if (e.key === 'Backspace') {
        if (vi.cursorCol > 0) {
          const line = vi.lines[vi.cursorRow];
          vi.lines[vi.cursorRow] = line.slice(0, vi.cursorCol - 1) + line.slice(vi.cursorCol);
          vi.cursorCol--;
          vi.modified = true;
        } else if (vi.cursorRow > 0) {
          const prevLine = vi.lines[vi.cursorRow - 1];
          const curLine = vi.lines[vi.cursorRow];
          vi.cursorCol = prevLine.length;
          vi.lines[vi.cursorRow - 1] = prevLine + curLine;
          vi.lines.splice(vi.cursorRow, 1);
          vi.cursorRow--;
          vi.modified = true;
        }
      } else if (e.key === 'Delete') {
        const line = vi.lines[vi.cursorRow];
        if (vi.cursorCol < line.length) {
          vi.lines[vi.cursorRow] = line.slice(0, vi.cursorCol) + line.slice(vi.cursorCol + 1);
          vi.modified = true;
        } else if (vi.cursorRow < vi.lines.length - 1) {
          vi.lines[vi.cursorRow] = line + vi.lines[vi.cursorRow + 1];
          vi.lines.splice(vi.cursorRow + 1, 1);
          vi.modified = true;
        }
      } else if (e.key === 'ArrowLeft') {
        vi.cursorCol = Math.max(0, vi.cursorCol - 1);
      } else if (e.key === 'ArrowRight') {
        vi.cursorCol = Math.min(vi.lines[vi.cursorRow].length, vi.cursorCol + 1);
      } else if (e.key === 'ArrowUp') {
        vi.cursorRow = Math.max(0, vi.cursorRow - 1);
        vi.cursorCol = clampCol(vi.cursorRow, vi.cursorCol);
      } else if (e.key === 'ArrowDown') {
        vi.cursorRow = Math.min(vi.lines.length - 1, vi.cursorRow + 1);
        vi.cursorCol = clampCol(vi.cursorRow, vi.cursorCol);
      } else if (e.key === 'Tab') {
        const line = vi.lines[vi.cursorRow];
        vi.lines[vi.cursorRow] = line.slice(0, vi.cursorCol) + '  ' + line.slice(vi.cursorCol);
        vi.cursorCol += 2;
        vi.modified = true;
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        const line = vi.lines[vi.cursorRow];
        vi.lines[vi.cursorRow] = line.slice(0, vi.cursorCol) + e.key + line.slice(vi.cursorCol);
        vi.cursorCol++;
        vi.modified = true;
      }
      ensureVisible();
      setViState(vi);
      return;
    }

    // Normal mode
    const key = e.key;

    // Handle pending key sequences (dd, yy, gg)
    if (vi.pendingKey) {
      const combo = vi.pendingKey + key;
      vi.pendingKey = '';

      if (combo === 'dd') {
        vi.yankBuffer = vi.lines[vi.cursorRow];
        if (vi.lines.length > 1) {
          vi.lines.splice(vi.cursorRow, 1);
          if (vi.cursorRow >= vi.lines.length) vi.cursorRow = vi.lines.length - 1;
        } else {
          vi.lines[0] = '';
        }
        vi.cursorCol = 0;
        vi.modified = true;
      } else if (combo === 'yy') {
        vi.yankBuffer = vi.lines[vi.cursorRow];
        vi.statusMessage = '1 line yanked';
      } else if (combo === 'gg') {
        vi.cursorRow = 0;
        vi.cursorCol = 0;
      }
      vi.cursorCol = clampCol(vi.cursorRow, vi.cursorCol);
      ensureVisible();
      setViState(vi);
      return;
    }

    switch (key) {
      // Movement
      case 'h': case 'ArrowLeft':
        vi.cursorCol = Math.max(0, vi.cursorCol - 1);
        break;
      case 'j': case 'ArrowDown':
        vi.cursorRow = Math.min(vi.lines.length - 1, vi.cursorRow + 1);
        vi.cursorCol = clampCol(vi.cursorRow, vi.cursorCol);
        break;
      case 'k': case 'ArrowUp':
        vi.cursorRow = Math.max(0, vi.cursorRow - 1);
        vi.cursorCol = clampCol(vi.cursorRow, vi.cursorCol);
        break;
      case 'l': case 'ArrowRight':
        vi.cursorCol = Math.min((vi.lines[vi.cursorRow] ?? '').length - 1, vi.cursorCol + 1);
        vi.cursorCol = Math.max(0, vi.cursorCol);
        break;
      case '0':
        vi.cursorCol = 0;
        break;
      case '$':
        vi.cursorCol = Math.max(0, (vi.lines[vi.cursorRow] ?? '').length - 1);
        break;
      case 'w': {
        const line = vi.lines[vi.cursorRow];
        const rest = line.slice(vi.cursorCol + 1);
        const wordMatch = rest.match(/\s+\S/);
        if (wordMatch) {
          vi.cursorCol += wordMatch.index! + wordMatch[0].length;
        } else if (vi.cursorRow < vi.lines.length - 1) {
          vi.cursorRow++;
          vi.cursorCol = 0;
        }
        break;
      }
      case 'b': {
        if (vi.cursorCol === 0 && vi.cursorRow > 0) {
          vi.cursorRow--;
          vi.cursorCol = Math.max(0, vi.lines[vi.cursorRow].length - 1);
        } else {
          const before = vi.lines[vi.cursorRow].slice(0, vi.cursorCol);
          const wm = before.match(/\S+\s*$/);
          vi.cursorCol = wm ? wm.index! : 0;
        }
        break;
      }
      case 'G':
        vi.cursorRow = vi.lines.length - 1;
        vi.cursorCol = 0;
        break;

      // Enter insert mode
      case 'i':
        vi.mode = 'insert';
        vi.statusMessage = '-- INSERT --';
        break;
      case 'a':
        vi.mode = 'insert';
        vi.cursorCol = Math.min(vi.cursorCol + 1, vi.lines[vi.cursorRow].length);
        vi.statusMessage = '-- INSERT --';
        break;
      case 'A':
        vi.mode = 'insert';
        vi.cursorCol = vi.lines[vi.cursorRow].length;
        vi.statusMessage = '-- INSERT --';
        break;
      case 'I':
        vi.mode = 'insert';
        vi.cursorCol = 0;
        vi.statusMessage = '-- INSERT --';
        break;
      case 'o':
        vi.lines.splice(vi.cursorRow + 1, 0, '');
        vi.cursorRow++;
        vi.cursorCol = 0;
        vi.mode = 'insert';
        vi.modified = true;
        vi.statusMessage = '-- INSERT --';
        break;
      case 'O':
        vi.lines.splice(vi.cursorRow, 0, '');
        vi.cursorCol = 0;
        vi.mode = 'insert';
        vi.modified = true;
        vi.statusMessage = '-- INSERT --';
        break;

      // Delete
      case 'x': {
        const line = vi.lines[vi.cursorRow];
        if (line.length > 0) {
          vi.lines[vi.cursorRow] = line.slice(0, vi.cursorCol) + line.slice(vi.cursorCol + 1);
          vi.cursorCol = clampCol(vi.cursorRow, vi.cursorCol);
          vi.modified = true;
        }
        break;
      }

      // Pending sequences
      case 'd': case 'y': case 'g':
        vi.pendingKey = key;
        break;

      // Paste
      case 'p':
        if (vi.yankBuffer) {
          vi.lines.splice(vi.cursorRow + 1, 0, vi.yankBuffer);
          vi.cursorRow++;
          vi.cursorCol = 0;
          vi.modified = true;
        }
        break;
      case 'P':
        if (vi.yankBuffer) {
          vi.lines.splice(vi.cursorRow, 0, vi.yankBuffer);
          vi.cursorCol = 0;
          vi.modified = true;
        }
        break;

      // Command mode
      case ':':
        vi.mode = 'command';
        vi.commandBuffer = '';
        break;

      // Escape
      case 'Escape':
        vi.statusMessage = '';
        vi.pendingKey = '';
        break;
    }

    ensureVisible();
    setViState(vi);
  }, [viState, viSave]);

  /* ── Terminal Key Handling ──────────────────── */

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
      const matches = Object.keys(node.children).filter((name) =>
        name.toLowerCase().startsWith(partial),
      );
      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0];
        setInput(parts.join(' '));
      } else if (matches.length > 1) {
        setLines((prev) => [...prev, matches.join('  '), '']);
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      const prompt = getPrompt(cwdRef.current);
      setLines((prev) => [...prev, `${prompt}${input}^C`, '']);
      setInput('');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }, [input, history, historyIdx, execute]);

  /* ── Render ──────────────────────────────────── */

  const prompt = getPrompt(cwd);

  // Vi Editor Mode
  if (viState) {
    const visibleStart = viState.scrollOffset;
    const visibleEnd = Math.min(visibleStart + VI_VISIBLE_LINES, viState.lines.length);
    const visibleLines = viState.lines.slice(visibleStart, visibleEnd);
    const emptyLines = Math.max(0, VI_VISIBLE_LINES - visibleLines.length);

    return (
      <div
        className="terminal-window"
        onClick={() => viRef.current?.focus()}
      >
        <div
          ref={viRef}
          tabIndex={0}
          onKeyDown={handleViKeyDown}
          className="vi-editor"
        >
          <div className="vi-content">
            {visibleLines.map((line, idx) => {
              const lineNum = visibleStart + idx;
              const isCursorLine = lineNum === viState.cursorRow;
              const displayNum = String(lineNum + 1).padStart(4);

              if (!isCursorLine) {
                return (
                  <div key={lineNum} className="vi-line">
                    <span className="vi-line-num">{displayNum} </span>
                    <span>{line || ' '}</span>
                  </div>
                );
              }

              const col = Math.min(viState.cursorCol, line.length);
              const before = line.slice(0, col);
              const cursorChar = line[col] || ' ';
              const after = line.slice(col + 1);

              return (
                <div key={lineNum} className="vi-line">
                  <span className="vi-line-num">{displayNum} </span>
                  <span>{before}</span>
                  <span className={viState.mode === 'insert' ? 'vi-cursor-insert' : 'vi-cursor'}>{cursorChar}</span>
                  <span>{after}</span>
                </div>
              );
            })}
            {Array.from({ length: emptyLines }).map((_, i) => (
              <div key={`tilde-${i}`} className="vi-line">
                <span className="vi-tilde">~</span>
              </div>
            ))}
          </div>
          <div className="vi-status-bar">
            <span>
              {viState.mode === 'command'
                ? `:${viState.commandBuffer}`
                : viState.statusMessage}
            </span>
            <span>
              {viState.modified ? '[+] ' : ''}
              {viState.cursorRow + 1},{viState.cursorCol + 1}
              {'    '}
              {Math.round(((viState.cursorRow + 1) / viState.lines.length) * 100)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Normal Terminal Mode
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
          <span className="terminal-cmd-text">{input}</span>
          <span className="terminal-block-cursor">&#x2588;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-cmd-input"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
