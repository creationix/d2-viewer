'use client';

import { useState, useCallback } from 'react';
import type { D2BrowserState, SelectedValue, ActivityLogEntry, D2ChunkData, D2SourceLine } from '@/types/d2';
import { Sidebar } from '@/components/Sidebar';
import { JSONTreeViewer } from '@/components/JSONTreeViewer';
import { LiveD2SourceViewer } from '@/components/LiveD2SourceViewer';

// Mock initial data for demonstration
const initialData = {
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "profile": 12345, // This will be a D2 pointer
    "settings": {
      "theme": "dark",
      "notifications": true,
      "language": "en",
      "timezone": "America/New_York",
      "categories": 67890, // Another D2 pointer
    },
    "preferences": {
      "newsletter": false,
      "analytics": true
    }
  },
  "application": {
    "version": "2.1.4",
    "build": "20250916",
    "features": ["lazy-loading", "chunked-data", "compression"],
    "config": {
      "maxChunkSize": "2MB",
      "compressionLevel": 9,
      "cacheTimeout": 3600
    }
  },
  "metadata": {
    "created": "2025-09-16T10:00:00Z",
    "lastModified": "2025-09-16T15:30:00Z",
    "items": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "statistics": {
      "totalRecords": 1000000,
      "averageSize": "512 bytes",
      "compressionRatio": 0.23
    },
    "references": 99999 // Another D2 pointer
  }
};

const initialStats = {
  logicalSize: "500 MB",
  d2ManifestSize: "14 MB",
  chunksLoaded: 1,
  totalChunks: 1400,
  dataTransferred: "4.2 KB"
};

// Generate mock D2 source chunks
const generateMockChunk = (chunkName: string, startLine: number, data: Record<string, unknown>): D2ChunkData => {
  const lines: D2SourceLine[] = [];
  let currentLine = startLine;
  
  // Convert the data object to individual JSON lines
  const entries = Object.entries(data);
  entries.forEach(([key, value]) => {
    lines.push({
      lineNumber: currentLine,
      content: JSON.stringify({ [key]: value }),
      chunkName
    });
    currentLine++;
  });

  return {
    chunkName,
    lines,
    startLine,
    endLine: currentLine - 1
  };
};

// Create the root chunk
const rootChunk = generateMockChunk('root.d2.jsonl', 1, initialData);

// Mock chunks for D2 pointers
const profileChunk: D2ChunkData = {
  chunkName: '12345.d2.jsonl',
  lines: [
    {
      lineNumber: 12345,
      content: JSON.stringify({
        "bio": "Software developer with 10+ years experience in distributed systems and data compression"
      }),
      chunkName: '12345.d2.jsonl'
    },
    {
      lineNumber: 12346,
      content: JSON.stringify({
        "avatar": "https://example.com/avatars/johndoe.jpg"
      }),
      chunkName: '12345.d2.jsonl'
    },
    {
      lineNumber: 12347,
      content: JSON.stringify({
        "location": "San Francisco, CA"
      }),
      chunkName: '12345.d2.jsonl'
    },
    {
      lineNumber: 12348,
      content: JSON.stringify({
        "social": {
          "twitter": "@johndoe",
          "github": "johndoe",
          "linkedin": "john-doe"
        }
      }),
      chunkName: '12345.d2.jsonl'
    }
  ],
  startLine: 12345,
  endLine: 12348
};

const categoriesChunk: D2ChunkData = {
  chunkName: '67890.d2.jsonl',
  lines: [
    {
      lineNumber: 67890,
      content: JSON.stringify(["Technology", "Science", "Art", "Music"]),
      chunkName: '67890.d2.jsonl'
    },
    {
      lineNumber: 67891,
      content: JSON.stringify(["Travel", "Food", "Photography", "Gaming"]),
      chunkName: '67890.d2.jsonl'
    }
  ],
  startLine: 67890,
  endLine: 67891
};

const referencesChunk: D2ChunkData = {
  chunkName: '99999.d2.jsonl',
  lines: [
    {
      lineNumber: 99999,
      content: JSON.stringify({
        "external_id": "ext_abc123def456",
        "source": "api.example.com/v2"
      }),
      chunkName: '99999.d2.jsonl'
    },
    {
      lineNumber: 100000,
      content: JSON.stringify({
        "endpoints": {
          "users": "/api/v2/users",
          "profiles": "/api/v2/profiles"
        }
      }),
      chunkName: '99999.d2.jsonl'
    }
  ],
  startLine: 99999,
  endLine: 100000
};

