export interface FSNode {
  type: 'dir' | 'file';
  children?: Record<string, FSNode>;
  content?: string;
  size?: number;
  date?: string;
}

export const VIRTUAL_FS: FSNode = {
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

export function deepCloneFS(node: FSNode): FSNode {
  const clone: FSNode = { ...node };
  if (node.children) {
    clone.children = {};
    for (const [k, v] of Object.entries(node.children)) {
      clone.children[k] = deepCloneFS(v);
    }
  }
  return clone;
}

export function resolvePath(root: FSNode, cwd: string[], target: string): { node: FSNode | null; absPath: string[] } {
  let parts: string[];
  if (target.startsWith('C:\\') || target.startsWith('c:\\') || target.startsWith('/')) {
    const cleaned = target.replace(/^[Cc]:\\?/, '').replace(/^\//, '');
    parts = cleaned ? cleaned.split(/[/\\]/).filter(Boolean) : [];
  } else {
    parts = [...cwd, ...target.split(/[/\\]/).filter(Boolean)];
  }

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
    resolved[resolved.indexOf(segment)] = found[0];
  }

  return { node: current, absPath: resolved };
}

export function formatSize(size: number): string {
  if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M`;
  if (size >= 1000) return `${(size / 1000).toFixed(1)}K`;
  return `${size}`;
}

export function getPrompt(cwd: string[]): string {
  return cwd.length === 0 ? 'C:\\>' : `C:\\${cwd.join('\\')}>`;
}
