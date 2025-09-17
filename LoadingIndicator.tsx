
import React from 'react';

const LoadingIndicator: React.FC = () => {
  return (
    <div className="self-start flex items-center space-x-2 bg-[#1c1c1c] px-4 py-3 rounded-xl shadow-md">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  );
};

export default LoadingIndicator;
