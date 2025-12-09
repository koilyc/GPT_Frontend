import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'bg-green-50' : type === 'error' ? 'bg-red-50' : 'bg-blue-50';
  const textColor = type === 'success' ? 'text-green-800' : type === 'error' ? 'text-red-800' : 'text-blue-800';
  const iconColor = type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : 'text-blue-400';

  return (
    <div className={`${bgColor} ${textColor} p-4 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] max-w-md`}>
      <div className="flex items-center">
        {type === 'success' && <CheckCircleIcon className={`h-5 w-5 ${iconColor} mr-3`} />}
        {type === 'error' && <XCircleIcon className={`h-5 w-5 ${iconColor} mr-3`} />}
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className={`ml-4 ${textColor} hover:opacity-75`}
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};
