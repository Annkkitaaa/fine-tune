import React from 'react';

export function Training() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Training</h1>
        <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
          Start New Training
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Training Progress</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Progress</span>
                  <span>45%</span>
                </div>
                <div className="h-2 bg-dark-200 dark:bg-dark-700 rounded-full">
                  <div className="h-full w-[45%] bg-primary-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-dark-100 dark:bg-dark-700 rounded-lg">
                  <h3 className="text-sm font-medium mb-1">Loss</h3>
                  <p className="text-2xl font-bold">0.342</p>
                </div>
                <div className="p-4 bg-dark-100 dark:bg-dark-700 rounded-lg">
                  <h3 className="text-sm font-medium mb-1">Accuracy</h3>
                  <p className="text-2xl font-bold">87.5%</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Training Log</h3>
                <div className="bg-dark-100 dark:bg-dark-700 rounded-lg p-4 h-48 overflow-auto font-mono text-sm">
                  <p>Epoch 45/100</p>
                  <p>Loss: 0.342 - Accuracy: 0.875</p>
                  <p>Val Loss: 0.356 - Val Accuracy: 0.862</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Resource Usage</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>GPU Memory</span>
                  <span>78%</span>
                </div>
                <div className="h-2 bg-dark-200 dark:bg-dark-700 rounded-full">
                  <div className="h-full w-[78%] bg-primary-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>CPU Usage</span>
                  <span>45%</span>
                </div>
                <div className="h-2 bg-dark-200 dark:bg-dark-700 rounded-full">
                  <div className="h-full w-[45%] bg-secondary-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>RAM Usage</span>
                  <span>62%</span>
                </div>
                <div className="h-2 bg-dark-200 dark:bg-dark-700 rounded-full">
                  <div className="h-full w-[62%] bg-accent-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}