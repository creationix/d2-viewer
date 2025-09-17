import type { GlobalStats, ActivityLogEntry } from '@/types/d2';

interface SidebarProps {
  stats: GlobalStats;
  activityLog: ActivityLogEntry[];
  onReset: () => void;
  onClearLog: () => void;
}

export function Sidebar({ stats, activityLog, onReset, onClearLog }: SidebarProps) {
  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Global Stats Card */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          📊 Performance Metrics
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Logical Size:</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
              {stats.logicalSize}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">D2 Manifest Size:</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
              {stats.d2ManifestSize}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Chunks Loaded:</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
              {stats.chunksLoaded} / {stats.totalChunks.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Data Transferred:</span>
            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
              {stats.dataTransferred}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Log Card */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            📡 Activity Log
          </h3>
          <button
            type="button"
            onClick={onClearLog}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Clear Log
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {activityLog.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No activity yet. Click on a D2 pointer to start loading chunks.
            </p>
          ) : (
            <div className="space-y-2">
              {activityLog.map((entry) => (
                <ActivityLogItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls Card */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          ⚙️ Controls
        </h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onReset}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Reset Demo
          </button>
          <a
            href="https://github.com/yourusername/d2-browser"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-3 py-2 text-sm text-center bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

interface ActivityLogItemProps {
  entry: ActivityLogEntry;
}

function ActivityLogItem({ entry }: ActivityLogItemProps) {
  const getIcon = () => {
    switch (entry.type) {
      case 'loading':
        return (
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        );
      case 'success':
        return <span className="text-green-600 dark:text-green-400">✓</span>;
      case 'error':
        return <span className="text-red-600 dark:text-red-400">✗</span>;
      default:
        return null;
    }
  };

  const getTextColor = () => {
    switch (entry.type) {
      case 'loading':
        return 'text-blue-600 dark:text-blue-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="flex items-start space-x-2">
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-mono ${getTextColor()}`}>
          {entry.message}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {entry.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}