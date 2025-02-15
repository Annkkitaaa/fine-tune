import React from 'react';
import { clsx } from 'clsx';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  showValue?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  showValue = true,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        {showValue && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {value}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={clsx(
          'w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer',
          'range-slider',
          className
        )}
        {...props}
      />
      <style jsx>{`
        .range-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #3B82F6;
          border-radius: 50%;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .range-slider::-webkit-slider-thumb:hover {
          background: #2563EB;
        }
        .range-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #3B82F6;
          border-radius: 50%;
          cursor: pointer;
          transition: background-color 0.2s;
          border: none;
        }
        .range-slider::-moz-range-thumb:hover {
          background: #2563EB;
        }
      `}</style>
    </div>
  );
};