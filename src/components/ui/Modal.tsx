import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { XIcon } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Track open modals to properly restore body overflow
let openModalCount = 0;
let originalBodyOverflow: string | null = null;

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  ariaLabel,
  size = 'md' 
}) => {
  // Track if this modal instance has contributed to the count
  const hasIncrementedCount = useRef(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen && !hasIncrementedCount.current) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      if (openModalCount === 0) {
        originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      openModalCount += 1;
      hasIncrementedCount.current = true;
    } else if (!isOpen && hasIncrementedCount.current) {
      // Modal was closed, decrement count
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0 && originalBodyOverflow !== null) {
        document.body.style.overflow = originalBodyOverflow;
        originalBodyOverflow = null;
      }
      hasIncrementedCount.current = false;
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Cleanup on unmount: if this modal contributed to count, decrement it
      if (hasIncrementedCount.current) {
        openModalCount = Math.max(0, openModalCount - 1);
        if (openModalCount === 0 && originalBodyOverflow !== null) {
          document.body.style.overflow = originalBodyOverflow;
          originalBodyOverflow = null;
        }
        hasIncrementedCount.current = false;
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={cn(
            'relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full transform transition-all',
            sizeClasses[size]
          )}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-label={!title ? ariaLabel : undefined}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className={cn('px-6 py-4', !title && 'pt-8')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
