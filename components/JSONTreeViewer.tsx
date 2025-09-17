import { useMemo } from 'react';
import type { SelectedValue, D2TreeNode, D2ValueType } from '@/types/d2';

interface JSONTreeViewerProps {
  data: Record<string, unknown>;
  expandedNodes: Set<string>;
  loadingPointers: Set<number>;
  onValueSelect: (value: SelectedValue) => void;
  onToggleExpand: (nodePath: string) => void;
  onD2PointerClick: (pointerId: number, path: string[]) => void;
}

export function JSONTreeViewer({
  data,
  expandedNodes,
  loadingPointers,
  onValueSelect,
  onToggleExpand,
  onD2PointerClick
}: JSONTreeViewerProps) {
  const treeNodes = useMemo(() => buildTreeNodes(data, expandedNodes), [data, expandedNodes]);

  return (
    <div className="h-full overflow-auto p-4 font-mono text-sm bg-white dark:bg-gray-800">
      <div className="space-y-1">
        {treeNodes.map((node, index) => (
          <TreeNode
            key={`${node.path.join('.')}-${index}`}
            node={node}
            expandedNodes={expandedNodes}
            loadingPointers={loadingPointers}
            onValueSelect={onValueSelect}
            onToggleExpand={onToggleExpand}
            onD2PointerClick={onD2PointerClick}
          />
        ))}
      </div>
    </div>
  );
}

function buildTreeNodes(
  data: Record<string, unknown>,
  expandedNodes: Set<string>,
  level = 0
): D2TreeNode[] {
  const nodes: D2TreeNode[] = [];

  if (level === 0) {
    // Root object
    const rootPath = 'root';
    const isExpanded = expandedNodes.has(rootPath);
    
    nodes.push({
      key: undefined,
      value: data,
      type: 'object',
      isExpanded,
      level: 0,
      path: [],
      children: isExpanded ? buildObjectChildren(data, expandedNodes, level + 1, []) : undefined
    });
  }

  return nodes;
}

function buildObjectChildren(
  obj: Record<string, unknown>,
  expandedNodes: Set<string>,
  level: number,
  path: string[]
): D2TreeNode[] {
  const entries = Object.entries(obj);
  
  return entries.map(([key, value], index) => {
    const currentPath = [...path, key];
    const pathKey = currentPath.join('.');
    const type = getValueType(value);
    const isLast = index === entries.length - 1;
    const isExpanded = expandedNodes.has(pathKey);

    let children: D2TreeNode[] | undefined;
    
    if (isExpanded) {
      if (type === 'object' && value && typeof value === 'object') {
        children = buildObjectChildren(value as Record<string, unknown>, expandedNodes, level + 1, currentPath);
      } else if (type === 'array' && Array.isArray(value)) {
        children = buildArrayChildren(value, expandedNodes, level + 1, currentPath);
      }
    }

    return {
      key,
      value,
      type,
      isExpanded,
      level,
      isLast,
      path: currentPath,
      children
    };
  });
}

function buildArrayChildren(
  arr: unknown[],
  expandedNodes: Set<string>,
  level: number,
  path: string[]
): D2TreeNode[] {
  return arr.map((value, index) => {
    const currentPath = [...path, index.toString()];
    const pathKey = currentPath.join('.');
    const type = getValueType(value);
    const isLast = index === arr.length - 1;
    const isExpanded = expandedNodes.has(pathKey);

    let children: D2TreeNode[] | undefined;
    
    if (isExpanded) {
      if (type === 'object' && value && typeof value === 'object') {
        children = buildObjectChildren(value as Record<string, unknown>, expandedNodes, level + 1, currentPath);
      } else if (type === 'array' && Array.isArray(value)) {
        children = buildArrayChildren(value, expandedNodes, level + 1, currentPath);
      }
    }

    return {
      key: index.toString(),
      value,
      type,
      isExpanded,
      level,
      isLast,
      path: currentPath,
      children
    };
  });
}

function getValueType(value: unknown): D2ValueType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') {
    // Check if it's a D2 pointer (for demo purposes, assume numbers > 10000 are pointers)
    return value > 10000 ? 'd2-pointer' : 'number';
  }
  return 'string';
}

interface TreeNodeProps {
  node: D2TreeNode;
  expandedNodes: Set<string>;
  loadingPointers: Set<number>;
  onValueSelect: (value: SelectedValue) => void;
  onToggleExpand: (nodePath: string) => void;
  onD2PointerClick: (pointerId: number, path: string[]) => void;
}

