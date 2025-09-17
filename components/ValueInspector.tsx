import { useState } from 'react';
import type { SelectedValue } from '@/types/d2';

interface ValueInspectorProps {
  selectedValue: SelectedValue | null;
}

export function ValueInspector({ selectedValue }: ValueInspectorProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    if (!selectedValue) return;

    try {
      const textToCopy = typeof selectedValue.value === 'string' 
        ? selectedValue.value 
        : JSON.stringify(selectedValue.value, null, 2);
      
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const renderValue = () => {
    if (!selectedValue) return null;

    const displayValue = typeof selectedValue.value === 'string' 
      ? selectedValue.value 
      : JSON.stringify(selectedValue.value, null, 2);

    return (
      <pre className="whitespace-pre-wrap break-all text-sm font-mono bg-gray-50 dark:bg-gray-700 p-3 rounded border max-h-64 overflow-y-auto">
        {displayValue}
      </pre>
    );
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'string':
        return 'String';
      case 'number':
        return 'Number';
      case 'boolean':
        return 'Boolean';
      case 'null':
        return 'Null';
      case 'object':
        return 'Object';
      case 'array':
        return 'Array';
      case 'd2-pointer':
        return 'D2 Pointer';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="h-full p-4">
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Value Inspector
          </h3>
        </div>
        
        <div className="flex-1 p-4">
          {selectedValue ? (
            <div className="space-y-4">
              {/* Type */}
              <div>
                <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Type:
                </span>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {getTypeDisplayName(selectedValue.type)}
                </div>
              </div>

              {/* Size */}
              {selectedValue.size && (
                <div>
                  <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Size:
                  </span>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedValue.size}
                  </div>
                </div>
              )}

              {/* Path */}
              <div>
                <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Path:
                </span>
                <div className="text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {selectedValue.path.length > 0 ? selectedValue.path.join(' → ') : 'root'}
                </div>
              </div>

              {/* Value */}
              <div>
                <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Value:
                </span>
                {renderValue()}
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                  copySuccess
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="text-2xl mb-2">👆</div>
                <p className="text-sm">
                  Select a value to inspect
                </p>
                <p className="text-xs mt-1">
                  Click on any value in the JSON tree to see its details here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}