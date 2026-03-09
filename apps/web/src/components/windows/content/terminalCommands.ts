import { type FSNode, resolvePath, formatSize } from '../../../data/virtualFileSystem';

export interface CommandContext {
  root: FSNode;
  cwd: string[];
  args: string;
  getCwdNode: () => FSNode;
}

export interface CommandResult {
  output: string[];
  newCwd?: string[];
  mutatedFs?: boolean;
  /** If set, the command handles its own async output (matrix, hack). */
  asyncHandler?: (appendLines: (lines: string[]) => void) => void;
}

type CommandHandler = (ctx: CommandContext) => CommandResult;

/* ── Navigation ──────────────────────────────────── */

const handleCd: CommandHandler = ({ root, cwd, args }) => {
  if (!args || args === '.') return { output: [] };
  if (args === '\\' || args === 'C:\\' || args.toLowerCase() === 'c:\\') {
    return { output: [], newCwd: [] };
  }
  const { node, absPath } = resolvePath(root, cwd, args);
  if (!node) return { output: ['The system cannot find the path specified.'] };
  if (node.type !== 'dir') return { output: ['The directory name is invalid.'] };
  return { output: [], newCwd: absPath };
};

const handlePwd: CommandHandler = ({ cwd }) => ({
  output: [cwd.length === 0 ? 'C:\\' : `C:\\${cwd.join('\\')}`],
});

/* ── Listing ──────────────────────────────────── */

const handleDir: CommandHandler = ({ root, cwd, args }) => {
  const target = args || '.';
  const { node } = resolvePath(root, cwd, target);
  if (!node) return { output: ['File Not Found', ''] };
  if (node.type === 'file') return { output: [`  ${args}  ${formatSize(node.size ?? 0)}`, ''] };

  const children = node.children ?? {};
  const entries = Object.entries(children);
  const output: string[] = [];
  const pathStr = cwd.length === 0 ? 'C:\\' : `C:\\${cwd.join('\\')}`;
  output.push(` Volume in drive C has no label.`);
  output.push(` Directory of ${pathStr}`, '');

  let fileCount = 0, dirCount = 0, totalSize = 0;
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
  output.push(`             ${dirCount} Dir(s)     4,200,000 bytes free`, '');
  return { output };
};

const handleLs: CommandHandler = ({ root, cwd, args }) => {
  const target = args || '.';
  const { node } = resolvePath(root, cwd, target);
  if (!node) return { output: ['File Not Found', ''] };
  if (node.type === 'file') return { output: [`  ${args}  ${formatSize(node.size ?? 0)}`, ''] };

  const entries = Object.entries(node.children ?? {});
  const output: string[] = [];
  if (entries.length === 0) {
    output.push('(empty)');
  } else {
    for (const [name, child] of entries) {
      const isDir = child.type === 'dir';
      output.push(`${isDir ? 'd' : '-'}  ${(child.date ?? '').padEnd(12)} ${formatSize(child.size ?? 0).padStart(8)}  ${name}${isDir ? '/' : ''}`);
    }
  }
  output.push('');
  return { output };
};

/* ── File Reading ──────────────────────────────── */

const handleCat: CommandHandler = ({ root, cwd, args }) => {
  if (!args) return { output: ['Usage: cat <filename>'] };
  const { node } = resolvePath(root, cwd, args);
  if (!node) return { output: ['File not found.', ''] };
  if (node.type === 'dir') return { output: [`Access denied - ${args} is a directory.`, ''] };
  return { output: [...(node.content ?? '').split('\n'), ''] };
};

const handleType: CommandHandler = ({ root, cwd, args }) => {
  if (!args) return { output: ['The syntax of the command is incorrect.'] };
  return handleCat({ root, cwd, args, getCwdNode: () => root });
};

/* ── File Operations ──────────────────────────── */

const handleTouch: CommandHandler = ({ root, cwd, args, getCwdNode }) => {
  if (!args) return { output: ['Usage: touch <filename>'] };
  const parts = args.split(/[/\\]/);
  const fileName = parts.pop()!;
  const parentPath = parts.join('\\');
  const { node: parentNode } = parentPath
    ? resolvePath(root, cwd, parentPath)
    : { node: getCwdNode() };
  if (!parentNode || parentNode.type !== 'dir') {
    return { output: ['The system cannot find the path specified.', ''] };
  }
  parentNode.children![fileName] = { type: 'file', content: '', size: 0, date: new Date().toLocaleDateString() };
  return { output: [`Created: ${fileName}`, ''], mutatedFs: true };
};

const handleMkdir: CommandHandler = ({ args, getCwdNode }) => {
  if (!args) return { output: ['The syntax of the command is incorrect.', ''] };
  const cwdNode = getCwdNode();
  if (cwdNode.children?.[args]) {
    return { output: [`A subdirectory or file ${args} already exists.`, ''] };
  }
  cwdNode.children![args] = { type: 'dir', children: {}, date: new Date().toLocaleDateString() };
  return { output: [''], mutatedFs: true };
};

const handleRmdir: CommandHandler = ({ args, getCwdNode }) => {
  if (!args) return { output: ['The syntax of the command is incorrect.', ''] };
  const cwdNode = getCwdNode();
  const target = cwdNode.children?.[args];
  if (!target) return { output: ['The system cannot find the path specified.', ''] };
  if (target.type !== 'dir') return { output: [`${args} is not a directory.`, ''] };
  if (Object.keys(target.children ?? {}).length > 0) return { output: ['The directory is not empty.', ''] };
  delete cwdNode.children![args];
  return { output: [''], mutatedFs: true };
};

