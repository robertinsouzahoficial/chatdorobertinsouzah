
import React from 'react';
import { ChatSession, User } from '../types';
import { PlusIcon, MessageSquareIcon, TrashIcon, SettingsIcon } from './icons';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onShowSettings: () => void;
  currentUser: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ sessions, activeSessionId, onSelectSession, onNewSession, onDeleteSession, isOpen, setIsOpen, onShowSettings, currentUser }) => {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setIsOpen(false)}></div>}
      <aside className={`bg-[#1c1c1c] w-64 p-4 flex flex-col flex-shrink-0 border-r border-gray-700 fixed md:static inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex-grow flex flex-col min-h-0">
          <div className="mb-4 flex-shrink-0">
              <h2 className="text-lg font-semibold text-white mb-4">Chats Salvos</h2>
              <button
                  onClick={onNewSession}
                  className="flex items-center justify-center gap-2 w-full p-3 text-white bg-[#0878d8] rounded-lg hover:bg-[#2196f3] transition-colors"
              >
                  <PlusIcon className="w-5 h-5" />
                  <span>Novo Chat</span>
              </button>
          </div>
          <div className="flex-grow overflow-y-auto -mr-2 pr-2">
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li key={session.id}>
                  <div
                    onClick={() => onSelectSession(session.id)}
                    className={`flex items-center p-3 rounded-lg cursor-pointer group transition-colors ${
                      activeSessionId === session.id ? 'bg-[#0878d8] text-white' : 'text-gray-300 hover:bg-[#2a2a2a]'
                    }`}
                  >
                    <MessageSquareIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="flex-grow truncate text-sm">{session.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="ml-2 p-1 text-gray-400 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-600 hover:text-white transition-opacity"
                      aria-label="Deletar chat"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-shrink-0 border-t border-gray-700 pt-4 mt-2">
           {currentUser && (
            <div className="p-3 mb-2 text-sm text-gray-300 border border-gray-700 rounded-lg">
                <span className="font-semibold block">Logado como:</span>
                <span className="truncate block">{currentUser.email}</span>
            </div>
           )}
           <button
                onClick={onShowSettings}
                className="flex items-center gap-3 w-full p-3 text-sm text-gray-300 rounded-lg hover:bg-[#2a2a2a] hover:text-white transition-colors"
            >
                <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Configurações</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
