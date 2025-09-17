import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SendIcon, PlusIcon, ImageIcon, FileIcon, PaletteIcon, BookIcon, BrainIcon, CloseIcon, MicrophoneIcon, VideoIcon } from './icons';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { getSearchHistory, deleteSearchHistoryEntry } from '../services/searchHistoryService';

interface MessageInputProps {
  onSendMessage: (message: string, imageFile: File | null) => void;
  isLoading: boolean;
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  onRemoveImage: () => void;
  onShowCreateImage: () => void;
  onShowStudy: () => void;
  onShowLearn: () => void;
  isImageGenAvailable: boolean;
  onShowCreateVideo: () => void;
  isVideoGenAvailable: boolean;
}

const MessageInput: React.FC<MessageInputProps> = (props) => {
  const { onSendMessage, isLoading, onImageSelect, selectedImage, onRemoveImage, onShowCreateImage, onShowStudy, onShowLearn, isImageGenAvailable, onShowCreateVideo, isVideoGenAvailable } = props;
  const [input, setInput] = useState('');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const speechBaseText = useRef<string>('');

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport
  } = useSpeechRecognition();

  useEffect(() => {
    // Load initial search history from storage
    setSearchHistory(getSearchHistory());
  }, []);

  useEffect(() => {
    // Combines text in the input before listening started with the real-time transcript.
    if (isListening) {
      setInput(speechBaseText.current + transcript);
    }
  }, [transcript, isListening]);
  
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      const currentInput = input.trim();
      speechBaseText.current = currentInput ? currentInput + ' ' : '';
      startListening();
    }
  };

  const handleSend = () => {
    const trimmedInput = input.trim();
    if ((trimmedInput || selectedImage) && !isLoading) {
      if(isListening) stopListening();
      onSendMessage(trimmedInput, selectedImage);
      setInput('');
      speechBaseText.current = '';
      if (trimmedInput) {
        // Refresh history from storage after sending to include the new entry
        setSearchHistory(getSearchHistory());
      }
      setHistoryOpen(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setHistoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if(isImage) onImageSelect(file);
      else alert(`Arquivo "${file.name}" selecionado. Funcionalidade em desenvolvimento.`);
    }
    e.target.value = ''; // Reset input
  };

  const filteredHistory = useMemo(() => {
    if (!input) {
      return searchHistory;
    }
    return searchHistory.filter(item =>
      item.toLowerCase().includes(input.toLowerCase())
    );
  }, [input, searchHistory]);

  const handleHistorySelect = (query: string) => {
    setInput(query);
    setHistoryOpen(false);
    textareaRef.current?.focus();
  };

  const handleHistoryDelete = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    const updatedHistory = deleteSearchHistoryEntry(query);
    setSearchHistory(updatedHistory);
  };
  
  return (
    <div className="bg-black p-4 flex-shrink-0">
      <div ref={containerRef} className="relative max-w-4xl mx-auto">
        {isHistoryOpen && filteredHistory.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#2a2a2a] rounded-xl shadow-lg border border-gray-600 max-h-60 overflow-y-auto z-10">
            <ul className="p-2 text-white">
              {filteredHistory.map((item, index) => (
                <li 
                  key={index} 
                  onClick={() => handleHistorySelect(item)}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg hover:bg-[#0878d8] cursor-pointer group"
                >
                  <span className="truncate flex-grow text-sm">{item}</span>
                  <button 
                    onClick={(e) => handleHistoryDelete(e, item)} 
                    className="p-1 text-gray-400 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-700 hover:text-white transition-opacity flex-shrink-0" 
                    aria-label={`Remover "${item}" do histórico`}
                    title="Remover do histórico"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {selectedImage && (
          <div className="mb-2 p-2 bg-[#1c1c1c] rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="w-12 h-12 rounded-md object-cover" />
                  <span className="text-sm text-gray-300">{selectedImage.name}</span>
              </div>
              <button onClick={onRemoveImage} className="p-1 text-gray-400 hover:text-white">
                  <CloseIcon className="w-5 h-5" />
              </button>
          </div>
        )}
        <div className="relative flex items-end bg-[#1c1c1c] rounded-xl shadow-lg border border-gray-700">
          <div className="relative">
             {isMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#2a2a2a] rounded-xl shadow-lg border border-gray-600 z-10">
                    <ul className="p-2 text-white">
                        <li onClick={() => imageInputRef.current?.click()} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#0878d8] cursor-pointer">
                            <ImageIcon className="w-5 h-5"/> <span>Adicionar Foto</span>
                        </li>
                        <li onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#0878d8] cursor-pointer">
                            <FileIcon className="w-5 h-5"/> <span>Adicionar Arquivo</span>
                        </li>
                         <li 
                           onClick={() => { if (isImageGenAvailable) { onShowCreateImage(); setMenuOpen(false); } }} 
                           title={isImageGenAvailable ? "Gere uma imagem única a partir de uma descrição de texto." : "Geração de imagem indisponível. Esta funcionalidade requer um plano pago na API do Google."}
                           className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isImageGenAvailable ? 'hover:bg-[#0878d8] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                           aria-disabled={!isImageGenAvailable}
                         >
                            <PaletteIcon className="w-5 h-5"/> <span>Criar Imagem</span>
                        </li>
                        <li 
                           onClick={() => { if (isVideoGenAvailable) { onShowCreateVideo(); setMenuOpen(false); } }} 
                           title={isVideoGenAvailable ? "Crie um vídeo curto a partir de uma descrição de texto." : "Geração de vídeo indisponível. Esta funcionalidade requer um plano pago na API do Google."}
                           className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isVideoGenAvailable ? 'hover:bg-[#0878d8] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                           aria-disabled={!isVideoGenAvailable}
                         >
                            <VideoIcon className="w-5 h-5"/> <span>Criar Vídeo</span>
                        </li>
                         <li onClick={() => { onShowStudy(); setMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#0878d8] cursor-pointer">
                            <BookIcon className="w-5 h-5"/> <span>Estudar</span>
                        </li>
                         <li onClick={() => { onShowLearn(); setMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#0878d8] cursor-pointer">
                            <BrainIcon className="w-5 h-5"/> <span>Aprender</span>
                        </li>
                    </ul>
                </div>
            )}
            <button
              onClick={() => setMenuOpen(!isMenuOpen)}
              className="p-3 m-2 rounded-full text-white bg-[#0878d8] hover:bg-[#2196f3] transition-colors"
              aria-label="Mais opções"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          <input type="file" ref={imageInputRef} onChange={(e) => handleFileSelect(e, true)} accept="image/*" className="hidden" />
          <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, false)} className="hidden" />
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setHistoryOpen(true)}
            placeholder={isListening ? "Ouvindo..." : "Digite sua pergunta..."}
            rows={1}
            className="w-full bg-transparent p-4 pr-28 text-gray-200 resize-none focus:outline-none placeholder-gray-400"
            disabled={isLoading || isListening}
            autoComplete="off"
          />
          {hasRecognitionSupport && (
              <button
                onClick={handleMicClick}
                className={`absolute right-14 bottom-3 p-2 rounded-full text-white transition-colors ${
                  isListening ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-transparent hover:bg-gray-700'
                }`}
                aria-label={isListening ? 'Parar gravação' : 'Gravar áudio'}
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
          )}
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="absolute right-3 bottom-3 p-2 rounded-full text-white bg-[#0878d8] hover:bg-[#2196f3] disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            aria-label="Enviar mensagem"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;