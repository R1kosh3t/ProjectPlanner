import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  children?: React.ReactNode;
  isCompact?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, children, isCompact = false }) => {
  if (isCompact) {
    return (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg p-4 h-full">
            <p className="text-sm">{message}</p>
            {children}
        </div>
    );
  }

  return (
    <div className="text-center bg-gray-800/50 rounded-lg p-8 sm:p-12 border border-gray-700">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      {title && <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>}
      <p className="text-gray-400 max-w-md mx-auto">{message}</p>
      {children}
    </div>
  );
};

export default EmptyState;