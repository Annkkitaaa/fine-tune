import React from 'react';

export function DatasetManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dataset Management</h1>
        <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
          Upload Dataset
        </button>
      </div>
      
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Your Datasets</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 border border-dark-200 dark:border-dark-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Dataset {i}</h3>
                    <p className="text-sm text-dark-500 dark:text-dark-400">
                      CSV • 2.3GB • Updated 2 days ago
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600 rounded-lg transition-colors">
                      Preview
                    </button>
                    <button className="px-3 py-1 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
                      Use
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}