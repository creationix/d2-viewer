import { useRef, useEffect } from 'react';
import type { D2ChunkData } from '@/types/d2';

interface LiveD2SourceViewerProps {
  currentChunk: D2ChunkData | null;
  selectedLine: number | null;
  hoveredLine: number | null;
  onCopyChunk?: () => void;
}

export function LiveD2SourceViewer({
  currentChunk,
  selectedLine,
  hoveredLine,
  onCopyChunk
}: LiveD2SourceViewerProps) {
  const codeViewerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected line
  useEffect(() => {
    if (selectedLine && codeViewerRef.current) {
      const lineElement = codeViewerRef.current.querySelector(
        `[data-line="${selectedLine}"]`
      );
      if (lineElement) {
        lineElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [selectedLine]);

  const getLineHighlight = (lineNumber: number) => {
    if (selectedLine === lineNumber) {
      return 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500';
    }
    if (hoveredLine === lineNumber) {
      return 'bg-gray-100 dark:bg-gray-700/50';
    }
    return 'hover:bg-gray-50 dark:hover:bg-gray-800/30';
  };

  const renderSyntaxHighlightedLine = (content: string) => {
    try {
      // Parse the JSON line to apply syntax highlighting
      const parsed = JSON.parse(content);
      return renderJsonValue(parsed);
    } catch {
      // If it's not valid JSON, render as plain text
      return <span className="text-gray-600 dark:text-gray-400">{content}</span>;
    }
  };

  const renderJsonValue = (value: unknown): React.ReactNode => {
    if (value === null) {
      return <span className="text-gray-500 dark:text-gray-400">null</span>;
    }
    
    if (typeof value === 'string') {
      return <span className="text-green-600 dark:text-green-400">"{value}"</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className="text-orange-600 dark:text-orange-400">{String(value)}</span>;
    }
    
    if (Array.isArray(value)) {
      return (
        <span>
          <span className="text-gray-600 dark:text-gray-300">[</span>
          {value.map((item, index) => (
            <span key={`array-item-${index}-${String(item).slice(0, 10)}`}>
              {renderJsonValue(item)}
              {index < value.length - 1 && <span className="text-gray-600 dark:text-gray-300">, </span>}
            </span>
          ))}
          <span className="text-gray-600 dark:text-gray-300">]</span>
        </span>
      );
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      return (
        <span>
          <span className="text-gray-600 dark:text-gray-300">{'{'}</span>
          {entries.map(([key, val], index) => (
            <span key={key}>
              <span className="text-purple-600 dark:text-purple-400">"{key}"</span>
              <span className="text-gray-600 dark:text-gray-300">: </span>
              {renderJsonValue(val)}
              {index < entries.length - 1 && <span className="text-gray-600 dark:text-gray-300">, </span>}
            </span>
          ))}
          <span className="text-gray-600 dark:text-gray-300">{'}'}</span>
        </span>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-4 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Live D2 Source Viewer
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {currentChunk ? `Source: ${currentChunk.chunkName}` : 'No chunk loaded'}
          </p>
        </div>
        {onCopyChunk && currentChunk && (
          <button
            type="button"
            onClick={onCopyChunk}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Copy Chunk
          </button>
        )}
      </div>

      {/* Source Code Viewer */}
      <div className="flex-1 overflow-hidden">
        {currentChunk ? (
          <div 
            ref={codeViewerRef}
            className="h-full overflow-auto font-mono text-sm bg-white dark:bg-gray-800"
          >
            <div className="min-h-full">
              {currentChunk.lines.map((line) => (
                <div
                  key={line.lineNumber}
                  data-line={line.lineNumber}
                  className={`flex transition-colors duration-150 ${getLineHighlight(line.lineNumber)}`}
                >
                  {/* Line Number */}
                  <div className="flex-shrink-0 w-16 px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 select-none">
                    {line.lineNumber}
                  </div>
                  
                  {/* Line Content */}
                  <div className="flex-1 px-3 py-1 overflow-x-auto">
                    {renderSyntaxHighlightedLine(line.content)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-2xl mb-2">📄</div>
              <p className="text-sm">
                No D2 chunk loaded
              </p>
              <p className="text-xs mt-1">
                Click on values in the JSON tree to view their source
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {currentChunk && (
        <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-4 py-2">
          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
            <span>
              Lines {currentChunk.startLine}-{currentChunk.endLine}
            </span>
            <span>
              {currentChunk.lines.length} lines in chunk
            </span>
          </div>
        </div>
      )}
    </div>
  );
}