import { Outlet } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-primary-light dark:bg-primary-dark">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Logo />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}