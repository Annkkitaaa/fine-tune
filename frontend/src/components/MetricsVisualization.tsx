// src/components/MetricsVisualization.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MetricsVisualizationProps {
  type: 'line';
  data: any[];
  title: string;
  xKey: string;
  yKey: string;
  height?: number;
}

export const MetricsVisualization: React.FC<MetricsVisualizationProps> = ({
  type,
  data,
  title,
  xKey,
  yKey,
  height = 300,
}) => {
  if (type === 'line') {
    return (
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey={xKey}
              className="text-gray-600 dark:text-gray-400"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              className="text-gray-600 dark:text-gray-400"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(var(--background))',
                border: '1px solid rgb(var(--border))',
                borderRadius: '0.5rem',
              }}
              labelStyle={{
                color: 'rgb(var(--foreground))',
              }}
            />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke="rgb(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
};

export default MetricsVisualization;