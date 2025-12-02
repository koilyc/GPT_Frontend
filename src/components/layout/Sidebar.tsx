import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../store';
import { Button } from '../ui/Button';
import { 
  HomeIcon, 
  FolderIcon, 
  CogIcon,
  LogOutIcon,
  UserIcon,
  BrainIcon
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentWorkspace, currentProject } = useAppStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
    },
    {
      name: 'Workspaces',
      href: '/workspaces',
      icon: FolderIcon,
    },
    {
      name: 'Models',
      href: '/models',
      icon: BrainIcon,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
    },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 dark:bg-gray-950">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-4">
        <h1 className="text-xl font-bold text-white">AI Vision Platform</h1>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 pb-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === '/workspaces' && location.pathname.startsWith('/workspaces'));
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`
                        group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                        ${isActive
                          ? 'bg-gray-800 dark:bg-gray-700 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Current Context */}
          {currentWorkspace && (
            <li>
              <div className="text-xs font-semibold leading-6 text-gray-400">
                Current Context
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-white truncate">
                  📁 {currentWorkspace.name}
                </div>
                {currentProject && (
                  <div className="text-sm text-gray-300 truncate pl-4">
                    📊 {currentProject.name}
                  </div>
                )}
              </div>
            </li>
          )}

          {/* User section */}
          <li className="mt-auto">
            <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-white">
              <UserIcon className="h-8 w-8 rounded-full bg-gray-800 p-1" />
              <span className="sr-only">Your profile</span>
              <div className="flex-1">
                <div className="text-sm">{user?.username || user?.email}</div>
                <div className="text-xs text-gray-400">{user?.subscription_plan || 'Free'}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="p-1 h-8 w-8"
              >
                <LogOutIcon className="h-4 w-4" />
              </Button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
};
