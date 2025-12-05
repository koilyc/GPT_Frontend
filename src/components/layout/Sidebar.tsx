import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../store';
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
  const { currentWorkspace, currentProject } = useAppStore();
  
  const currentWorkspaceId = params.workspaceId ? parseInt(params.workspaceId) : undefined;
  const currentProjectId = params.projectId ? parseInt(params.projectId) : undefined;

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
              {/* Top navigation items */}
              {topNavigation.map((item) => {
                const isActive = location.pathname === item.href;
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
              
              {/* Workspaces with always-visible QuickNav */}
              <li>
                <Link
                  to="/workspaces"
                  className={`
                    group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                    ${location.pathname === '/workspaces'
                      ? 'bg-gray-800 dark:bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <FolderIcon className="h-6 w-6 shrink-0" />
                  Workspaces
                </Link>
                
                {/* QuickNav always visible under Workspaces */}
                <div className="ml-2 mt-1">
                  <QuickNav 
                    currentWorkspaceId={currentWorkspaceId} 
                    currentProjectId={currentProjectId}
                  />
                </div>
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

          {/* Current Context - Hidden since QuickNav is always visible */}
          {false && currentWorkspace && (
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
