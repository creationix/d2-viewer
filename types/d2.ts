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

export interface SelectedValue {
  type: D2ValueType;
  value: unknown;
  size?: string;
  path: string[];
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
}

export interface D2BrowserState {
  stats: GlobalStats;
  activityLog: ActivityLogEntry[];
  selectedValue: SelectedValue | null;
  treeData: Record<string, unknown>;
  expandedNodes: Set<string>;
  loadingPointers: Set<number>;
}
