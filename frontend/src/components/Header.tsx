import { Bell, User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="h-16 border-b border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Model Fine-Tuning</h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}