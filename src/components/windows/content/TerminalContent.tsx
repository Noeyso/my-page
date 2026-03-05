import { useEffect, useRef, useState } from 'react';

/* ── Virtual Filesystem ──────────────────────────────────── */

interface FSNode {
  type: 'dir' | 'file';
  children?: Record<string, FSNode>;
  content?: string;
  size?: number;
  date?: string;
}

const FS: FSNode = {
  type: 'dir',
  children: {
    Games: {
      type: 'dir',
      children: {
        'tetris.exe': { type: 'file', content: '[Tetris Binary]', size: 48200, date: '03/06/2026' },
        'minesweeper.exe': { type: 'file', content: '[Minesweeper Binary]', size: 32100, date: '03/06/2026' },
        'snake.exe': { type: 'file', content: '[Snake Binary]', size: 28400, date: '03/06/2026' },
        'README.txt': { type: 'file', content: 'Welcome to the Games folder!\nPlay tetris, minesweeper, or snake.\nHave fun!', size: 72, date: '03/06/2026' },
      },
    },
    Paintings: {
      type: 'dir',
      children: {
        'instructions.txt': { type: 'file', content: 'Open MS Paint to create your artwork.\nSave it and it will appear here.', size: 68, date: '03/06/2026' },
      },
    },
    Memo: {
      type: 'dir',
      children: {
        'welcome.txt': { type: 'file', content: 'Write memos and they will be saved here.\nShare your thoughts with the world!', size: 74, date: '03/06/2026' },
      },
    },
    Gallery: {
      type: 'dir',
      children: {
        'm1.png': { type: 'file', content: '[Image Data]', size: 142000, date: '03/06/2026' },
        'm2.png': { type: 'file', content: '[Image Data - WARNING: Do not open]', size: 98000, date: '03/06/2026' },
        'm3.png': { type: 'file', content: '[Image Data]', size: 115000, date: '03/06/2026' },
      },
    },
    Videos: {
      type: 'dir',
      children: {
        'untitled_memory.avi': { type: 'file', content: '[Video Data - Memory Fragment]', size: 2400000, date: '03/06/2026' },
      },
    },
    Windows: {
      type: 'dir',
      children: {
        system32: {
          type: 'dir',
          children: {
            'cmd.exe': { type: 'file', content: '[Command Processor]', size: 236000, date: '01/01/1998' },
            'config.sys': { type: 'file', content: 'DEVICE=HIMEM.SYS\nDOS=HIGH,UMB', size: 30, date: '01/01/1998' },
            'autoexec.bat': { type: 'file', content: '@ECHO OFF\nPATH C:\\WINDOWS;C:\\WINDOWS\\SYSTEM32\nSET PROMPT=$P$G', size: 62, date: '01/01/1998' },
          },
        },
      },
    },
    'boot.ini': { type: 'file', content: '[boot loader]\ntimeout=30\ndefault=multi(0)disk(0)rdisk(0)partition(1)\\WINDOWS', size: 78, date: '01/01/1998' },
    'autoexec.bat': { type: 'file', content: '@ECHO OFF\nPATH C:\\WINDOWS;C:\\WINDOWS\\SYSTEM32', size: 46, date: '01/01/1998' },
  },
};

function deepClone(node: FSNode): FSNode {
  const clone: FSNode = { ...node };
  if (node.children) {
    clone.children = {};
    for (const [k, v] of Object.entries(node.children)) {
      clone.children[k] = deepClone(v);
    }
  }
  return clone;
}

