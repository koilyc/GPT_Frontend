import React from 'react';
import { Button } from './Button';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-16 ${className}`}>
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        <Icon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <Button 
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-lg transition-colors duration-200"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
