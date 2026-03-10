import { type FSNode, resolvePath, formatSize, findFiles, grepFiles } from '../../../data/virtualFileSystem';

/* ── Types ──────────────────────────────────── */

export interface CommandContext {
  root: FSNode;
  cwd: string[];
  args: string;
  getCwdNode: () => FSNode;
  stdin?: string[];
  env: Record<string, string>;
  history: string[];
}

export interface EditorConfig {
  fileName: string;
  filePath: string[];
  content: string;
  isNewFile: boolean;
}

export interface CommandResult {
  output: string[];
  newCwd?: string[];
  mutatedFs?: boolean;
  asyncHandler?: (appendLines: (lines: string[]) => void) => void;
  editorMode?: EditorConfig;
  setEnv?: Record<string, string>;
  unsetEnv?: string[];
}

type CommandHandler = (ctx: CommandContext) => CommandResult;

/* ── Navigation ──────────────────────────────── */

const handleCd: CommandHandler = ({ root, cwd, args, env }) => {
  if (!args || args === '.' ) return { output: [] };
  if (args === '~' || args === '$HOME') {
    const home = env.HOME ?? 'C:\\Users\\visitor';
    const cleaned = home.replace(/^[Cc]:\\?/, '');
    return { output: [], newCwd: cleaned ? cleaned.split('\\').filter(Boolean) : [] };
  }
  if (args === '\\' || args === 'C:\\' || args.toLowerCase() === 'c:\\' || args === '/') {
    return { output: [], newCwd: [] };
  }
  if (args === '-') return { output: ['(previous directory not tracked)'] };
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
  const flagMatch = args.match(/^(-\S+)\s*(.*)/);
  const flags = flagMatch ? flagMatch[1] : '';
  const target = (flagMatch ? flagMatch[2] : args) || '.';
  const showAll = flags.includes('a');
  const longFormat = flags.includes('l');

  const { node } = resolvePath(root, cwd, target);
  if (!node) return { output: ['File Not Found', ''] };
  if (node.type === 'file') return { output: [`  ${args}  ${formatSize(node.size ?? 0)}`, ''] };

  const entries = Object.entries(node.children ?? {}).filter(
    ([name]) => showAll || !name.startsWith('.'),
  );
  const output: string[] = [];

  if (entries.length === 0) {
    output.push('(empty)');
  } else if (longFormat) {
    output.push(`total ${entries.length}`);
    for (const [name, child] of entries) {
      const isDir = child.type === 'dir';
      const perm = child.permissions ?? (isDir ? 'drwxr-xr-x' : '-rw-r--r--');
      const size = formatSize(child.size ?? 0).padStart(8);
      const date = (child.date ?? '').padEnd(12);
      output.push(`${perm}  1 visitor visitor ${size} ${date} ${name}${isDir ? '/' : ''}`);
    }
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

const handleCat: CommandHandler = ({ root, cwd, args, stdin }) => {
  if (stdin && stdin.length > 0) return { output: [...stdin, ''] };
  if (!args) return { output: ['Usage: cat <filename>'] };
  const { node } = resolvePath(root, cwd, args);
  if (!node) return { output: ['File not found.', ''] };
  if (node.type === 'dir') return { output: [`Access denied - ${args} is a directory.`, ''] };
  return { output: [...(node.content ?? '').split('\n'), ''] };
};

const handleType: CommandHandler = (ctx) => {
  if (!ctx.args) return { output: ['The syntax of the command is incorrect.'] };
  return handleCat(ctx);
};

const handleHead: CommandHandler = ({ root, cwd, args, stdin }) => {
  let n = 10;
  let fileName = '';
  const parts = args.split(/\s+/);
  if (parts[0] === '-n' && parts[1]) {
    n = parseInt(parts[1], 10) || 10;
    fileName = parts.slice(2).join(' ');
  } else if (parts[0]?.startsWith('-') && !isNaN(Number(parts[0].slice(1)))) {
    n = parseInt(parts[0].slice(1), 10);
    fileName = parts.slice(1).join(' ');
  } else {
    fileName = args;
  }

  let lines: string[];
  if (stdin && stdin.length > 0) {
    lines = stdin;
  } else if (fileName) {
    const { node } = resolvePath(root, cwd, fileName);
    if (!node || node.type !== 'file') return { output: ['File not found.'] };
    lines = (node.content ?? '').split('\n');
  } else {
    return { output: ['Usage: head [-n count] <filename>'] };
  }
  return { output: [...lines.slice(0, n), ''] };
};

const handleTail: CommandHandler = ({ root, cwd, args, stdin }) => {
  let n = 10;
  let fileName = '';
  const parts = args.split(/\s+/);
  if (parts[0] === '-n' && parts[1]) {
    n = parseInt(parts[1], 10) || 10;
    fileName = parts.slice(2).join(' ');
  } else if (parts[0]?.startsWith('-') && !isNaN(Number(parts[0].slice(1)))) {
    n = parseInt(parts[0].slice(1), 10);
    fileName = parts.slice(1).join(' ');
  } else {
    fileName = args;
  }

  let lines: string[];
  if (stdin && stdin.length > 0) {
    lines = stdin;
  } else if (fileName) {
    const { node } = resolvePath(root, cwd, fileName);
    if (!node || node.type !== 'file') return { output: ['File not found.'] };
    lines = (node.content ?? '').split('\n');
  } else {
    return { output: ['Usage: tail [-n count] <filename>'] };
  }
  return { output: [...lines.slice(-n), ''] };
};

const handleMore: CommandHandler = (ctx) => handleCat(ctx);

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
  if (!parentNode.children![fileName]) {
    parentNode.children![fileName] = { type: 'file', content: '', size: 0, date: new Date().toLocaleDateString() };
  }
  return { output: [`Created: ${fileName}`, ''], mutatedFs: true };
};

const handleMkdir: CommandHandler = ({ root, cwd, args, getCwdNode }) => {
  if (!args) return { output: ['The syntax of the command is incorrect.', ''] };
  const flag = args.startsWith('-p ');
  const dirName = flag ? args.slice(3) : args;

  if (flag) {
    const parts = dirName.split(/[/\\]/).filter(Boolean);
    let current = getCwdNode();
    for (const part of parts) {
      if (!current.children![part]) {
        current.children![part] = { type: 'dir', children: {}, date: new Date().toLocaleDateString() };
      }
      current = current.children![part];
    }
    return { output: [''], mutatedFs: true };
  }

  const cwdNode = getCwdNode();
  if (cwdNode.children?.[dirName]) {
    return { output: [`A subdirectory or file ${dirName} already exists.`, ''] };
  }
  cwdNode.children![dirName] = { type: 'dir', children: {}, date: new Date().toLocaleDateString() };
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

const handleRm: CommandHandler = ({ root, cwd, args, getCwdNode }) => {
  if (args === '-rf /' || args === '-rf C:\\' || args === '*.*') {
    return { output: [
      'Nice try! You almost deleted everything.',
      'System Administrator has been notified.',
      '(Just kidding. Nothing happened.)',
      '',
    ] };
  }
  if (!args) return { output: ['The syntax of the command is incorrect.'] };

  const recursive = args.startsWith('-r ') || args.startsWith('-rf ');
  const target = recursive ? args.replace(/^-r[f]?\s+/, '') : args;

  const cwdNode = getCwdNode();
  if (cwdNode.children?.[target]) {
    if (cwdNode.children[target].type === 'dir' && !recursive) {
      return { output: [`${target}: is a directory. Use rm -r to remove.`, ''] };
    }
    delete cwdNode.children![target];
    return { output: [''], mutatedFs: true };
  }
  return { output: ['Could Not Find ' + target, ''] };
};

const handleCp: CommandHandler = ({ root, cwd, args, getCwdNode }) => {
  const cpArgs = args.split(/\s+/);
  const recursive = cpArgs[0] === '-r' || cpArgs[0] === '-R';
  if (recursive) cpArgs.shift();
  if (cpArgs.length < 2) return { output: ['Usage: cp [-r] <source> <destination>'] };
  const [src, dest] = cpArgs;

  const { node: srcNode } = resolvePath(root, cwd, src);
  if (!srcNode) return { output: ['Source not found.', ''] };
  if (srcNode.type === 'dir' && !recursive) return { output: ['cp: omitting directory. Use -r flag.', ''] };

  const destParts = dest.split(/[/\\]/);
  const destName = destParts.pop()!;
  const destDir = destParts.length > 0 ? destParts.join('\\') : '.';
  const { node: destDirNode } = resolvePath(root, cwd, destDir);
  if (!destDirNode || destDirNode.type !== 'dir') return { output: ['Destination directory not found.', ''] };

  const cloneNode = (n: FSNode): FSNode => {
    const c: FSNode = { ...n, date: new Date().toLocaleDateString() };
    if (n.children) {
      c.children = {};
      for (const [k, v] of Object.entries(n.children)) c.children[k] = cloneNode(v);
    }
    return c;
  };

  destDirNode.children![destName] = cloneNode(srcNode);
  return { output: [`Copied: ${src} -> ${dest}`, ''], mutatedFs: true };
};

const handleChmod: CommandHandler = ({ root, cwd, args }) => {
  const parts = args.split(/\s+/);
  if (parts.length < 2) return { output: ['Usage: chmod <mode> <file>'] };
  const [mode, target] = parts;
  const { node } = resolvePath(root, cwd, target);
  if (!node) return { output: ['File not found.', ''] };
  node.permissions = mode;
  return { output: [`Changed permissions of ${target} to ${mode}`, ''], mutatedFs: true };
};

const handleLn: CommandHandler = () => ({
  output: ['Symbolic links are not supported in this virtual filesystem.', ''],
});

const handleDiff: CommandHandler = ({ root, cwd, args }) => {
  const parts = args.split(/\s+/);
  if (parts.length < 2) return { output: ['Usage: diff <file1> <file2>'] };
  const { node: n1 } = resolvePath(root, cwd, parts[0]);
  const { node: n2 } = resolvePath(root, cwd, parts[1]);
  if (!n1 || n1.type !== 'file') return { output: [`${parts[0]}: No such file`] };
  if (!n2 || n2.type !== 'file') return { output: [`${parts[1]}: No such file`] };

  const lines1 = (n1.content ?? '').split('\n');
  const lines2 = (n2.content ?? '').split('\n');
  const output: string[] = [];
  const maxLen = Math.max(lines1.length, lines2.length);

  for (let i = 0; i < maxLen; i++) {
    if (lines1[i] !== lines2[i]) {
      if (lines1[i] !== undefined) output.push(`< ${lines1[i]}`);
      output.push('---');
      if (lines2[i] !== undefined) output.push(`> ${lines2[i]}`);
    }
  }
  if (output.length === 0) output.push('Files are identical.');
  output.push('');
  return { output };
};

/* ── File Search ──────────────────────────────── */

const handleGrep: CommandHandler = ({ root, cwd, args, stdin }) => {
  const flagMatch = args.match(/^(-[rinl]+)\s+(.*)/);
  const flags = flagMatch ? flagMatch[1] : '';
  const rest = flagMatch ? flagMatch[2] : args;

  const recursive = flags.includes('r') || flags.includes('R');
  const caseInsensitive = flags.includes('i');
  const showLineNum = flags.includes('n');
  const filesOnly = flags.includes('l');

  const quoteMatch = rest.match(/^["'](.+?)["']\s*(.*)/);
  const spaceMatch = rest.match(/^(\S+)\s*(.*)/);
  let pattern = '';
  let target = '';

  if (quoteMatch) {
    pattern = quoteMatch[1];
    target = quoteMatch[2];
  } else if (spaceMatch) {
    pattern = spaceMatch[1];
    target = spaceMatch[2];
  }

  if (!pattern) return { output: ['Usage: grep [-rinl] <pattern> [file|dir]'] };

  const regex = new RegExp(pattern, caseInsensitive ? 'i' : '');

  if (stdin && stdin.length > 0) {
    const output = stdin
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => regex.test(line))
      .map(({ line, i }) => (showLineNum ? `${i + 1}:${line}` : line));
    return { output: [...output, ''] };
  }

  if (!target) target = '.';
  const { node } = resolvePath(root, cwd, target);
  if (!node) return { output: ['No such file or directory.', ''] };

  if (node.type === 'file') {
    const lines = (node.content ?? '').split('\n');
    const output = lines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => regex.test(line))
      .map(({ line, i }) => (showLineNum ? `${i + 1}:${line}` : line));
    return { output: [...output, ''] };
  }

  const results = grepFiles(node, cwd, regex, recursive);
  if (filesOnly) {
    const uniqueFiles = [...new Set(results.map((r) => r.file))];
    return { output: [...uniqueFiles, ''] };
  }
  const output = results.map((r) =>
    showLineNum ? `${r.file}:${r.line}:${r.text}` : `${r.file}:${r.text}`,
  );
  return { output: [...output, ''] };
};

const handleFind: CommandHandler = ({ root, cwd, args }) => {
  const parts = args.split(/\s+/);
  let searchPath = '.';
  let namePattern = '*';

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '-name' && parts[i + 1]) {
      namePattern = parts[i + 1].replace(/^["']|["']$/g, '');
      i++;
    } else if (parts[i] === '-type') {
      i++; // skip type arg (not fully implemented)
    } else if (!parts[i].startsWith('-')) {
      searchPath = parts[i];
    }
  }

  const { node } = resolvePath(root, cwd, searchPath);
  if (!node || node.type !== 'dir') return { output: ['Directory not found.', ''] };

  const results = findFiles(node, cwd.length > 0 ? cwd : [], namePattern);
  if (results.length === 0) return { output: ['No files found.', ''] };
  return { output: [...results.map((r) => `C:\\${r}`), ''] };
};

/* ── Text Processing ──────────────────────────── */

const handleWc: CommandHandler = ({ root, cwd, args, stdin }) => {
  let content: string;
  let fileName = '';

  if (stdin && stdin.length > 0) {
    content = stdin.join('\n');
  } else if (args) {
    fileName = args.replace(/^-\S+\s*/, '');
    const { node } = resolvePath(root, cwd, fileName || args);
    if (!node || node.type !== 'file') return { output: ['File not found.'] };
    content = node.content ?? '';
  } else {
    return { output: ['Usage: wc <filename>'] };
  }

  const lines = content.split('\n').length;
  const words = content.split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  return { output: [`  ${lines}  ${words}  ${chars}${fileName ? '  ' + fileName : ''}`, ''] };
};

const handleSort: CommandHandler = ({ root, cwd, args, stdin }) => {
  const reverse = args.startsWith('-r');
  const fileName = reverse ? args.slice(3) : args;
  let lines: string[];

  if (stdin && stdin.length > 0) {
    lines = [...stdin];
  } else if (fileName) {
    const { node } = resolvePath(root, cwd, fileName);
    if (!node || node.type !== 'file') return { output: ['File not found.'] };
    lines = (node.content ?? '').split('\n');
  } else {
    return { output: ['Usage: sort [-r] <filename>'] };
  }

  lines.sort();
  if (reverse) lines.reverse();
  return { output: [...lines, ''] };
};

const handleUniq: CommandHandler = ({ root, cwd, args, stdin }) => {
  let lines: string[];

  if (stdin && stdin.length > 0) {
    lines = stdin;
  } else if (args) {
    const { node } = resolvePath(root, cwd, args);
    if (!node || node.type !== 'file') return { output: ['File not found.'] };
    lines = (node.content ?? '').split('\n');
  } else {
    return { output: ['Usage: uniq <filename>'] };
  }

  const result = lines.filter((line, i) => i === 0 || line !== lines[i - 1]);
  return { output: [...result, ''] };
};

const handleXxd: CommandHandler = ({ root, cwd, args }) => {
  if (!args) return { output: ['Usage: xxd <filename>'] };
  const { node } = resolvePath(root, cwd, args);
  if (!node || node.type !== 'file') return { output: ['File not found.'] };
  const content = node.content ?? '';
  const output: string[] = [];
  for (let i = 0; i < Math.min(content.length, 256); i += 16) {
    const chunk = content.slice(i, i + 16);
    const hex = Array.from(chunk).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from(chunk).map((c) => (c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127 ? c : '.')).join('');
    output.push(`${i.toString(16).padStart(8, '0')}: ${hex.padEnd(48)}  ${ascii}`);
  }
  if (content.length > 256) output.push(`... (${content.length - 256} more bytes)`);
  output.push('');
  return { output };
};

/* ── Tree ──────────────────────────────────── */

const handleTree: CommandHandler = ({ root, cwd, args }) => {
  const { node } = args
    ? resolvePath(root, cwd, args)
    : resolvePath(root, [], cwd.join('\\'));
  if (!node || node.type !== 'dir') return { output: ['Invalid path.'] };

  const output: string[] = ['.'];
  let fileCount = 0;
  let dirCount = 0;
  const printTree = (n: FSNode, prefix: string) => {
    const entries = Object.entries(n.children ?? {});
    entries.forEach(([name, child], i) => {
      const isLast = i === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      output.push(`${prefix}${connector}${name}${child.type === 'dir' ? '/' : ''}`);
      if (child.type === 'dir') {
        dirCount++;
        printTree(child, prefix + (isLast ? '    ' : '│   '));
      } else {
        fileCount++;
      }
    });
  };
  printTree(node, '');
  output.push('', `${dirCount} directories, ${fileCount} files`, '');
  return { output };
};

/* ── System Info ──────────────────────────────── */

const handleWhoami: CommandHandler = () => ({ output: ['C:\\Users\\visitor', ''] });
const handleHostname: CommandHandler = () => ({ output: ['YANGSOYEON-PC', ''] });
const handleUname: CommandHandler = ({ args }) => {
  if (args === '-a') {
    return { output: ['Windows98 YANGSOYEON-PC 4.10.1998 i686 x86 Windows98', ''] };
  }
  return { output: ['Windows98 YANGSOYEON-PC 4.10.1998 i686', ''] };
};
const handleVer: CommandHandler = () => ({ output: ['', 'Windows 98 [Version 4.10.1998]', ''] });
const handleDate: CommandHandler = () => ({ output: [`The current date is: ${new Date().toLocaleDateString()}`, ''] });
const handleTime: CommandHandler = () => ({ output: [`The current time is: ${new Date().toLocaleTimeString()}`, ''] });
const handleEcho: CommandHandler = ({ args }) => ({ output: [args || '', ''] });
const handleColor: CommandHandler = () => ({ output: ['Color changed. (Just kidding, aesthetics are fixed.)', ''] });
const handleSudo: CommandHandler = ({ args }) => {
  if (args === 'rm -rf /') return { output: ['Nice try, hacker.', ''] };
  return { output: ["Nice try. This is Windows 98, we don't do sudo here.", ''] };
};
const handleExit: CommandHandler = () => ({ output: ['There is no escape.', ''] });

const handleUptime: CommandHandler = () => {
  const days = Math.floor(Math.random() * 365) + 30;
  const hours = Math.floor(Math.random() * 24);
  const mins = Math.floor(Math.random() * 60);
  return { output: [`up ${days} days, ${hours}:${String(mins).padStart(2, '0')}, 1 user, load average: 0.42, 0.38, 0.35`, ''] };
};

const handlePs: CommandHandler = ({ args }) => {
  const showAll = args.includes('-e') || args.includes('-a') || args.includes('aux');
  const processes = [
    { pid: 1, name: 'System', cpu: '0.0', mem: '0.1', status: 'Running' },
    { pid: 4, name: 'smss.exe', cpu: '0.0', mem: '0.2', status: 'Running' },
    { pid: 12, name: 'csrss.exe', cpu: '0.1', mem: '1.4', status: 'Running' },
    { pid: 24, name: 'explorer.exe', cpu: '2.3', mem: '8.2', status: 'Running' },
    { pid: 42, name: 'cmd.exe', cpu: '0.5', mem: '1.8', status: 'Running' },
    ...(showAll ? [
      { pid: 88, name: 'winamp.exe', cpu: '1.2', mem: '4.5', status: 'Running' },
      { pid: 101, name: 'iexplore.exe', cpu: '5.8', mem: '12.3', status: 'Running' },
      { pid: 156, name: 'notepad.exe', cpu: '0.1', mem: '0.8', status: 'Running' },
      { pid: 200, name: 'mspaint.exe', cpu: '0.3', mem: '2.1', status: 'Running' },
      { pid: 255, name: 'sol.exe', cpu: '0.2', mem: '0.5', status: 'Idle' },
    ] : []),
  ];

  const output: string[] = ['  PID  NAME               CPU%  MEM%  STATUS'];
  for (const p of processes) {
    output.push(
      `${String(p.pid).padStart(5)}  ${p.name.padEnd(18)} ${p.cpu.padStart(4)}  ${p.mem.padStart(4)}%  ${p.status}`,
    );
  }
  output.push('');
  return { output };
};

const handleTasklist: CommandHandler = (ctx) => handlePs(ctx);

const handleKill: CommandHandler = ({ args }) => {
  if (!args) return { output: ['Usage: kill <PID>'] };
  const pid = parseInt(args.replace(/^-9\s*/, ''), 10);
  if (isNaN(pid)) return { output: ['Invalid PID.'] };
  if (pid === 1) return { output: ['Cannot kill System process. Nice try.', ''] };
  if (pid === 42) return { output: ['You cannot kill yourself. Philosophical, right?', ''] };
  return { output: [`Process ${pid} terminated.`, ''] };
};

const handleTaskkill: CommandHandler = (ctx) => handleKill(ctx);

const handleTop: CommandHandler = () => ({
  output: [],
  asyncHandler: (appendLines) => {
    const header = [
      'top - System Monitor (press Ctrl+C to exit... just kidding)',
      `Tasks: 10 total, 8 running, 2 idle`,
      `CPU: 12.4% user, 3.2% system, 84.4% idle`,
      `Mem: 128M total, 86M used, 42M free`,
      '',
      '  PID  NAME               CPU%  MEM%',
    ];
    appendLines(header);
    let count = 0;
    const id = setInterval(() => {
      const cpu = (Math.random() * 15).toFixed(1);
      const mem = (Math.random() * 20).toFixed(1);
      appendLines([`  ${Math.floor(Math.random() * 300)}  process_${count.toString().padStart(3, '0')}         ${cpu.padStart(5)}  ${mem.padStart(5)}%`]);
      count++;
      if (count >= 8) {
        clearInterval(id);
        appendLines(['', '--- Monitor stopped ---', '']);
      }
    }, 400);
  },
});

const handlePing: CommandHandler = ({ args }) => {
  const host = args || 'localhost';
  return {
    output: [`Pinging ${host} with 32 bytes of data:`, ''],
    asyncHandler: (appendLines) => {
      let count = 0;
      const id = setInterval(() => {
        const ms = Math.floor(Math.random() * 50) + 1;
        appendLines([`Reply from ${host}: bytes=32 time=${ms}ms TTL=128`]);
        count++;
        if (count >= 4) {
          clearInterval(id);
          appendLines([
            '',
            `Ping statistics for ${host}:`,
            '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),',
            'Approximate round trip times in milli-seconds:',
            '    Minimum = 1ms, Maximum = 48ms, Average = 22ms',
            '',
          ]);
        }
      }, 500);
    },
  };
};

const handleIfconfig: CommandHandler = () => ({
  output: [
    'Ethernet adapter Local Area Connection:',
    '',
    '   Connection-specific DNS Suffix  . : home.net',
    '   IPv4 Address. . . . . . . . . . . : 192.168.1.98',
    '   Subnet Mask . . . . . . . . . . . : 255.255.255.0',
    '   Default Gateway . . . . . . . . . : 192.168.1.1',
    '   MAC Address . . . . . . . . . . . : 00:98:WI:ND:OW:98',
    '   DHCP Enabled. . . . . . . . . . . : Yes',
    '',
  ],
});

const handleCurl: CommandHandler = ({ args }) => {
  const url = args.replace(/^-[sS]\s*/, '') || '';
  if (!url) return { output: ['Usage: curl <url>'] };
  return {
    output: [],
    asyncHandler: (appendLines) => {
      appendLines([`  % Total    % Received  Time`, `  100  1024   100  1024  0:00:01`]);
      setTimeout(() => {
        appendLines([
          '',
          '<!DOCTYPE html>',
          '<html><head><title>Hello!</title></head>',
          '<body>',
          `  <h1>Response from ${url}</h1>`,
          '  <p>This is a simulated response.</p>',
          '  <p>Real HTTP requests are not supported in this terminal.</p>',
          '</body></html>',
          '',
        ]);
      }, 800);
    },
  };
};

const handleWget: CommandHandler = ({ args }) => {
  if (!args) return { output: ['Usage: wget <url>'] };
  return {
    output: [],
    asyncHandler: (appendLines) => {
      appendLines([
        `--2026-03-10 12:00:00--  ${args}`,
        'Resolving host... 93.184.216.34',
        'Connecting... connected.',
        'HTTP request sent, awaiting response... 200 OK',
        'Length: 1024 (1.0K) [text/html]',
        'Saving to: "index.html"',
        '',
      ]);
      let pct = 0;
      const id = setInterval(() => {
        pct += 25;
        const bar = '='.repeat(pct / 5) + '>' + ' '.repeat(20 - pct / 5);
        appendLines([`  [${bar}] ${Math.min(pct, 100)}%`]);
        if (pct >= 100) {
          clearInterval(id);
          appendLines(['', `"index.html" saved [1024/1024]`, '(File not actually saved in virtual FS)', '']);
        }
      }, 300);
    },
  };
};

const handleSsh: CommandHandler = ({ args }) => {
  if (!args) return { output: ['Usage: ssh <user@host>'] };
  return {
    output: [],
    asyncHandler: (appendLines) => {
      appendLines([`Connecting to ${args}...`]);
      setTimeout(() => appendLines(['Connection established.']), 500);
      setTimeout(() => appendLines([`Warning: Permanently added '${args}' to known hosts.`]), 1000);
      setTimeout(() => appendLines([
        '',
        'Just kidding! SSH is not supported in a browser terminal.',
        'But nice try! You clearly know your way around a terminal.',
        '',
      ]), 1500);
    },
  };
};

const handleDf: CommandHandler = () => ({
  output: [
    'Filesystem      Size  Used  Avail Use% Mounted on',
    'C:\\             4.0G  1.2G  2.8G  30%  /',
    'D:\\             8.0G  0.0G  8.0G   0%  /media/cdrom',
    'A:\\             1.4M  0.0M  1.4M   0%  /media/floppy',
    '',
  ],
});

const handleFree: CommandHandler = () => ({
  output: [
    '              total        used        free      shared  buff/cache   available',
    'Mem:         131072       86016       45056        4096       12288       40960',
    'Swap:         65536        8192       57344',
    '(values in KB)',
    '',
  ],
});

/* ── Environment ──────────────────────────────── */

const handleEnv: CommandHandler = ({ env }) => {
  const output = Object.entries(env).map(([k, v]) => `${k}=${v}`);
  output.push('');
  return { output };
};

const handleExport: CommandHandler = ({ args }) => {
  if (!args) return { output: ['Usage: export VAR=value'] };
  const eqIdx = args.indexOf('=');
  if (eqIdx === -1) return { output: ['Usage: export VAR=value'] };
  const key = args.slice(0, eqIdx);
  const value = args.slice(eqIdx + 1).replace(/^["']|["']$/g, '');
  return { output: [''], setEnv: { [key]: value } };
};

const handleUnset: CommandHandler = ({ args }) => {
  if (!args) return { output: ['Usage: unset <VAR>'] };
  return { output: [''], unsetEnv: [args] };
};

const handleWhich: CommandHandler = ({ args }) => {
  if (!args) return { output: ['Usage: which <command>'] };
  const builtins = Object.keys(COMMAND_REGISTRY);
  if (builtins.includes(args.toLowerCase())) {
    return { output: [`C:\\WINDOWS\\SYSTEM32\\${args.toLowerCase()}.exe`, ''] };
  }
  return { output: [`${args} not found`, ''] };
};

/* ── Utility ──────────────────────────────────── */

const handleHistory: CommandHandler = ({ history }) => {
  const output = history.map((cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`);
  output.push('');
  return { output };
};

const handleCal: CommandHandler = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const title = `${monthNames[month]} ${year}`;
  const output: string[] = [title.padStart(Math.floor((20 + title.length) / 2))];
  output.push('Su Mo Tu We Th Fr Sa');

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  let line = '   '.repeat(firstDay);
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = d === today ? `[${String(d).padStart(2)}]` : ` ${String(d).padStart(2)}`;
    line += d === today ? dayStr : dayStr;
    if ((firstDay + d) % 7 === 0 || d === daysInMonth) {
      output.push(line);
      line = '';
    }
  }
  output.push('');
  return { output };
};

const handleBc: CommandHandler = ({ args, stdin }) => {
  const expr = args || (stdin ? stdin.join('') : '');
  if (!expr) return { output: ['Usage: bc <expression>  (e.g., bc 2+3*4)'] };
  try {
    // Safe math evaluation - only allow numbers and math operators
    if (!/^[\d\s+\-*/().%^]+$/.test(expr)) {
      return { output: ['Invalid expression. Only numbers and +,-,*,/,(),% are allowed.'] };
    }
    const result = Function(`"use strict"; return (${expr})`)();
    return { output: [String(result), ''] };
  } catch {
    return { output: ['Error: Invalid expression.', ''] };
  }
};

const handleBase64: CommandHandler = ({ args, stdin }) => {
  const decode = args.startsWith('-d ') || args.startsWith('--decode ');
  const input = decode ? args.replace(/^-d\s+|^--decode\s+/, '') : args;
  const text = input || (stdin ? stdin.join('\n') : '');
  if (!text) return { output: ['Usage: base64 [-d] <text>'] };

  try {
    if (decode) {
      return { output: [atob(text), ''] };
    }
    return { output: [btoa(text), ''] };
  } catch {
    return { output: ['Error: Invalid input.', ''] };
  }
};

const handleMan: CommandHandler = ({ args }) => {
  if (!args) return { output: ['What manual page do you want?'] };

  const manPages: Record<string, string[]> = {
    vi: [
      'VI(1)                        User Commands                        VI(1)',
      '',
      'NAME',
      '       vi - visual editor',
      '',
      'SYNOPSIS',
      '       vi [file]',
      '',
      'DESCRIPTION',
      '       vi is a screen-oriented text editor.',
      '',
      '       NORMAL MODE:',
      '         h/j/k/l   - Move cursor left/down/up/right',
      '         i          - Enter insert mode',
      '         a          - Enter insert mode after cursor',
      '         o/O        - New line below/above',
      '         A          - End of line, insert mode',
      '         x          - Delete character',
      '         dd         - Delete line',
      '         yy         - Yank (copy) line',
      '         p          - Paste yanked line',
      '         gg         - Go to first line',
      '         G          - Go to last line',
      '         0          - Start of line',
      '         $          - End of line',
      '         :          - Enter command mode',
      '',
      '       COMMAND MODE:',
      '         :w         - Save file',
      '         :q         - Quit (fails if modified)',
      '         :q!        - Force quit without saving',
      '         :wq / :x   - Save and quit',
      '',
      '       INSERT MODE:',
      '         <Esc>      - Return to normal mode',
      '         Type normally to insert text',
      '',
    ],
    grep: [
      'GREP(1)                      User Commands                      GREP(1)',
      '', 'NAME', '       grep - search for patterns in files',
      '', 'SYNOPSIS', '       grep [-rinl] <pattern> [file|dir]',
      '', 'FLAGS', '       -r  Recursive search',
      '       -i  Case insensitive', '       -n  Show line numbers',
      '       -l  Show filenames only', '',
    ],
    find: [
      'FIND(1)                      User Commands                      FIND(1)',
      '', 'NAME', '       find - search for files',
      '', 'SYNOPSIS', '       find [path] -name <pattern>',
      '', 'DESCRIPTION', '       Search for files matching pattern. Supports * and ? wildcards.', '',
    ],
    ls: [
      'LS(1)                        User Commands                        LS(1)',
      '', 'NAME', '       ls - list directory contents',
      '', 'SYNOPSIS', '       ls [-la] [path]',
      '', 'FLAGS', '       -l  Long format', '       -a  Show hidden files', '',
    ],
  };

  const page = manPages[args.toLowerCase()];
  if (!page) return { output: [`No manual entry for ${args}`, ''] };
  return { output: page };
};

/* ── Editor ──────────────────────────────────── */

const handleVi: CommandHandler = ({ root, cwd, args }) => {
  if (!args) return { output: ['Usage: vi <filename>'] };

  const { node, absPath } = resolvePath(root, cwd, args);
  if (node && node.type === 'dir') {
    return { output: [`"${args}" is a directory`] };
  }

  const fileName = args.split(/[/\\]/).pop() || args;
  const isNewFile = !node;
  const content = node?.content ?? '';

  const parts = args.split(/[/\\]/);
  let filePath: string[];
  if (parts.length > 1) {
    const dirPath = parts.slice(0, -1).join('\\');
    const { absPath: dirAbsPath } = resolvePath(root, cwd, dirPath);
    filePath = [...dirAbsPath, fileName];
  } else {
    filePath = [...cwd, fileName];
  }

  return {
    output: [],
    editorMode: { fileName, filePath, content, isNewFile },
  };
};

/* ── Info / About ──────────────────────────────── */

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
    '    cd <path>        Change directory (supports ~, .., /)',
    '    pwd              Print working directory',
    '',
    '  Listing:',
    '    ls [-la] [path]  List files (Unix style)',
    '    dir [path]       List files (DOS style)',
    '    tree [path]      Show directory tree',
    '',
    '  File Operations:',
    '    cat <file>       Show file contents',
    '    head [-n N] <f>  Show first N lines',
    '    tail [-n N] <f>  Show last N lines',
    '    more <file>      Page through file',
    '    touch <file>     Create empty file',
    '    mkdir [-p] <dir> Create directory',
    '    cp [-r] <s> <d>  Copy file/directory',
    '    mv <old> <new>   Rename/move file',
    '    rm [-r] <file>   Delete file/directory',
    '    rmdir <dir>      Remove empty directory',
    '    chmod <m> <f>    Change permissions',
    '    diff <f1> <f2>   Compare two files',
    '    xxd <file>       Hex dump of file',
    '',
    '  Editor:',
    '    vi <file>        Open file in vi editor',
    '    vim <file>       Alias for vi',
    '    nano <file>      Alias for vi',
    '',
    '  Search:',
    '    grep [-rinl] <pattern> [file]',
    '    find [path] -name <pattern>',
    '',
    '  Text Processing:',
    '    wc <file>        Count lines/words/chars',
    '    sort [-r] <file> Sort lines',
    '    uniq <file>      Remove duplicate lines',
    '    base64 [-d] <t>  Base64 encode/decode',
    '',
    '  System:',
    '    whoami           Show current user',
    '    hostname         Show computer name',
    '    uname [-a]       Show system info',
    '    uptime           Show system uptime',
    '    ps [aux/-e]      Show running processes',
    '    kill <PID>       Terminate process',
    '    top              Live process monitor',
    '    df               Show disk usage',
    '    free             Show memory usage',
    '    ver              Show Windows version',
    '    date / time      Show date/time',
    '',
    '  Network:',
    '    ping <host>      Ping a host',
    '    ifconfig/ipconfig Network configuration',
    '    curl <url>       HTTP request (simulated)',
    '    wget <url>       Download file (simulated)',
    '    ssh <user@host>  SSH connection (simulated)',
    '',
    '  Environment:',
    '    env / printenv   Show environment variables',
    '    export VAR=val   Set environment variable',
    '    unset <VAR>      Remove environment variable',
    '    echo <text>      Print text (supports $VAR)',
    '',
    '  Utility:',
    '    history          Show command history',
    '    which <cmd>      Find command location',
    '    man <cmd>        Show manual page',
    '    cal              Show calendar',
    '    bc <expr>        Calculator',
    '    clear / cls      Clear screen',
    '    about            About this terminal',
    '',
    '  Piping & Redirection:',
    '    cmd1 | cmd2      Pipe output to next command',
    '    cmd > file       Write output to file',
    '    cmd >> file      Append output to file',
    '    cmd1 && cmd2     Run cmd2 if cmd1 succeeds',
    '',
    '  Easter Eggs:',
    '    neofetch         System info with ASCII art',
    '    cowsay <text>    The cow speaks!',
    '    matrix           Enter the Matrix',
    '    hack             Elite hacking mode',
    '    fortune          Random quote',
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

const handleNeofetch: CommandHandler = () => ({
  output: [
    '',
    '        ████████████████        visitor@YANGSOYEON-PC',
    '      ██                ██      ─────────────────────',
    '    ██   ██████████████   ██    OS: Windows 98 SE',
    '    ██   ██          ██   ██    Host: YANGSOYEON-PC',
    '    ██   ██  ██████  ██   ██    Kernel: 4.10.1998',
    '    ██   ██  ██  ██  ██   ██    Uptime: 42 days',
    '    ██   ██  ██████  ██   ██    Shell: cmd.exe',
    '    ██   ██          ██   ██    Resolution: 1024x768',
    '    ██   ██████████████   ██    Terminal: VT323',
    '      ██                ██      CPU: Intel Pentium II',
    '        ████████████████        Memory: 86M / 128M',
    '    ██████████████████████████  Disk: 1.2G / 4.0G',
    '    ██                      ██  Theme: Retro 98',
    '    ██████████████████████████  Font: VT323 Monospace',
    '',
    '    ██ ██ ██ ██ ██ ██ ██ ██',
    '',
  ],
});

const handleCowsay: CommandHandler = ({ args }) => {
  const text = args || 'Moo!';
  const border = '-'.repeat(text.length + 2);
  return {
    output: [
      ` ${border}`,
      `< ${text} >`,
      ` ${border}`,
      '        \\   ^__^',
      '         \\  (oo)\\_______',
      '            (__)\\       )\\/\\',
      '                ||----w |',
      '                ||     ||',
      '',
    ],
  };
};

const handleFortune: CommandHandler = () => {
  const fortunes = [
    'The best way to predict the future is to create it.',
    'Code is like humor. When you have to explain it, it\'s bad.',
    'First, solve the problem. Then, write the code.',
    'Simplicity is the soul of efficiency.',
    'Talk is cheap. Show me the code. - Linus Torvalds',
    'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
    'Programs must be written for people to read, and only incidentally for machines to execute.',
    'The most dangerous phrase in the language is "We\'ve always done it this way."',
    'It works on my machine!',
    'There are only 10 types of people: those who understand binary and those who don\'t.',
    'To understand recursion, you must first understand recursion.',
    '// This code is a mess but it works, don\'t touch it',
    'sudo make me a sandwich',
    'Have you tried turning it off and on again?',
  ];
  const f = fortunes[Math.floor(Math.random() * fortunes.length)];
  return { output: ['', `  "${f}"`, '', '  -- fortune cookie', ''] };
};

const handleSl: CommandHandler = () => ({
  output: [],
  asyncHandler: (appendLines) => {
    const frames = [
      [
        '      ====        ________                ___________',
        '  _D _|  |_______/        \\__I_I_____===__|_________|',
        '   |(_)---  |   H\\________/ |   |        =|___ ___|',
        '   /     |  |   H  |  |     |   |         ||_| |_||',
        '  |      |  |   H  |__--------------------| [___] |',
        '  | ________|___H__/__|_____/[][]~\\_______|       |',
        '  |/ |   |-----------I_____I [][] []  D   |=======|__',
      ],
      [
        '                    ____',
        '                   / __ \\',
        '     _____________/ /  \\ \\___________',
        '    |  _________  /    \\ \\_________  |',
        '    | |    CHOO |/      \\| CHOO    | |',
        '    | |  CHOO!! |   ()  |  !!CHOO  | |',
        '    |_|_________|______/|__________|_|',
      ],
    ];
    let i = 0;
    const id = setInterval(() => {
      if (i < frames.length) {
        appendLines(frames[i]);
        i++;
      } else {
        clearInterval(id);
        appendLines(['', 'You have been trained to always type "ls" correctly now.', '']);
      }
    }, 1200);
  },
});

/* ── Command Registry ──────────────────────── */

export const COMMAND_REGISTRY: Record<string, CommandHandler> = {
  // Navigation
  cd: handleCd, chdir: handleCd, pwd: handlePwd,
  // Listing
  dir: handleDir, ls: handleLs, tree: handleTree,
  // File Reading
  cat: handleCat, type: handleType, head: handleHead, tail: handleTail,
  more: handleMore, less: handleMore,
  // File Operations
  touch: handleTouch,
  mkdir: handleMkdir, md: handleMkdir,
  rmdir: handleRmdir, rd: handleRmdir,
  mv: handleRename, rename: handleRename, ren: handleRename,
  rm: handleRm, del: handleRm,
  cp: handleCp, copy: handleCp,
  chmod: handleChmod,
  ln: handleLn,
  diff: handleDiff,
  // Search
  grep: handleGrep, find: handleFind,
  // Text Processing
  wc: handleWc, sort: handleSort, uniq: handleUniq, xxd: handleXxd,
  // System Info
  whoami: handleWhoami, hostname: handleHostname,
  uname: handleUname, ver: handleVer,
  date: handleDate, time: handleTime,
  uptime: handleUptime,
  ps: handlePs, tasklist: handleTasklist,
  kill: handleKill, taskkill: handleTaskkill,
  top: handleTop, htop: handleTop,
  df: handleDf, free: handleFree,
  // Network
  ping: handlePing,
  ifconfig: handleIfconfig, ipconfig: handleIfconfig,
  curl: handleCurl, wget: handleWget, ssh: handleSsh,
  // Environment
  env: handleEnv, printenv: handleEnv,
  export: handleExport, set: handleExport,
  unset: handleUnset,
  which: handleWhich, where: handleWhich,
  // Utility
  echo: handleEcho, history: handleHistory, cal: handleCal,
  bc: handleBc, base64: handleBase64, man: handleMan,
  // Editor
  vi: handleVi, vim: handleVi, nano: handleVi, edit: handleVi,
  // Misc
  color: handleColor, sudo: handleSudo, exit: handleExit,
  about: handleAbout, help: handleHelp, '?': handleHelp,
  // Easter Eggs
  matrix: handleMatrix, cmatrix: handleMatrix,
  hack: handleHack,
  neofetch: handleNeofetch, screenfetch: handleNeofetch,
  cowsay: handleCowsay,
  fortune: handleFortune,
  sl: handleSl,
};