function resolvePath(root: FSNode, cwd: string[], target: string): { node: FSNode | null; absPath: string[] } {
  let parts: string[];
  if (target.startsWith('C:\\') || target.startsWith('c:\\') || target.startsWith('/')) {
    // Absolute
    const cleaned = target.replace(/^[Cc]:\\?/, '').replace(/^\//, '');
    parts = cleaned ? cleaned.split(/[/\\]/).filter(Boolean) : [];
  } else {
    // Relative
    parts = [...cwd, ...target.split(/[/\\]/).filter(Boolean)];
  }

  // Resolve . and ..
  const resolved: string[] = [];
  for (const p of parts) {
    if (p === '.') continue;
    if (p === '..') { resolved.pop(); continue; }
    resolved.push(p);
  }

  let current = root;
  for (const segment of resolved) {
    if (current.type !== 'dir' || !current.children) return { node: null, absPath: resolved };
    const found = Object.entries(current.children).find(
      ([name]) => name.toLowerCase() === segment.toLowerCase(),
    );
    if (!found) return { node: null, absPath: resolved };
    current = found[1];
    // Fix casing
    resolved[resolved.indexOf(segment)] = found[0];
  }

  return { node: current, absPath: resolved };
}

function formatSize(size: number): string {
  if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M`;
  if (size >= 1000) return `${(size / 1000).toFixed(1)}K`;
  return `${size}`;
}

function getPrompt(cwd: string[]): string {
  return cwd.length === 0 ? 'C:\\>' : `C:\\${cwd.join('\\')}>`;
}

/* ── Component ───────────────────────────────────────────── */

const WELCOME = [
  'Microsoft(R) Windows 98',
  '   (C)Copyright Microsoft Corp 1981-1998.',
  '',
];

export default function TerminalContent() {
  const [fs, setFs] = useState<FSNode>(() => deepClone(FS));
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
    const output: string[] = [`${prompt}${trimmed}`];

    if (!trimmed) {
      setLines((prev) => [...prev, ...output]);
      return;
    }

    // Parse command and args
    const match = trimmed.match(/^(\S+)\s*(.*)/);
    const command = (match?.[1] ?? '').toLowerCase();
    const args = (match?.[2] ?? '').trim();
    const root = fsRef.current;
    const currentCwd = cwdRef.current;

    const getCwdNode = (): FSNode => {
      const { node } = resolvePath(root, [], currentCwd.join('\\'));
      return node ?? root;
    };

    switch (command) {
      /* ── Navigation ────────────────────────────── */
      case 'cd':
      case 'chdir': {
        if (!args || args === '.') break;
        if (args === '\\' || args === 'C:\\' || args.toLowerCase() === 'c:\\') {
          setCwd([]);
          break;
        }
        const { node, absPath } = resolvePath(root, currentCwd, args);
        if (!node) {
          output.push(`The system cannot find the path specified.`);
        } else if (node.type !== 'dir') {
          output.push(`The directory name is invalid.`);
        } else {
          setCwd(absPath);
        }
        break;
      }

      case 'pwd': {
        output.push(currentCwd.length === 0 ? 'C:\\' : `C:\\${currentCwd.join('\\')}`);
        break;
      }

      /* ── Listing ───────────────────────────────── */
      case 'dir':
      case 'ls': {
        const target = args || '.';
        const { node } = resolvePath(root, currentCwd, target);
        if (!node) {
          output.push('File Not Found');
          break;
        }
        if (node.type === 'file') {
          output.push(`  ${args}  ${formatSize(node.size ?? 0)}`);
          break;
        }
        const children = node.children ?? {};
        const entries = Object.entries(children);
        if (command === 'ls') {
          // Unix-style listing
          for (const [name, child] of entries) {
            const isDir = child.type === 'dir';
            output.push(`${isDir ? 'd' : '-'}  ${(child.date ?? '').padEnd(12)} ${formatSize(child.size ?? 0).padStart(8)}  ${name}${isDir ? '/' : ''}`);
          }
          if (entries.length === 0) output.push('(empty)');
        } else {
          // DOS-style dir
          const pathStr = currentCwd.length === 0 ? 'C:\\' : `C:\\${currentCwd.join('\\')}`;
          output.push(` Volume in drive C has no label.`);
          output.push(` Directory of ${pathStr}`);
          output.push('');
          let fileCount = 0;
          let dirCount = 0;
          let totalSize = 0;
          for (const [name, child] of entries) {
            const isDir = child.type === 'dir';
            const date = child.date ?? '03/06/2026';
            if (isDir) {
              output.push(`${date}  03:55 PM    <DIR>          ${name}`);
              dirCount++;
            } else {
              const size = child.size ?? 0;
              output.push(`${date}  03:55 PM    ${String(size).padStart(14)} ${name}`);
              fileCount++;
              totalSize += size;
            }
          }
          output.push(`             ${fileCount} File(s)    ${totalSize.toLocaleString()} bytes`);
          output.push(`             ${dirCount} Dir(s)     4,200,000 bytes free`);
        }
        output.push('');
        break;
      }

      /* ── File Reading ──────────────────────────── */
      case 'cat':
      case 'type': {
        if (!args) {
          output.push(command === 'cat' ? 'Usage: cat <filename>' : 'The syntax of the command is incorrect.');
          break;
        }
        const { node } = resolvePath(root, currentCwd, args);
        if (!node) {
          output.push('File not found.');
        } else if (node.type === 'dir') {
          output.push(`Access denied - ${args} is a directory.`);
        } else {
          output.push(...(node.content ?? '').split('\n'));
        }
        output.push('');
        break;
      }

      /* ── File Operations ───────────────────────── */
      case 'touch': {
        if (!args) { output.push('Usage: touch <filename>'); break; }
        const parts = args.split(/[/\\]/);
        const fileName = parts.pop()!;
        const parentPath = parts.join('\\');
        const { node: parentNode } = parentPath
          ? resolvePath(root, currentCwd, parentPath)
          : { node: getCwdNode() };
        if (!parentNode || parentNode.type !== 'dir') {
          output.push('The system cannot find the path specified.');
        } else {
          parentNode.children![fileName] = { type: 'file', content: '', size: 0, date: new Date().toLocaleDateString() };
          setFs({ ...root });
          output.push(`Created: ${fileName}`);
        }
        output.push('');
        break;
      }

      case 'mkdir':
      case 'md': {
        if (!args) { output.push('The syntax of the command is incorrect.'); break; }
        const cwdNode = getCwdNode();
        if (cwdNode.children?.[args]) {
          output.push(`A subdirectory or file ${args} already exists.`);
        } else {
          cwdNode.children![args] = { type: 'dir', children: {}, date: new Date().toLocaleDateString() };
          setFs({ ...root });
        }
        output.push('');
        break;
      }

      case 'rmdir':
      case 'rd': {
        if (!args) { output.push('The syntax of the command is incorrect.'); break; }
        const cwdNode = getCwdNode();
        const target = cwdNode.children?.[args];
        if (!target) {
          output.push('The system cannot find the path specified.');
        } else if (target.type !== 'dir') {
          output.push(`${args} is not a directory.`);
        } else if (Object.keys(target.children ?? {}).length > 0) {
          output.push('The directory is not empty.');
        } else {
          delete cwdNode.children![args];
          setFs({ ...root });
        }
        output.push('');
        break;
      }

      case 'mv':
      case 'rename':
      case 'ren': {
        const renArgs = args.split(/\s+/);
        if (renArgs.length < 2) { output.push('The syntax of the command is incorrect.'); break; }
        const cwdNode = getCwdNode();
        const [oldName, newName] = renArgs;
        if (!cwdNode.children?.[oldName]) {
          output.push('File not found.');
        } else {
          cwdNode.children![newName] = cwdNode.children![oldName];
          delete cwdNode.children![oldName];
          setFs({ ...root });
        }
        output.push('');
        break;
      }

      /* ── Tree ──────────────────────────────────── */
      case 'tree': {
        const { node } = args
          ? resolvePath(root, currentCwd, args)
          : { node: getCwdNode() };
        if (!node || node.type !== 'dir') {
          output.push('Invalid path.');
          break;
        }
        const printTree = (n: FSNode, prefix: string) => {
          const entries = Object.entries(n.children ?? {});
          entries.forEach(([name, child], i) => {
            const isLast = i === entries.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            output.push(`${prefix}${connector}${name}${child.type === 'dir' ? '/' : ''}`);
            if (child.type === 'dir') {
              printTree(child, prefix + (isLast ? '    ' : '│   '));
            }
          });
        };
        output.push('.');
        printTree(node, '');
        output.push('');
        break;
      }

      /* ── Info Commands ─────────────────────────── */
      case 'whoami':
        output.push('C:\\Users\\visitor', '');
        break;

      case 'hostname':
        output.push('YANGSOYEON-PC', '');
        break;

      case 'uname':
        output.push('Windows98 YANGSOYEON-PC 4.10.1998 i686', '');
        break;

      case 'ver':
        output.push('', 'Windows 98 [Version 4.10.1998]', '');
        break;

      case 'date':
        output.push(`The current date is: ${new Date().toLocaleDateString()}`, '');
        break;

      case 'time':
        output.push(`The current time is: ${new Date().toLocaleTimeString()}`, '');
        break;

      case 'echo':
        output.push(args || '', '');
        break;

      case 'clear':
      case 'cls':
        setLines([]);
        setHistory((h) => [...h, trimmed]);
        setHistoryIdx(-1);
        return;

      case 'color':
        output.push('Color changed. (Just kidding, aesthetics are fixed.)', '');
        break;

      case 'help':
      case '?':
        output.push(
          'Available commands:',
          '',
          '  Navigation:',
          '    cd <path>     - Change directory',
          '    pwd           - Print working directory',
          '',
          '  Listing:',
          '    ls [path]     - List files (Unix style)',
          '    dir [path]    - List files (DOS style)',
          '    tree [path]   - Show directory tree',
          '',
          '  File Operations:',
          '    cat <file>    - Show file contents',
          '    type <file>   - Show file contents (DOS)',
          '    touch <file>  - Create empty file',
          '    mkdir <name>  - Create directory',
          '    rm <file>     - Delete file',
          '    rmdir <name>  - Remove empty directory',
          '    mv <old> <new> - Rename file',
          '',
          '  System:',
          '    whoami        - Show current user',
          '    hostname      - Show computer name',
          '    uname         - Show system info',
          '    ver           - Show Windows version',
          '    date          - Show current date',
          '    time          - Show current time',
          '    echo <text>   - Print text',
          '    cls / clear   - Clear screen',
          '    about         - About this terminal',
          '    help          - Show this help',
          '',
        );
        break;

      case 'about':
        output.push(
          '',
          '  ╔══════════════════════════════╗',
          '  ║   yangsoyeon\'s terminal      ║',
          '  ║   retro vibes only           ║',
          '  ║   type "help" for commands   ║',
          '  ╚══════════════════════════════╝',
          '',
        );
        break;

      /* ── Hidden Easter Eggs ────────────────────── */
      case 'matrix': {
        setLines((prev) => [...prev, ...output]);
        setHistory((h) => [...h, trimmed]);
        setHistoryIdx(-1);
        // Animate matrix rain into terminal
        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
        let count = 0;
        const id = setInterval(() => {
          const width = 48;
          const line = Array.from({ length: width }, () =>
            Math.random() > 0.7 ? chars[Math.floor(Math.random() * chars.length)] : ' ',
          ).join('');
          setLines((prev) => [...prev, line]);
          count++;
          if (count >= 30) {
            clearInterval(id);
            setLines((prev) => [...prev, '', 'Wake up, Neo...', 'The Matrix has you...', '']);
          }
        }, 80);
        return;
      }

      case 'hack': {
        setLines((prev) => [...prev, ...output]);
        setHistory((h) => [...h, trimmed]);
        setHistoryIdx(-1);
        const hackLines = [
          'Initializing hack sequence...',
          'Connecting to mainframe... OK',
          'Bypassing firewall [████████░░] 80%',
          'Bypassing firewall [██████████] 100%',
          'Decrypting password: ************',
          'Password: soyeon1234 (just kidding)',
          'Accessing root@YANGSOYEON-PC...',
          'Downloading secret_files.zip... 100%',
          'Covering tracks...',
          '',
          '  ██╗  ██╗ █████╗  ██████╗██╗  ██╗███████╗██████╗ ',
          '  ██║  ██║██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗',
          '  ███████║███████║██║     █████╔╝ █████╗  ██║  ██║',
          '  ██╔══██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██║  ██║',
          '  ██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██████╔╝',
          '  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═════╝ ',
          '',
          'ACCESS GRANTED. Welcome, elite hacker.',
          '(This is all fake. You hacked nothing.)',
          '',
        ];
        let i = 0;
        const id = setInterval(() => {
          if (i < hackLines.length) {
            setLines((prev) => [...prev, hackLines[i]]);
            i++;
          } else {
            clearInterval(id);
          }
        }, 200);
        return;
      }

      case 'sudo': {
        output.push('Nice try. This is Windows 98, we don\'t do sudo here.', '');
        break;
      }

      case 'exit': {
        output.push('There is no escape.', '');
        break;
      }

      case 'rm':
      case 'del': {
        if (args === '-rf /' || args === '-rf C:\\' || args === '*.*') {
          output.push(
            'Nice try! You almost deleted everything.',
            'System Administrator has been notified.',
            '(Just kidding. Nothing happened.)',
            '',
          );
          break;
        }
        // Normal delete
        if (!args) { output.push('The syntax of the command is incorrect.'); break; }
        const cwdNodeDel = getCwdNode();
        if (!cwdNodeDel.children?.[args]) {
          output.push('Could Not Find ' + args);
        } else {
          delete cwdNodeDel.children![args];
          setFs({ ...root });
        }
        output.push('');
        break;
      }

      default:
        output.push(
          `'${trimmed}' is not recognized as an internal or external command,`,
          'operable program or batch file.',
          '',
        );
    }

    setLines((prev) => [...prev, ...output]);
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
      // Tab completion
      if (!input) return;
      const parts = input.split(/\s+/);
      const partial = parts[parts.length - 1].toLowerCase();
      const { node } = resolvePath(fsRef.current, cwdRef.current, '.');
      if (!node?.children) return;
      const match = Object.keys(node.children).find((name) =>
        name.toLowerCase().startsWith(partial),
      );
      if (match) {
        parts[parts.length - 1] = match;
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
