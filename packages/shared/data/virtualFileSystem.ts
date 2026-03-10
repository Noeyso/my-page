export interface FSNode {
  type: 'dir' | 'file';
  children?: Record<string, FSNode>;
  content?: string;
  size?: number;
  date?: string;
  permissions?: string;
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
        'todo.txt': {
          type: 'file',
          content: '[ ] Learn more about React Server Components\n[ ] Finish portfolio website\n[ ] Read "Clean Code" book\n[x] Set up development environment\n[x] Create virtual file system',
          size: 186,
          date: '03/08/2026',
        },
        'diary.txt': {
          type: 'file',
          content: '2026-03-01\nStarted building my retro portfolio.\nThe Windows 98 theme is coming along nicely.\n\n2026-03-05\nAdded the terminal emulator today.\nIt feels so authentic!\n\n2026-03-08\nThe vi editor works now.\nI can edit files right in the browser!',
          size: 248,
          date: '03/08/2026',
        },
        'ideas.txt': {
          type: 'file',
          content: 'Project Ideas:\n1. AI-powered code reviewer\n2. Retro game collection in browser\n3. Real-time collaboration tool\n4. Music visualizer with WebGL\n5. Terminal-based portfolio website (done!)',
          size: 198,
          date: '03/07/2026',
        },
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
        'video-1.mp4': { type: 'file', content: '[Video Data]', size: 3200000, date: '03/06/2026' },
        'video-2.mp4': { type: 'file', content: '[Video Data]', size: 2800000, date: '03/06/2026' },
      },
    },
    Users: {
      type: 'dir',
      children: {
        visitor: {
          type: 'dir',
          children: {
            Desktop: {
              type: 'dir',
              children: {
                'shortcuts.txt': {
                  type: 'file',
                  content: 'Desktop Shortcuts:\n- My Computer\n- Recycle Bin\n- Internet Explorer\n- MS Paint\n- Minesweeper',
                  size: 96,
                  date: '03/06/2026',
                },
              },
            },
            Documents: {
              type: 'dir',
              children: {
                'resume.txt': {
                  type: 'file',
                  content: '================================\n       YANG SOYEON - Resume\n================================\n\nFull-Stack Developer\n\nSkills:\n  - React / Next.js / TypeScript\n  - Node.js / Express\n  - PostgreSQL / MongoDB\n  - Tailwind CSS / Mantine UI\n  - Git / CI/CD / Docker\n\nExperience:\n  Building amazing web applications\n  with modern technologies.\n\nContact:\n  Visit my portfolio website!\n================================',
                  size: 420,
                  date: '03/06/2026',
                },
                'projects.txt': {
                  type: 'file',
                  content: 'My Projects:\n\n1. Retro Portfolio (this website!)\n   - Windows 98 themed portfolio\n   - Interactive terminal emulator\n   - Built with React + TypeScript\n\n2. Various web applications\n   - Full-stack development\n   - Modern UI/UX design',
                  size: 256,
                  date: '03/06/2026',
                },
                'secrets.txt': {
                  type: 'file',
                  content: '╔══════════════════════════════════╗\n║     CLASSIFIED INFORMATION       ║\n║                                  ║\n║  The cake is a lie.              ║\n║  There is no spoon.              ║\n║  The answer is 42.               ║\n║                                  ║\n║  (You found the secret file!)    ║\n╚══════════════════════════════════╝',
                  size: 310,
                  date: '01/01/1998',
                },
              },
            },
            Downloads: { type: 'dir', children: {} },
            '.bashrc': {
              type: 'file',
              content: '# ~/.bashrc\nexport PS1="\\u@\\h:\\w$ "\nexport PATH="/usr/local/bin:$PATH"\nalias ll="ls -la"\nalias cls="clear"\n\n# Welcome message\necho "Welcome back, visitor!"',
              size: 168,
              date: '03/06/2026',
            },
          },
        },
      },
    },
    'Program Files': {
      type: 'dir',
      children: {
        'Internet Explorer': {
          type: 'dir',
          children: {
            'iexplore.exe': { type: 'file', content: '[Internet Explorer 4.0]', size: 512000, date: '01/01/1998' },
          },
        },
        Winamp: {
          type: 'dir',
          children: {
            'winamp.exe': { type: 'file', content: '[Winamp 2.0 - It really whips the llama\'s ass!]', size: 380000, date: '01/01/1998' },
            'playlist.m3u': { type: 'file', content: '#EXTM3U\nC:\\Music\\track01.mp3\nC:\\Music\\track02.mp3\nC:\\Music\\track03.mp3', size: 84, date: '01/01/1998' },
          },
        },
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
            'notepad.exe': { type: 'file', content: '[Notepad Text Editor]', size: 48000, date: '01/01/1998' },
            drivers: {
              type: 'dir',
              children: {
                'mouse.sys': { type: 'file', content: '[Mouse Driver v2.0]', size: 12400, date: '01/01/1998' },
                'keyboard.sys': { type: 'file', content: '[Keyboard Driver v1.5]', size: 8600, date: '01/01/1998' },
                'display.sys': { type: 'file', content: '[Display Driver VGA]', size: 24800, date: '01/01/1998' },
              },
            },
          },
        },
        Temp: { type: 'dir', children: {} },
      },
    },
    tmp: { type: 'dir', children: {} },
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

/** Recursively find files matching a pattern */
export function findFiles(node: FSNode, currentPath: string[], pattern: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');

  if (node.children) {
    for (const [name, child] of Object.entries(node.children)) {
      const childPath = [...currentPath, name];
      if (regex.test(name)) {
        results.push(childPath.join('\\'));
      }
      if (child.type === 'dir') {
        results.push(...findFiles(child, childPath, pattern));
      }
    }
  }
  return results;
}

/** Recursively grep files for content matching a pattern */
export function grepFiles(
  node: FSNode,
  currentPath: string[],
  pattern: RegExp,
  recursive: boolean,
): { file: string; line: number; text: string }[] {
  const results: { file: string; line: number; text: string }[] = [];

  if (node.children) {
    for (const [name, child] of Object.entries(node.children)) {
      const childPath = [...currentPath, name];
      if (child.type === 'file' && child.content) {
        const lines = child.content.split('\n');
        lines.forEach((text, i) => {
          if (pattern.test(text)) {
            results.push({ file: childPath.join('\\'), line: i + 1, text });
          }
        });
      } else if (child.type === 'dir' && recursive) {
        results.push(...grepFiles(child, childPath, pattern, recursive));
      }
    }
  }
  return results;
}
