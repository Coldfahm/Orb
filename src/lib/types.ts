export type ActiveMode =
  | 'home'
  | 'controls'
  | 'apps'
  | 'media'
  | 'ai'
  | 'system'
  | 'timers'
  | 'zen'
  | 'clipboard';

export interface MouseCoords {
  x: number;
  y: number;
}

export interface SystemStats {
  cpuPercent: number;
  ramUsedMb: number;
  ramTotalMb: number;
  ramPercent: number;
  netRxKbps: number;
  netTxKbps: number;
}

export interface ClipboardItem {
  id: string;
  content: string;
  contentType: 'text' | 'code' | 'link' | 'color';
  timestamp: number;
  previewTitle?: string;
}

export interface StashItem {
  id: string;
  name: string;
  size: string;
  fileType: string;
  timestamp: number;
  path?: string;
  content?: string;
}

export interface RadialTool {
  id: string;
  label: string;
  iconName: string;
  color?: string;
  action: () => void;
  badge?: string;
  timeDisplay?: string;
  isScrollable?: boolean;
  value?: number; // 0 to 100 percentage
  onScroll?: (delta: number) => void;
  isActive?: boolean;
}

export interface LyricLine {
  time: number;
  text: string;
}
