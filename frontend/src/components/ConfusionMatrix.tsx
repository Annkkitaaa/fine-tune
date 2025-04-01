// src/components/ConfusionMatrix.tsx
import React from 'react';

interface ConfusionMatrixProps {
  matrix: any; // Can be array of arrays or object with matrix and labels
  colorScheme?: 'blue' | 'green' | 'red' | 'purple';
  title?: string;
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({
  matrix,
  colorScheme = 'blue',
  title = 'Confusion Matrix'
}) => {
  // Handle different matrix formats
  const matrixData = Array.isArray(matrix) ? matrix : matrix?.matrix || [];
  const matrixLabels = Array.isArray(matrix) 
    ? Array.from({ length: matrixData.length }, (_, i) => `Class ${i}`) 
    : matrix?.labels || [];

  // If matrix is not provided or empty
  if (!matrixData || !matrixData.length) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-md">
        <p className="text-gray-500 dark:text-gray-400">No confusion matrix data available</p>
      </div>
    );
  }

  // Calculate the total number of predictions for normalization
  const totalPredictions = matrixData.reduce(
    (sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell, 0),
    0
  );

  // Function to determine cell color based on value and position
  const getCellColor = (value: number, row: number, col: number) => {
    const colorSchemes = {
      blue: {
        diagonal: (intensity: number) => `rgba(59, 130, 246, ${0.2 + intensity * 0.7})`,
        offDiagonal: (intensity: number) => `rgba(239, 68, 68, ${0.1 + intensity * 0.4})`
      },
      green: {
        diagonal: (intensity: number) => `rgba(34, 197, 94, ${0.2 + intensity * 0.7})`,
        offDiagonal: (intensity: number) => `rgba(239, 68, 68, ${0.1 + intensity * 0.4})`
      },
      red: {
        diagonal: (intensity: number) => `rgba(239, 68, 68, ${0.2 + intensity * 0.7})`,
        offDiagonal: (intensity: number) => `rgba(59, 130, 246, ${0.1 + intensity * 0.4})`
      },
      purple: {
        diagonal: (intensity: number) => `rgba(168, 85, 247, ${0.2 + intensity * 0.7})`,
        offDiagonal: (intensity: number) => `rgba(249, 115, 22, ${0.1 + intensity * 0.4})`
      }
    };

    const scheme = colorSchemes[colorScheme];
    const denominator = totalPredictions / matrixLabels.length;
    const intensity = Math.min(1, value / (denominator === 0 ? 1 : denominator));
    
    // Diagonal cells (true positives/negatives) get primary color
    if (row === col) {
      return scheme.diagonal(intensity);
    } 
    // Off-diagonal cells (errors) get secondary color
    else {
      return scheme.offDiagonal(intensity);
    }
  };

  // Function to get a human-readable label for a cell
  const getCellLabel = (row: number, col: number): string => {
    // For 2x2 matrix
    if (matrixData.length === 2) {
      if (row === 0 && col === 0) return 'True Negative';
      if (row === 0 && col === 1) return 'False Positive';
      if (row === 1 && col === 0) return 'False Negative';
      if (row === 1 && col === 1) return 'True Positive';
    }
    
    // For larger matrices
    if (row === col) {
      return `True ${matrixLabels[row]}`;
    } else {
      return `Predicted ${matrixLabels[col]}, Actual ${matrixLabels[row]}`;
    }
  };

  // Get color for legend based on chosen scheme
  const getDiagonalColor = (opacity: number = 0.7) => {
    const schemes = {
      blue: `rgba(59, 130, 246, ${opacity})`,
      green: `rgba(34, 197, 94, ${opacity})`,
      red: `rgba(239, 68, 68, ${opacity})`,
      purple: `rgba(168, 85, 247, ${opacity})`
    };
    return schemes[colorScheme];
  };

  const getOffDiagonalColor = (opacity: number = 0.4) => {
    const schemes = {
      blue: `rgba(239, 68, 68, ${opacity})`,
      green: `rgba(239, 68, 68, ${opacity})`,
      red: `rgba(59, 130, 246, ${opacity})`,
      purple: `rgba(249, 115, 22, ${opacity})`
    };
    return schemes[colorScheme];
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actual ↓ Predicted →
                  </th>
                  {matrixLabels.map((label, i) => (
                    <th 
                      key={`col-${i}`} 
                      scope="col" 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {matrixData.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {/* Row header */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {matrixLabels[rowIndex]}
                    </td>
                    
                    {/* Cells */}
                    {row.map((cell, colIndex) => (
                      <td
                        key={`cell-${rowIndex}-${colIndex}`}
                        className="px-6 py-4 whitespace-nowrap text-center"
                        style={{ backgroundColor: getCellColor(cell, rowIndex, colIndex) }}
                        title={getCellLabel(rowIndex, colIndex)}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">{cell}</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {totalPredictions > 0 
                              ? `${((cell / totalPredictions) * 100).toFixed(1)}%` 
                              : '0%'}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center">
          <div 
            className="w-4 h-4 mr-2 rounded-sm"
            style={{ backgroundColor: getDiagonalColor() }}
          ></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Correct predictions</span>
        </div>
        <div className="flex items-center">
          <div 
            className="w-4 h-4 mr-2 rounded-sm"
            style={{ backgroundColor: getOffDiagonalColor() }}
          ></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Incorrect predictions</span>
        </div>
      </div>

      {/* Metrics for 2x2 Matrix */}
      {matrixData.length === 2 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Accuracy:</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {((matrixData[0][0] + matrixData[1][1]) / totalPredictions).toFixed(4)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Precision:</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {(matrixData[1][1] / (matrixData[1][1] + matrixData[0][1] || 1)).toFixed(4)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Recall:</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {(matrixData[1][1] / (matrixData[1][1] + matrixData[1][0] || 1)).toFixed(4)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">F1 Score:</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {(() => {
                const precision = matrixData[1][1] / (matrixData[1][1] + matrixData[0][1] || 1);
                const recall = matrixData[1][1] / (matrixData[1][1] + matrixData[1][0] || 1);
                return ((2 * precision * recall) / (precision + recall || 1)).toFixed(4);
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfusionMatrix;