// src/components/MetricsVisualization.tsx
import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MetricsVisualizationProps {
  type: 'line' | 'bar';
  data: any[];
  title?: string;
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
}

export const MetricsVisualization: React.FC<MetricsVisualizationProps> = ({
  type,
  data,
  title,
  xKey,
  yKey,
  height = 300,
  color = '#3b82f6',
}) => {
  // Return empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-md">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Custom tooltip component to show value details
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-sm">
            <span className="font-medium text-blue-500">{`${payload[0].value.toFixed(2)}`}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {type === 'line' ? (
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fill: '#9ca3af' }} 
              axisLine={{ stroke: '#4b5563' }} 
            />
            <YAxis 
              tick={{ fill: '#9ca3af' }} 
              axisLine={{ stroke: '#4b5563' }} 
              domain={['auto', 'auto']} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke={color} 
              strokeWidth={2} 
              dot={{ r: 4, fill: color, strokeWidth: 2 }} 
              activeDot={{ r: 6, fill: color }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fill: '#9ca3af' }} 
              axisLine={{ stroke: '#4b5563' }} 
            />
            <YAxis 
              tick={{ fill: '#9ca3af' }} 
              axisLine={{ stroke: '#4b5563' }} 
              domain={['auto', 'auto']} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={yKey} 
              fill={color} 
              barSize={30} 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default MetricsVisualization;