'use client';

import { useState, useCallback } from 'react';
import type { D2BrowserState, SelectedValue, ActivityLogEntry } from '@/types/d2';
import { Sidebar } from './Sidebar';
import { JSONTreeViewer } from './JSONTreeViewer';
import { ValueInspector } from './ValueInspector';

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

export function D2Browser() {
  const [state, setState] = useState<D2BrowserState>({
    stats: initialStats,
    activityLog: [],
    selectedValue: null,
    treeData: initialData,
    expandedNodes: new Set(['root']), // Start with root expanded
    loadingPointers: new Set()
  });

  const handleValueSelect = useCallback((selectedValue: SelectedValue) => {
    setState(prev => ({
      ...prev,
      selectedValue
    }));
  }, []);

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

        return {
          ...prev,
          treeData: newTreeData,
          loadingPointers: new Set([...prev.loadingPointers].filter(id => id !== pointerId)),
          activityLog: [successEntry, ...prev.activityLog.slice(1)],
          stats: {
            ...prev.stats,
            chunksLoaded: prev.stats.chunksLoaded + 1,
            dataTransferred: `${newDataTransferred.toFixed(1)} KB`
          }
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
      loadingPointers: new Set()
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
          />
        </div>

        {/* Right Pane - Inspector */}
        <div className="w-80 bg-white dark:bg-gray-800 flex-shrink-0">
          <ValueInspector selectedValue={state.selectedValue} />
        </div>
      </div>
    </div>
  );
}