const handleRename: CommandHandler = ({ args, getCwdNode }) => {
  const renArgs = args.split(/\s+/);
  if (renArgs.length < 2) return { output: ['The syntax of the command is incorrect.', ''] };
  const cwdNode = getCwdNode();
  const [oldName, newName] = renArgs;
  if (!cwdNode.children?.[oldName]) return { output: ['File not found.', ''] };
  cwdNode.children![newName] = cwdNode.children![oldName];
  delete cwdNode.children![oldName];
  return { output: [''], mutatedFs: true };
};

const handleRm: CommandHandler = ({ args, getCwdNode }) => {
  if (args === '-rf /' || args === '-rf C:\\' || args === '*.*') {
    return { output: [
      'Nice try! You almost deleted everything.',
      'System Administrator has been notified.',
      '(Just kidding. Nothing happened.)',
      '',
    ] };
  }
  if (!args) return { output: ['The syntax of the command is incorrect.'] };
  const cwdNode = getCwdNode();
  if (!cwdNode.children?.[args]) return { output: ['Could Not Find ' + args, ''] };
  delete cwdNode.children![args];
  return { output: [''], mutatedFs: true };
};

/* ── Tree ──────────────────────────────────── */

const handleTree: CommandHandler = ({ root, cwd, args }) => {
  const { node } = args
    ? resolvePath(root, cwd, args)
    : resolvePath(root, [], cwd.join('\\'));
  if (!node || node.type !== 'dir') return { output: ['Invalid path.'] };

  const output: string[] = ['.'];
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
  printTree(node, '');
  output.push('');
  return { output };
};

/* ── Info Commands ──────────────────────────── */

const handleWhoami: CommandHandler = () => ({ output: ['C:\\Users\\visitor', ''] });
const handleHostname: CommandHandler = () => ({ output: ['YANGSOYEON-PC', ''] });
const handleUname: CommandHandler = () => ({ output: ['Windows98 YANGSOYEON-PC 4.10.1998 i686', ''] });
const handleVer: CommandHandler = () => ({ output: ['', 'Windows 98 [Version 4.10.1998]', ''] });
const handleDate: CommandHandler = () => ({ output: [`The current date is: ${new Date().toLocaleDateString()}`, ''] });
const handleTime: CommandHandler = () => ({ output: [`The current time is: ${new Date().toLocaleTimeString()}`, ''] });
const handleEcho: CommandHandler = ({ args }) => ({ output: [args || '', ''] });
const handleColor: CommandHandler = () => ({ output: ['Color changed. (Just kidding, aesthetics are fixed.)', ''] });
const handleSudo: CommandHandler = () => ({ output: ["Nice try. This is Windows 98, we don't do sudo here.", ''] });
const handleExit: CommandHandler = () => ({ output: ['There is no escape.', ''] });

const handleAbout: CommandHandler = () => ({
  output: [
    '',
    "  ╔══════════════════════════════╗",
    "  ║   yangsoyeon's terminal      ║",
    "  ║   retro vibes only           ║",
    '  ║   type "help" for commands   ║',
    "  ╚══════════════════════════════╝",
    '',
  ],
});

const handleHelp: CommandHandler = () => ({
  output: [
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
  ],
});

/* ── Easter Eggs ──────────────────────────── */

const handleMatrix: CommandHandler = () => ({
  output: [],
  asyncHandler: (appendLines) => {
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
    let count = 0;
    const id = setInterval(() => {
      const width = 48;
      const line = Array.from({ length: width }, () =>
        Math.random() > 0.7 ? chars[Math.floor(Math.random() * chars.length)] : ' ',
      ).join('');
      appendLines([line]);
      count++;
      if (count >= 30) {
        clearInterval(id);
        appendLines(['', 'Wake up, Neo...', 'The Matrix has you...', '']);
      }
    }, 80);
  },
});

const handleHack: CommandHandler = () => ({
  output: [],
  asyncHandler: (appendLines) => {
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
        appendLines([hackLines[i]]);
        i++;
      } else {
        clearInterval(id);
      }
    }, 200);
  },
});

/* ── Command Registry ──────────────────────── */

export const COMMAND_REGISTRY: Record<string, CommandHandler> = {
  cd: handleCd,
  chdir: handleCd,
  pwd: handlePwd,
  dir: handleDir,
  ls: handleLs,
  cat: handleCat,
  type: handleType,
  touch: handleTouch,
  mkdir: handleMkdir,
  md: handleMkdir,
  rmdir: handleRmdir,
  rd: handleRmdir,
  mv: handleRename,
  rename: handleRename,
  ren: handleRename,
  rm: handleRm,
  del: handleRm,
  tree: handleTree,
  whoami: handleWhoami,
  hostname: handleHostname,
  uname: handleUname,
  ver: handleVer,
  date: handleDate,
  time: handleTime,
  echo: handleEcho,
  color: handleColor,
  sudo: handleSudo,
  exit: handleExit,
  about: handleAbout,
  help: handleHelp,
  '?': handleHelp,
  matrix: handleMatrix,
  hack: handleHack,
};
