

import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.tsx';
import Sidebar from './components/Sidebar';
import ChatBubble from './components/ChatBubble';
import MessageInput from './components/MessageInput';
import LoadingIndicator from './components/LoadingIndicator';
import ActionModal from './components/ActionModal';
import SettingsModal from './components/SettingsModal';
import Modal from './components/Modal';
import { BotIcon } from './components/icons';
import { Message, ChatSession, User } from './types';
import { generateContentStream, generateImage, generateVideo, generateChatTitle, BillingError } from './services/geminiService';
import { getChatHistory, saveChatHistory, createNewSession, deleteSession, updateSessionTitle } from './services/chatHistoryService';
import { addSearchHistoryEntry } from './services/searchHistoryService';
import { fileToBase64 } from './utils/fileUtils';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isCreateImageModalOpen, setCreateImageModalOpen] = useState(false);
  const [isCreateVideoModalOpen, setCreateVideoModalOpen] = useState(false);
  const [isStudyModalOpen, setStudyModalOpen] = useState(false);
  const [isLearnModalOpen, setLearnModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isConfirmClearModalOpen, setConfirmClearModalOpen] = useState(false);
  
  const [isImageGenAvailable, setIsImageGenAvailable] = useState(true);
  const [isVideoGenAvailable, setIsVideoGenAvailable] = useState(true);
  const [language, setLanguage] = useState<string>('pt-BR');


  const chatContainerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const history = getChatHistory();
    setSessions(history);
    if (history.length > 0) {
      setActiveSessionId(history[0].id);
    } else {
      handleNewSession();
    }
    
    const savedLang = localStorage.getItem('app_language');
    if (savedLang) {
        setLanguage(savedLang);
    }

  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [sessions, activeSessionId, streamingMessage]);
  
  const activeSession = sessions.find(s => s.id === activeSessionId);

  const updateMessages = (sessionId: string, newMessages: Message[]) => {
    const updatedSessions = sessions.map(session =>
      session.id === sessionId ? { ...session, messages: newMessages } : session
    );
    setSessions(updatedSessions);
    saveChatHistory(updatedSessions);
  };
  
  const handleSendMessage = async (messageText: string, imageFile: File | null = null) => {
    if (isLoading || !activeSessionId) return;

    let imagePart = null;
    let userMessageText = messageText;
    
    if (imageFile) {
        const { base64, mimeType } = await fileToBase64(imageFile);
        imagePart = { inlineData: { data: base64, mimeType } };
        userMessageText = messageText || 'Descreva esta imagem.';
    }

    if (!userMessageText) return;

    // Add user's message to search history
    addSearchHistoryEntry(userMessageText);

    const userMessage: Message = { 
        sender: 'user', 
        text: userMessageText, 
        imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined 
    };
    
    const currentMessages = activeSession?.messages ? [...activeSession.messages, userMessage] : [userMessage];
    updateMessages(activeSessionId, currentMessages);
    setSelectedImage(null);

    setIsLoading(true);
    setStreamingMessage({ sender: 'model', text: '' });

    // Auto-generate title for new chats
    if (currentMessages.length === 1) {
        const title = await generateChatTitle(userMessageText, language);
        const updatedSessions = updateSessionTitle(activeSessionId, title);
        setSessions(updatedSessions);
    }

    try {
        let fullResponse = '';
        const stream = generateContentStream(userMessageText, currentMessages, imagePart, language);
        for await (const chunk of stream) {
            fullResponse += chunk;
            setStreamingMessage({ sender: 'model', text: fullResponse });
        }

        // On success, add the final message to the history
        if (fullResponse && activeSessionId) {
            const finalModelMessage: Message = { sender: 'model', text: fullResponse };
            updateMessages(activeSessionId, [...currentMessages, finalModelMessage]);
        }
    } catch (error) {
        // On failure, add a formatted error message to the history
        const errorMessageText = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        const errorMessage: Message = { sender: 'model', text: `⚠️ **Erro:** ${errorMessageText}` };
        if (activeSessionId) {
            updateMessages(activeSessionId, [...currentMessages, errorMessage]);
        }
    } finally {
        // Always clean up the UI state
        setIsLoading(false);
        setStreamingMessage(null);
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    if (isLoading || !activeSessionId || !isImageGenAvailable) return;
    setCreateImageModalOpen(false);
    
    const userMessage: Message = { sender: 'user', text: `Gerar imagem: "${prompt}"` };
    addSearchHistoryEntry(userMessage.text);
    const currentMessages = activeSession?.messages ? [...activeSession.messages, userMessage] : [userMessage];
    updateMessages(activeSessionId, currentMessages);

    setIsLoading(true);

    try {
      const base64Image = await generateImage(prompt);
      const imageUrl = `data:image/png;base64,${base64Image}`;
      const modelMessage: Message = { sender: 'model', text: `Imagem gerada para: "${prompt}"`, imageUrl };
      updateMessages(activeSessionId, [...currentMessages, modelMessage]);
    } catch (error) {
      if (error instanceof BillingError) {
        setIsImageGenAvailable(false);
      }
      
      const errorMessageText = error instanceof Error ? error.message : "Desculpe, não foi possível gerar a imagem.";
      const errorMessage: Message = { sender: 'model', text: `⚠️ **Erro:** ${errorMessageText}` };
      updateMessages(activeSessionId, [...currentMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVideo = async (prompt: string) => {
    if (isLoading || !activeSessionId || !isVideoGenAvailable) return;
    setCreateVideoModalOpen(false);
    
    const userMessage: Message = { sender: 'user', text: `Gerar vídeo: "${prompt}"` };
    addSearchHistoryEntry(userMessage.text);
    const currentMessages = activeSession?.messages ? [...activeSession.messages, userMessage] : [userMessage];
    updateMessages(activeSessionId, currentMessages);

    const waitingMessage: Message = { sender: 'model', text: `Criando seu vídeo... 🎬 Isso pode levar alguns minutos. Vou te avisar assim que estiver pronto!` };
    updateMessages(activeSessionId, [...currentMessages, waitingMessage]);
    
    setIsLoading(true);

    try {
      const videoUrl = await generateVideo(prompt);
      const modelMessage: Message = { sender: 'model', text: `Aqui está o vídeo que você pediu: "${prompt}"`, videoUrl };
      // Replace waiting message with the final result
      updateMessages(activeSessionId, [...currentMessages, modelMessage]);
    } catch (error) {
      if (error instanceof BillingError) {
        setIsVideoGenAvailable(false);
      }
      
      const errorMessageText = error instanceof Error ? error.message : "Desculpe, não foi possível gerar o vídeo.";
      const errorMessage: Message = { sender: 'model', text: `⚠️ **Erro:** ${errorMessageText}` };
      // Replace waiting message with an error message
      updateMessages(activeSessionId, [...currentMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudy = (content: string) => {
    setStudyModalOpen(false);
    const prompt = `Por favor, estude o seguinte texto e me diga o que você aprendeu ou resuma-o:\n\n---\n${content}\n---`;
    handleSendMessage(prompt);
  };

  const handleLearn = (content: string) => {
    setLearnModalOpen(false);
    const prompt = `Por favor, aprenda a seguinte informação para usar em nossa conversa:\n\n---\n${content}\n---`;
    handleSendMessage(prompt);
  };
  
  const handleNewSession = () => {
    const newSession = createNewSession();
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    const updatedSessions = deleteSession(id);
    setSessions(updatedSessions);
    if (activeSessionId === id) {
      setActiveSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
      if (updatedSessions.length === 0) {
        handleNewSession();
      }
    }
  };

  const handleClearAllHistory = () => {
    const emptyHistory: ChatSession[] = [];
    setSessions(emptyHistory);
    saveChatHistory(emptyHistory);
    
    // Create a new session to start fresh
    const newSession = createNewSession();
    setSessions([newSession]);
    setActiveSessionId(newSession.id);
    
    setConfirmClearModalOpen(false);
    setSettingsModalOpen(false);
  };
  
  const handleLogin = (email: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      // Simulate API call
      setTimeout(() => {
        if (email.toLowerCase() === 'error@example.com') {
          reject(new Error('Credenciais inválidas. Verifique seu e-mail e senha.'));
        } else {
          const user = { email };
          setCurrentUser(user);
          resolve(user);
        }
      }, 1000);
    });
  };

  const handleSignup = (email: string): Promise<User> => {
     return new Promise((resolve, reject) => {
      // Simulate API call
      setTimeout(() => {
        if (email.toLowerCase() === 'error@example.com') {
          reject(new Error('Este e-mail já está em uso.'));
        } else {
           const user = { email };
          // In a real app, you'd probably want to log the user in right after signup
          setCurrentUser(user); 
          resolve(user);
        }
      }, 1000);
    });
  };
  
  const handleGoogleLogin = (): Promise<User> => {
    return new Promise((resolve) => {
      // Simulate Google OAuth popup and API call
      setTimeout(() => {
        const user = { email: 'user.google@example.com' };
        setCurrentUser(user);
        resolve(user);
      }, 1000);
    });
  };

  const handleLogout = () => {
      setCurrentUser(null);
      // Optionally, close the settings modal on logout
      // setSettingsModalOpen(false);
  };
  
  const handleLanguageChange = (lang: string) => {
      setLanguage(lang);
      localStorage.setItem('app_language', lang);
  };


  return (
    <div className="flex h-screen bg-black text-white font-sans">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onShowSettings={() => setSettingsModalOpen(true)}
        currentUser={currentUser}
      />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {!activeSession?.messages?.length && !isLoading && !streamingMessage && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <BotIcon className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-semibold">Chat do Robertin Souzah</h2>
                <p>Como posso ajudar hoje?</p>
              </div>
            )}
            {activeSession?.messages.map((msg, index) => (
              <ChatBubble key={index} message={msg} />
            ))}
            {streamingMessage && (
              <ChatBubble message={streamingMessage} />
            )}
            {isLoading && !streamingMessage?.text && (
               <div className="flex items-start gap-4 my-4 justify-start">
                  <LoadingIndicator />
              </div>
            )}
          </div>
        </main>
        <MessageInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading}
          onImageSelect={setSelectedImage}
          selectedImage={selectedImage}
          onRemoveImage={() => setSelectedImage(null)}
          onShowCreateImage={() => setCreateImageModalOpen(true)}
          onShowStudy={() => setStudyModalOpen(true)}
          onShowLearn={() => setLearnModalOpen(true)}
          isImageGenAvailable={isImageGenAvailable}
          onShowCreateVideo={() => setCreateVideoModalOpen(true)}
          isVideoGenAvailable={isVideoGenAvailable}
        />
      </div>

      <ActionModal
        isOpen={isCreateImageModalOpen}
        onClose={() => setCreateImageModalOpen(false)}
        onSubmit={handleGenerateImage}
        title="🎨 Criar Imagem com IA"
        description="Seja o mais descritivo possível para melhores resultados. Você pode incluir estilos como 'foto realista', 'pintura a óleo', ou 'pixel art'."
        placeholder="Ex: Um gato de óculos escuros tocando guitarra em um telhado, estilo anime."
        submitText='Gerar'
      />
       <ActionModal
        isOpen={isCreateVideoModalOpen}
        onClose={() => setCreateVideoModalOpen(false)}
        onSubmit={handleGenerateVideo}
        title="🎥 Criar Vídeo com IA"
        description="Descreva a cena que você quer criar. A geração pode levar alguns minutos. Seja paciente!"
        placeholder="Ex: Um close de um astronauta surfando em uma onda cósmica."
        submitText='Gerar Vídeo'
      />
      <ActionModal
        isOpen={isStudyModalOpen}
        onClose={() => setStudyModalOpen(false)}
        onSubmit={handleStudy}
        title="📖 Estudar Conteúdo"
        placeholder="Cole aqui o texto, resumo ou conteúdo que você quer que eu estude..."
        isTextarea={true}
        submitText='Enviar para Estudo'
      />
      <ActionModal
        isOpen={isLearnModalOpen}
        onClose={() => setLearnModalOpen(false)}
        onSubmit={handleLearn}
        title="🧠 Aprender Informação"
        placeholder="Cole aqui a informação que você quer me ensinar..."
        isTextarea={true}
        submitText='Enviar para Aprender'
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onClearHistory={() => setConfirmClearModalOpen(true)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onLogout={handleLogout}
        onGoogleLogin={handleGoogleLogin}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      <Modal
        isOpen={isConfirmClearModalOpen}
        onClose={() => setConfirmClearModalOpen(false)}
        onConfirm={handleClearAllHistory}
        title="Confirmar Limpeza"
      >
        <p>Tem certeza de que deseja apagar todo o seu histórico de chats? Esta ação não pode ser desfeita.</p>
      </Modal>

    </div>
  );
};

export default App;