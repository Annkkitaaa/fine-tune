import React from 'react';
import { clsx } from 'clsx';

interface SwitchProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  checked,
  onChange,
  className,
}) => {
  return (
    <label className={clsx('flex items-center cursor-pointer', className)}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={clsx(
            'block w-10 h-6 rounded-full transition-colors',
            checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          )}
        />
        <div
          className={clsx(
            'absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform',
            checked ? 'transform translate-x-4' : ''
          )}
        />
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
};