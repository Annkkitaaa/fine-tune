import React from 'react';

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-lg bg-white dark:bg-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Active Models</h3>
          <p className="text-3xl font-bold text-primary-500">12</p>
        </div>
        <div className="p-6 rounded-lg bg-white dark:bg-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Datasets</h3>
          <p className="text-3xl font-bold text-secondary-500">34</p>
        </div>
        <div className="p-6 rounded-lg bg-white dark:bg-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Training Jobs</h3>
          <p className="text-3xl font-bold text-accent-500">3</p>
        </div>
        <div className="p-6 rounded-lg bg-white dark:bg-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">GPU Usage</h3>
          <p className="text-3xl font-bold text-primary-500">78%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg bg-white dark:bg-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700">
                <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                <div>
                  <p className="font-medium">Model Training Completed</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 rounded-lg bg-white dark:bg-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Resource Monitor</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>CPU Usage</span>
                <span>45%</span>
              </div>
              <div className="h-2 bg-dark-200 dark:bg-dark-700 rounded-full">
                <div className="h-full w-[45%] bg-primary-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span>Memory</span>
                <span>68%</span>
              </div>
              <div className="h-2 bg-dark-200 dark:bg-dark-700 rounded-full">
                <div className="h-full w-[68%] bg-secondary-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span>Storage</span>
                <span>32%</span>
              </div>
              <div className="h-2 bg-dark-200 dark:bg-dark-700 rounded-full">
                <div className="h-full w-[32%] bg-accent-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}