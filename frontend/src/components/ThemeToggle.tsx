import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../stores/useThemeStore';
import { cn } from '../lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-lg transition-colors hover:bg-dark-100 dark:hover:bg-dark-800',
        className
      )}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}