import { MouseCoords, SystemStats, ClipboardItem, StashItem } from './types';

// Check if running inside real Tauri desktop environment
export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

type UnlistenFn = () => void;

// -------------------------------------------------------------
// Mouse Tracking Hook / Listener
// -------------------------------------------------------------
export function listenGlobalMouse(callback: (coords: MouseCoords) => void): UnlistenFn {
  if (isTauri) {
    try {
      // In real Tauri, listen to the event emitted by rdev in main.rs
      const tauriEvent = (window as unknown as { __TAURI__: { event: { listen: (name: string, cb: (e: { payload: MouseCoords }) => void) => Promise<UnlistenFn> } } }).__TAURI__.event;
      let unlisten: UnlistenFn = () => {};
      tauriEvent.listen('mouse-moved', (e) => {
        callback(e.payload);
      }).then((fn) => {
        unlisten = fn;
      });
      return () => unlisten();
    } catch {
      // fallback
    }
  }

  // Web Environment Fallback: Window mousemove listener
  const handler = (e: MouseEvent) => {
    callback({ x: e.clientX, y: e.clientY });
  };
  window.addEventListener('mousemove', handler);
  return () => window.removeEventListener('mousemove', handler);
}

// -------------------------------------------------------------
// System Telemetry Stream
// -------------------------------------------------------------
export function listenSystemTelemetry(callback: (stats: SystemStats) => void): UnlistenFn {
  if (isTauri) {
    try {
      const tauriEvent = (window as unknown as { __TAURI__: { event: { listen: (name: string, cb: (e: { payload: SystemStats }) => void) => Promise<UnlistenFn> } } }).__TAURI__.event;
      let unlisten: UnlistenFn = () => {};
      tauriEvent.listen('system-telemetry', (e) => {
        callback(e.payload);
      }).then((fn) => {
        unlisten = fn;
      });
      return () => unlisten();
    } catch {
      // fallback
    }
  }

  // Simulated realistic live telemetry with smooth micro-fluctuations
  let cpu = 14.2;
  let ramUsed = 7120;
  const ramTotal = 16384;
  let netRx = 142.5;

  const interval = setInterval(() => {
    // Human-like smooth oscillations
    cpu = Math.max(4.1, Math.min(68.5, cpu + (Math.random() - 0.48) * 4.5));
    ramUsed = Math.max(6800, Math.min(8400, ramUsed + Math.round((Math.random() - 0.5) * 35)));
    netRx = Math.max(12.0, Math.min(940.0, netRx + (Math.random() - 0.49) * 25));

    callback({
      cpuPercent: parseFloat(cpu.toFixed(1)),
      ramUsedMb: ramUsed,
      ramTotalMb: ramTotal,
      ramPercent: parseFloat(((ramUsed / ramTotal) * 100).toFixed(1)),
      netRxKbps: parseFloat(netRx.toFixed(1)),
      netTxKbps: parseFloat((netRx * 0.28).toFixed(1)),
    });
  }, 1000);

  return () => clearInterval(interval);
}

// -------------------------------------------------------------
// App Launcher Command
// -------------------------------------------------------------
export async function launchApp(appName: string): Promise<string> {
  if (isTauri) {
    try {
      const tauriInvoke = (window as unknown as { __TAURI__: { invoke: (cmd: string, args?: unknown) => Promise<string> } }).__TAURI__.invoke;
      return await tauriInvoke('launch_app', { appName });
    } catch (err) {
      console.warn('Tauri invoke error:', err);
    }
  }

  // Simulated launch notification
  return `Launched ${appName}`;
}

// -------------------------------------------------------------
// Terminal Command Execution
// -------------------------------------------------------------
export async function runTerminalCommand(command: string): Promise<string> {
  if (isTauri) {
    try {
      const tauriInvoke = (window as unknown as { __TAURI__: { invoke: (cmd: string, args?: unknown) => Promise<string> } }).__TAURI__.invoke;
      return await tauriInvoke('run_terminal_command', { command });
    } catch (err) {
      console.warn('Tauri invoke error:', err);
    }
  }

  const parts = command.trim().split(' ');
  const cmd = parts[0]?.toLowerCase();

  switch (cmd) {
    case 'help':
      return 'Available: help, stats, open <app>, stash, calc <expr>, weather, date, clear';
    case 'stats':
      return 'Orb Desktop footprint: 8.2MB RAM · 0.3% CPU · Rust/Tauri kernel active';
    case 'open':
      return `Launched application: ${parts.slice(1).join(' ') || 'Desktop'}`;
    case 'calc':
      try {
        const expr = parts.slice(1).join(' ');
        // Basic safe calculation
        const sanitized = expr.replace(/[^0-9+\-*/().]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        return `${expr} = ${result}`;
      } catch {
        return 'Math syntax error (e.g. calc 14 * 28)';
      }
    case 'weather':
      return 'San Francisco: 64°F Gentle Breeze · 0% Precip · Air Quality: 28 Good';
    case 'date':
      return new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' });
    case 'stash':
      return 'Stash pocket active. Drop files on the pet to chomp & store them.';
    case 'clear':
      return '__CLEAR__';
    default:
      return `command not found: ${command}. Type 'help' for command list.`;
  }
}

// -------------------------------------------------------------
// Clipboard Operations
// -------------------------------------------------------------
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export const initialClipboardHistory: ClipboardItem[] = [
  {
    id: 'c1',
    content: 'const orbitRadius = 105; // Defined circular boundary',
    contentType: 'code',
    timestamp: Date.now() - 1000 * 60 * 3,
    previewTitle: 'TypeScript Snippet',
  },
  {
    id: 'c2',
    content: 'https://tauri.app/v1/guides/architecture',
    contentType: 'link',
    timestamp: Date.now() - 1000 * 60 * 18,
    previewTitle: 'Tauri Documentation',
  },
  {
    id: 'c3',
    content: '#38bdf8',
    contentType: 'color',
    timestamp: Date.now() - 1000 * 60 * 45,
    previewTitle: 'Sky-400 Hex Accent',
  },
  {
    id: 'c4',
    content: 'Design note: Maintain zero pill discipline and pure human tactile craftsmanship.',
    contentType: 'text',
    timestamp: Date.now() - 1000 * 60 * 120,
    previewTitle: 'Architectural Note',
  },
];

export const initialStashItems: StashItem[] = [
  {
    id: 's1',
    name: 'blueprint_cad_v2.dwg',
    size: '4.8 MB',
    fileType: 'dwg',
    timestamp: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 's2',
    name: 'palette_tokens.json',
    size: '12 KB',
    fileType: 'json',
    timestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: 's3',
    name: 'render_preview.png',
    size: '1.2 MB',
    fileType: 'image',
    timestamp: Date.now() - 1000 * 60 * 2,
  },
];