function TreeNode({
  node,
  expandedNodes,
  loadingPointers,
  onValueSelect,
  onToggleExpand,
  onD2PointerClick
}: TreeNodeProps) {
  const pathKey = node.path.join('.');
  const indentLevel = node.level;
  
  const handleClick = () => {
    if (node.type === 'object' || node.type === 'array') {
      onToggleExpand(pathKey);
    } else if (node.type === 'd2-pointer' && typeof node.value === 'number') {
      if (!loadingPointers.has(node.value)) {
        onD2PointerClick(node.value, node.path);
      }
    } else {
      // Select primitive value
      onValueSelect({
        type: node.type,
        value: node.value,
        size: getValueSize(node.value),
        path: node.path
      });
    }
  };

  const renderIndentation = () => {
    const elements = [];
    for (let i = 0; i < indentLevel; i++) {
      elements.push(
        <div
          key={i}
          className="w-4 flex justify-center"
        >
          <div className="w-px bg-gray-300 dark:bg-gray-600 h-full" />
        </div>
      );
    }
    return elements;
  };

  const renderToggleIcon = () => {
    if (node.type !== 'object' && node.type !== 'array') {
      return <div className="w-4" />;
    }
    
    return (
      <button
        type="button"
        onClick={handleClick}
        className="w-4 h-4 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        {node.isExpanded ? '▾' : '▸'}
      </button>
    );
  };

  const renderKey = () => {
    if (!node.key) return null;
    
    return (
      <span className="text-purple-600 dark:text-purple-400">
        "{node.key}":
      </span>
    );
  };

  const renderValue = () => {
    if (node.type === 'd2-pointer' && typeof node.value === 'number') {
      if (loadingPointers.has(node.value)) {
        return (
          <span className="text-blue-600 dark:text-blue-400">
            <span className="inline-block w-3 h-3 border border-blue-400 border-t-blue-600 rounded-full animate-spin mr-1" />
            Loading...
          </span>
        );
      }
      
      return (
        <button
          type="button"
          onClick={handleClick}
          className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
        >
          {node.value} 🔗
        </button>
      );
    }

    if (node.type === 'object') {
      const count = Object.keys(node.value as Record<string, unknown>).length;
      return (
        <button
          type="button"
          onClick={handleClick}
          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1"
        >
          {node.isExpanded ? '{' : `{...} (${count} properties)`}
        </button>
      );
    }

    if (node.type === 'array') {
      const count = (node.value as unknown[]).length;
      return (
        <button
          type="button"
          onClick={handleClick}
          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1"
        >
          {node.isExpanded ? '[' : `[${count}]`}
        </button>
      );
    }

    if (node.type === 'string') {
      return (
        <button
          type="button"
          onClick={handleClick}
          className="text-green-600 dark:text-green-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1"
        >
          "{String(node.value)}"
        </button>
      );
    }

    if (node.type === 'number') {
      return (
        <button
          type="button"
          onClick={handleClick}
          className="text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1"
        >
          {String(node.value)}
        </button>
      );
    }

    if (node.type === 'boolean') {
      return (
        <button
          type="button"
          onClick={handleClick}
          className="text-orange-600 dark:text-orange-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1"
        >
          {String(node.value)}
        </button>
      );
    }

    if (node.type === 'null') {
      return (
        <button
          type="button"
          onClick={handleClick}
          className="text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1"
        >
          null
        </button>
      );
    }

    return null;
  };

  return (
    <>
      <div className="flex items-center text-sm leading-5 hover:bg-gray-50 dark:hover:bg-gray-700 py-0.5">
        <div className="flex">
          {renderIndentation()}
          {renderToggleIcon()}
        </div>
        <div className="flex items-center space-x-1 ml-1">
          {renderKey()}
          <span>{renderValue()}</span>
        </div>
      </div>
      
      {node.isExpanded && node.children && (
        <>
          {node.children.map((child, index) => (
            <TreeNode
              key={`${child.path.join('.')}-${index}`}
              node={child}
              expandedNodes={expandedNodes}
              loadingPointers={loadingPointers}
              onValueSelect={onValueSelect}
              onToggleExpand={onToggleExpand}
              onD2PointerClick={onD2PointerClick}
            />
          ))}
          {node.type === 'object' && (
            <div className="flex items-center text-sm leading-5">
              <div className="flex">
                {renderIndentation()}
                <div className="w-4" />
              </div>
              <div className="ml-1">{'}'}</div>
            </div>
          )}
          {node.type === 'array' && (
            <div className="flex items-center text-sm leading-5">
              <div className="flex">
                {renderIndentation()}
                <div className="w-4" />
              </div>
              <div className="ml-1">{']'}</div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function getValueSize(value: unknown): string {
  if (typeof value === 'string') {
    return `${value.length} characters`;
  }
  return `${JSON.stringify(value).length} characters`;
}