export function D2Browser() {
  const [state, setState] = useState<D2BrowserState>({
    stats: initialStats,
    activityLog: [],
    selectedValue: null,
    treeData: initialData,
    expandedNodes: new Set(['root']), // Start with root expanded
    loadingPointers: new Set(),
    sourceViewer: {
      currentChunk: rootChunk,
      selectedLine: 1,
      hoveredLine: null
    },
    loadedChunks: new Map([
      ['root.d2.jsonl', rootChunk],
      ['12345.d2.jsonl', profileChunk],
      ['67890.d2.jsonl', categoriesChunk],
      ['99999.d2.jsonl', referencesChunk]
    ])
  });

  const handleValueSelect = useCallback((selectedValue: SelectedValue) => {
    setState(prev => {
      const newState = {
        ...prev,
        selectedValue
      };

      // Update source viewer if we have source line information
      if (selectedValue.sourceLine && selectedValue.sourceChunk) {
        const chunk = prev.loadedChunks.get(selectedValue.sourceChunk);
        if (chunk) {
          newState.sourceViewer = {
            ...prev.sourceViewer,
            currentChunk: chunk,
            selectedLine: selectedValue.sourceLine
          };
        }
      }

      return newState;
    });
  }, []);

  const handleLineHover = useCallback((lineNumber: number | null) => {
    setState(prev => ({
      ...prev,
      sourceViewer: {
        ...prev.sourceViewer,
        hoveredLine: lineNumber
      }
    }));
  }, []);

  const handleCopyChunk = useCallback(async () => {
    const { currentChunk } = state.sourceViewer;
    if (!currentChunk) return;

    try {
      const chunkContent = currentChunk.lines.map(line => line.content).join('\n');
      await navigator.clipboard.writeText(chunkContent);
    } catch (error) {
      console.error('Failed to copy chunk:', error);
    }
  }, [state.sourceViewer]);

  const handleD2PointerClick = useCallback(async (pointerId: number, path: string[]) => {
    // Add loading state
    setState(prev => ({
      ...prev,
      loadingPointers: new Set([...prev.loadingPointers, pointerId])
    }));

    // Add activity log entry for loading
    const logEntry: ActivityLogEntry = {
      id: `${pointerId}-${Date.now()}`,
      timestamp: new Date(),
      type: 'loading',
      chunkName: `${pointerId}.d2.jsonl`,
      message: `Fetching chunk ${pointerId}.d2.jsonl...`
    };

    setState(prev => ({
      ...prev,
      activityLog: [logEntry, ...prev.activityLog]
    }));

    // Simulate network request
    try {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      
      // Mock response data based on pointer ID
      let mockData: unknown;
      switch (pointerId) {
        case 12345:
          mockData = {
            "bio": "Software developer with 10+ years experience in distributed systems and data compression",
            "avatar": "https://example.com/avatars/johndoe.jpg",
            "location": "San Francisco, CA",
            "joined": "2015-03-20T14:30:00Z",
            "social": {
              "twitter": "@johndoe",
              "github": "johndoe",
              "linkedin": "john-doe",
              "website": "https://johndoe.dev"
            },
            "achievements": ["D2 Format Contributor", "Open Source Advocate", "Tech Speaker"],
            "projects": 42
          };
          break;
        case 67890:
          mockData = [
            "Technology", 
            "Science", 
            "Art", 
            "Music", 
            "Travel", 
            "Food", 
            "Photography", 
            "Gaming", 
            "Books", 
            "Fitness"
          ];
          break;
        case 99999:
          mockData = {
            "external_id": "ext_abc123def456",
            "source": "api.example.com/v2",
            "last_sync": "2025-09-16T09:30:00Z",
            "sync_frequency": "hourly",
            "data_retention": "30 days",
            "endpoints": {
              "users": "/api/v2/users",
              "profiles": "/api/v2/profiles",
              "categories": "/api/v2/categories"
            },
            "rate_limits": {
              "requests_per_minute": 1000,
              "burst_limit": 100
            }
          };
          break;
        default:
          mockData = { 
            "loaded": true, 
            "timestamp": new Date().toISOString(),
            "chunk_id": pointerId,
            "size_bytes": Math.floor(Math.random() * 10000) + 1000
          };
      }

      const size = `${(Math.random() * 5 + 0.5).toFixed(1)} KB`;

      // Update success log entry
      const successEntry: ActivityLogEntry = {
        ...logEntry,
        type: 'success',
        size,
        message: `Loaded chunk ${pointerId}.d2.jsonl (+${size})`
      };

      setState(prev => {
        // Update the tree data at the specified path
        const newTreeData = { ...prev.treeData };
        let current = newTreeData;
        
        // Navigate to the parent object
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]] as Record<string, unknown>;
        }
        
        // Replace the pointer with actual data
        const lastKey = path[path.length - 1];
        current[lastKey] = mockData;

        // Update stats
        const newDataTransferred = parseFloat(prev.stats.dataTransferred.replace(' KB', '')) + parseFloat(size.replace(' KB', ''));

        // Get the corresponding chunk for source viewer
        const chunkName = `${pointerId}.d2.jsonl`;
        const chunk = prev.loadedChunks.get(chunkName);

        return {
          ...prev,
          treeData: newTreeData,
          loadingPointers: new Set([...prev.loadingPointers].filter(id => id !== pointerId)),
          activityLog: [successEntry, ...prev.activityLog.slice(1)],
          stats: {
            ...prev.stats,
            chunksLoaded: prev.stats.chunksLoaded + 1,
            dataTransferred: `${newDataTransferred.toFixed(1)} KB`
          },
          sourceViewer: chunk ? {
            currentChunk: chunk,
            selectedLine: pointerId,
            hoveredLine: null
          } : prev.sourceViewer
        };
      });

    } catch {
      // Handle error
      const errorEntry: ActivityLogEntry = {
        ...logEntry,
        type: 'error',
        message: `Failed to load chunk ${pointerId}.d2.jsonl`
      };

      setState(prev => ({
        ...prev,
        loadingPointers: new Set([...prev.loadingPointers].filter(id => id !== pointerId)),
        activityLog: [errorEntry, ...prev.activityLog.slice(1)]
      }));
    }
  }, []);

  const handleToggleExpand = useCallback((nodePath: string) => {
    setState(prev => {
      const newExpandedNodes = new Set(prev.expandedNodes);
      if (newExpandedNodes.has(nodePath)) {
        newExpandedNodes.delete(nodePath);
      } else {
        newExpandedNodes.add(nodePath);
      }
      return {
        ...prev,
        expandedNodes: newExpandedNodes
      };
    });
  }, []);

  const handleReset = useCallback(() => {
    setState({
      stats: initialStats,
      activityLog: [],
      selectedValue: null,
      treeData: initialData,
      expandedNodes: new Set(['root']), // Start with root expanded
      loadingPointers: new Set(),
      sourceViewer: {
        currentChunk: rootChunk,
        selectedLine: 1,
        hoveredLine: null
      },
      loadedChunks: new Map([
        ['root.d2.jsonl', rootChunk],
        ['12345.d2.jsonl', profileChunk],
        ['67890.d2.jsonl', categoriesChunk],
        ['99999.d2.jsonl', referencesChunk]
      ])
    });
  }, []);

  const handleClearLog = useCallback(() => {
    setState(prev => ({
      ...prev,
      activityLog: []
    }));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              D2 Object Browser Demo
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Interactive demonstration of D2 format efficiency with lazy-loading
            </p>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            Efficiency: {Math.round((parseFloat(state.stats.dataTransferred.replace(' KB', '')) / parseFloat(state.stats.logicalSize.replace(' MB', '')) / 1024) * 10000) / 100}% data loaded
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Sidebar
            stats={state.stats}
            activityLog={state.activityLog}
            onReset={handleReset}
            onClearLog={handleClearLog}
          />
        </div>

        {/* Center Pane - Main View */}
        <div className="flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
          <JSONTreeViewer
            data={state.treeData}
            expandedNodes={state.expandedNodes}
            loadingPointers={state.loadingPointers}
            onValueSelect={handleValueSelect}
            onToggleExpand={handleToggleExpand}
            onD2PointerClick={handleD2PointerClick}
            onLineHover={handleLineHover}
          />
        </div>

        {/* Right Pane - Live D2 Source Viewer */}
        <div className="w-80 bg-white dark:bg-gray-800 flex-shrink-0">
          <LiveD2SourceViewer 
            currentChunk={state.sourceViewer.currentChunk}
            selectedLine={state.sourceViewer.selectedLine}
            hoveredLine={state.sourceViewer.hoveredLine}
            onCopyChunk={handleCopyChunk}
          />
        </div>
      </div>
    </div>
  );
}