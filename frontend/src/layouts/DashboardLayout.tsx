import { Outlet } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-primary-light dark:bg-primary-dark">
      <header className="border-b border-secondary-light/20 bg-white/80 backdrop-blur-sm dark:border-secondary-dark/20 dark:bg-primary-dark/80">
        <div className="flex h-16 items-center justify-between px-4">
          <Logo />
          <ThemeToggle />
        </div>
      </header>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}