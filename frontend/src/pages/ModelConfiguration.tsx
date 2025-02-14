import React from 'react';

export function ModelConfiguration() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Model Configuration</h1>
        <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
          Create New Model
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Framework Selection</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border border-dark-200 dark:border-dark-700 rounded-lg hover:border-primary-500 cursor-pointer">
              <div className="w-4 h-4 rounded-full border-2 border-primary-500">
                <div className="w-2 h-2 m-0.5 rounded-full bg-primary-500"></div>
              </div>
              <div>
                <h3 className="font-medium">PyTorch</h3>
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  Latest stable version: 2.2.0
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 border border-dark-200 dark:border-dark-700 rounded-lg hover:border-primary-500 cursor-pointer">
              <div className="w-4 h-4 rounded-full border-2 border-dark-300">
                <div className="w-2 h-2 m-0.5 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-medium">TensorFlow</h3>
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  Latest stable version: 2.15.0
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Hyperparameters</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Learning Rate
              </label>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full"
                defaultValue="50"
              />
              <div className="flex justify-between text-sm text-dark-500">
                <span>0.0001</span>
                <span>0.1</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Batch Size
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800"
                placeholder="32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Epochs
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800"
                placeholder="100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}