import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Button } from '../ui/Button';
import { QuickNav } from '../ui/QuickNav';
import { 
  HomeIcon, 
  FolderIcon, 
  CogIcon,
  LogOutIcon,
  UserIcon,
  BellIcon
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ workspaceId?: string; projectId?: string }>();
  const { user, logout } = useAuthStore();
  
  const currentWorkspaceId = params.workspaceId ? parseInt(params.workspaceId) : undefined;
  const currentProjectId = params.projectId ? parseInt(params.projectId) : undefined;

  // Responsive state: collapsed when width < 1280px (xl breakpoint)
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsCollapsed(window.innerWidth < 1280);
    };

    // Check on mount
    checkWidth();

    // Add resize listener
    window.addEventListener('resize', checkWidth);
    
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const topNavigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
    },
  ];

  const bottomNavigation = [
    {
      name: 'Notifications',
      href: '/notifications',
      icon: BellIcon,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
    },
  ];

  return (
    <div className={`flex h-full flex-col bg-gray-900 dark:bg-gray-950 transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-center px-4">
        {isCollapsed ? (
          <h1 className="text-xl font-bold text-white">AI</h1>
        ) : (
          <h1 className="text-xl font-bold text-white">AI Vision Platform</h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 pb-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {/* Top navigation items */}
              {topNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`
                        group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                        ${isCollapsed ? 'justify-center' : ''}
                        ${isActive
                          ? 'bg-gray-800 dark:bg-gray-700 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-700'
                        }
                      `}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
              
              {/* Workspaces with conditional QuickNav */}
              <li>
                <Link
                  to="/workspaces"
                  className={`
                    group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                    ${isCollapsed ? 'justify-center' : ''}
                    ${location.pathname === '/workspaces'
                      ? 'bg-gray-800 dark:bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-700'
                    }
                  `}
                  title={isCollapsed ? 'Workspaces' : undefined}
                >
                  <FolderIcon className="h-6 w-6 shrink-0" />
                  {!isCollapsed && <span>Workspaces</span>}
                </Link>
                
                {/* QuickNav only visible when not collapsed */}
                {!isCollapsed && (
                  <div className="ml-2 mt-1">
                    <QuickNav 
                      currentWorkspaceId={currentWorkspaceId} 
                      currentProjectId={currentProjectId}
                    />
                  </div>
                )}
              </li>
              
              {/* Bottom navigation items */}
              {bottomNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`
                        group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                        ${isCollapsed ? 'justify-center' : ''}
                        ${isActive
                          ? 'bg-gray-800 dark:bg-gray-700 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-700'
                        }
                      `}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* User section */}
          <li className="mt-auto">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-y-2 py-3">
                <Link
                  to="/settings"
                  className="rounded-full bg-gray-800 p-2 hover:bg-gray-700"
                  title={user?.username || user?.email}
                  aria-label={`Settings for ${user?.username || user?.email}`}
                >
                  <UserIcon className="h-6 w-6 text-white" />
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="p-2 h-10 w-10"
                  title="Logout"
                >
                  <LogOutIcon className="h-4 w-4" />
                </Button>
              </div>
            ) : (
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
                  title="Logout"
                >
                  <LogOutIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
};
