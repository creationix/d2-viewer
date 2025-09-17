// D2 Browser Type Definitions

export interface GlobalStats {
  logicalSize: string;
  d2ManifestSize: string;
  chunksLoaded: number;
  totalChunks: number;
  dataTransferred: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  type: "loading" | "success" | "error";
  chunkName: string;
  size?: string;
  message: string;
}

export type D2ValueType =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "object"
  | "array"
  | "d2-pointer";

export interface D2Pointer {
  type: "d2-pointer";
  value: number;
  isLoading?: boolean;
  isLoaded?: boolean;
}

export interface D2SourceLine {
  lineNumber: number;
  content: string;
  chunkName: string;
  isHighlighted?: boolean;
  highlightType?: "selected" | "hover";
}

export interface D2ChunkData {
  chunkName: string;
  lines: D2SourceLine[];
  startLine: number;
  endLine: number;
}

export interface SelectedValue {
  type: D2ValueType;
  value: unknown;
  size?: string;
  path: string[];
  sourceLine?: number;
  sourceChunk?: string;
}

export interface D2TreeNode {
  key?: string;
  value: unknown;
  type: D2ValueType;
  isExpanded?: boolean;
  children?: D2TreeNode[];
  level: number;
  isLast?: boolean;
  path: string[];
  sourceLine?: number;
  sourceChunk?: string;
}

export interface D2SourceViewerState {
  currentChunk: D2ChunkData | null;
  selectedLine: number | null;
  hoveredLine: number | null;
}

export interface D2BrowserState {
  stats: GlobalStats;
  activityLog: ActivityLogEntry[];
  selectedValue: SelectedValue | null;
  treeData: Record<string, unknown>;
  expandedNodes: Set<string>;
  loadingPointers: Set<number>;
  sourceViewer: D2SourceViewerState;
  loadedChunks: Map<string, D2ChunkData>;
}
