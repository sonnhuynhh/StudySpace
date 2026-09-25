import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const port = process.env.EXPO_PORT ?? '8080';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expoCli = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
const forwardedArguments = process.argv.slice(2);

console.log(
  `StudySpace sẽ tạo link Expo Tunnel cho phiên này (Metro :${port}). Quét QR do Expo hiển thị.`,
);

const child = spawn(
  process.execPath,
  [expoCli, 'start', '--tunnel', '--port', port, ...forwardedArguments],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  },
);

child.on('error', (error) => {
  console.error('Không thể khởi động Expo:', error.message);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
