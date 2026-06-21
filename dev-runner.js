import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[RUNNER] Starting backend database API and frontend Vite servers concurrently...');

// 1. Launch Node Express Server
const serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
  stdio: 'inherit',
  shell: true
});

// 2. Launch Vite Dev Server
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true
});

// Forward termination signals to child processes
const cleanup = () => {
  console.log('[RUNNER] Stopping active server child processes...');
  try {
    serverProcess.kill('SIGINT');
  } catch (e) {}
  try {
    viteProcess.kill('SIGINT');
  } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
