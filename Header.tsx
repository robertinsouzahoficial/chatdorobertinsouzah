
import React from 'react';
import { MenuIcon } from './icons';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-[#1c1c1c] p-4 border-b border-gray-700 flex-shrink-0 flex items-center h-16 z-10">
      <button onClick={onMenuClick} className="md:hidden p-2 mr-2 text-gray-300 hover:text-white">
          <MenuIcon className="w-6 h-6" />
      </button>
      <div className="flex-grow text-center md:text-xl">
        <h1 className="text-xl font-bold text-white">Chat do Robertin Souzah</h1>
      </div>
    </header>
  );
};

export default Header;