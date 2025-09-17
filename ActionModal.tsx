import React, { useState, useEffect } from 'react';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
  title: string;
  placeholder: string;
  description?: string;
  isTextarea?: boolean;
  submitText?: string;
}

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, onSubmit, title, placeholder, description, isTextarea = false, submitText = 'Submit' }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContent(''); // Reset content when modal opens
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isTextarea) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-[#1c1c1c] border border-gray-700 p-6 rounded-xl shadow-xl w-full max-w-2xl flex flex-col">
        <h2 className="text-xl font-semibold mb-2 text-white">{title}</h2>
        {description && <p className="text-gray-400 text-sm mb-4">{description}</p>}
        <div className="text-gray-300 mb-6 flex-grow">
          {isTextarea ? (
             <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full h-64 bg-[#2a2a2a] text-gray-200 p-3 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#0878d8] placeholder-gray-500"
            />
          ) : (
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full bg-[#2a2a2a] text-gray-200 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0878d8] placeholder-gray-500"
            />
          )}
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={!content.trim()}
            className="px-4 py-2 rounded-md bg-[#0878d8] hover:bg-[#2196f3] text-white transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;