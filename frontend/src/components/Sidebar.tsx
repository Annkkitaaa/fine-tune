import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { LayoutDashboard, Database, Settings, Brain, BarChart as ChartBar } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Datasets', href: '/datasets', icon: Database },
  { name: 'Models', href: '/models', icon: Settings },
  { name: 'Training', href: '/training', icon: Brain },
  { name: 'Evaluation', href: '/evaluation', icon: ChartBar },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800">
      <div className="h-16 flex items-center px-6 border-b border-dark-200 dark:border-dark-700">
        <span className="text-xl font-bold">MLFine</span>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                    location.pathname === item.href
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-dark-100 dark:hover:bg-dark-700'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}