import React from 'react';

export function Evaluation() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Model Evaluation</h1>
        <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
          Export Results
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-lg bg-white dark:bg-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Accuracy</h3>
          <p className="text-3xl font-bold text-primary-500">87.5%</p>
        </div>
        <div className="p-6 rounded-lg bg-white dark:bg-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Precision</h3>
          <p className="text-3xl font-bold text-secondary-500">85.2%</p>
        </div>
        <div className="p-6 rounded-lg bg-white dark:bg-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Recall</h3>
          <p className="text-3xl font-bold text-accent-500">83.7%</p>
        </div>
        <div className="p-6 rounded-lg bg-white dark:bg-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">F1 Score</h3>
          <p className="text-3xl font-bold text-primary-500">84.4%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Confusion Matrix</h2>
          <div className="aspect-square bg-dark-100 dark:bg-dark-700 rounded-lg p-4">
            {/* Placeholder for confusion matrix visualization */}
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-dark-500">Confusion Matrix Visualization</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">ROC Curve</h2>
          <div className="aspect-square bg-dark-100 dark:bg-dark-700 rounded-lg p-4">
            {/* Placeholder for ROC curve visualization */}
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-dark-500">ROC Curve Visualization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}