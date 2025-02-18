// src/components/layout/Navbar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useThemeStore } from '@/store/theme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { AuthModal } from '@/components/auth/AuthModal';
import { Sun, Moon, Menu, X, BarChart2, Database, Brain, Rocket, GitBranch, LineChart, Home, LogOut } from 'lucide-react';

interface NavbarProps {
  onSignInClick: () => void;
}

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Models', href: '/models', icon: Brain },
    { name: 'Datasets', href: '/datasets', icon: Database },
    { name: 'Training', href: '/training', icon: BarChart2 },
    { name: 'Deployment', href: '/deployment', icon: Rocket },
    { name: 'Pipeline', href: '/pipeline', icon: GitBranch },
    { name: 'Evaluation', href: '/evaluation', icon: LineChart },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-blue-600 dark:text-blue-500">
                  <Home size={24} />
                  <span>ML Platform</span>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        isActive(item.href)
                          ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <Icon size={16} className="mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="hidden sm:flex sm:items-center">
                {isAuthenticated ? (
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={logout}
                    className="flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={() => setIsSignInModalOpen(true)}
                  >
                    Sign In
                  </Button>
                )}
              </div>
              <div className="flex items-center sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}
          style={{ maxHeight: 'calc(100vh - 4rem)', overflowY: 'auto' }}
        >
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-base font-medium ${
                    isActive(item.href)
                      ? 'text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/50'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon size={16} className="mr-2" />
                  {item.name}
                </Link>
              );
            })}
            {!isAuthenticated && (
              <button
                className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSignInModalOpen(true);
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </>
  );
};