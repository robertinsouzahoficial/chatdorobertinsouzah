
import React, { useState, useEffect } from 'react';
import { CloseIcon, GoogleIcon } from './icons';
import { User } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  currentUser: User | null;
  onLogin: (email: string, password?: string) => Promise<User>;
  onSignup: (email: string, password?: string) => Promise<User>;
  onLogout: () => void;
  onGoogleLogin: () => Promise<User>;
  language: string;
  onLanguageChange: (language: string) => void;
}

// A simple, self-contained toggle switch component for the UI
const ToggleSwitch: React.FC = () => {
  const [isOn, setIsOn] = useState(false);
  return (
    <button onClick={() => setIsOn(!isOn)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isOn ? 'bg-[#0878d8]' : 'bg-gray-600'}`} aria-pressed={isOn}>
      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
};

// Spinner icon for loading states
const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const { 
    isOpen, onClose, onClearHistory, currentUser, 
    onLogin, onSignup, onLogout, onGoogleLogin,
    language, onLanguageChange
  } = props;
    
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const resetFormState = () => {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFeedbackMessage(null);
      setIsAuthLoading(false);
      setIsGoogleAuthLoading(false);
      setAuthMode('login');
  }

  // Reset fields when modal is closed or user logs in/out
  useEffect(() => {
    if (isOpen) {
        resetFormState();
    }
  }, [isOpen, currentUser]);

  // Clear feedback when user starts interacting again
  useEffect(() => {
    if (email || password || confirmPassword) {
      setFeedbackMessage(null);
    }
  }, [email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthLoading || isGoogleAuthLoading) return;
    
    setIsAuthLoading(true);
    setFeedbackMessage(null);

    try {
      if (authMode === 'signup' && password !== confirmPassword) {
        throw new Error('As senhas não coincidem. Tente novamente.');
      }
      
      switch(authMode) {
        case 'login':
          await onLogin(email, password);
          // On success, the currentUser prop will change and the component will re-render,
          // so no need to set a success message here. The UI change is the feedback.
          break;
        case 'signup':
          await onSignup(email, password);
          setFeedbackMessage({ type: 'success', text: 'Conta criada com sucesso! Você foi logado automaticamente.' });
          // No need to switch mode, the component will re-render to the logged-in view.
          break;
        case 'forgot':
          // The onForgot prop would be implemented here. For now, just show a message.
          setFeedbackMessage({ type: 'success', text: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.' });
          break;
      }
    } catch (error: any) {
      setFeedbackMessage({ type: 'error', text: error.message || 'Ocorreu um erro inesperado.' });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isAuthLoading || isGoogleAuthLoading) return;
    
    setIsGoogleAuthLoading(true);
    setFeedbackMessage(null);

    try {
        await onGoogleLogin();
        // Success is handled by App.tsx updating currentUser, which re-renders this component
    } catch (error: any) {
        setFeedbackMessage({ type: 'error', text: error.message || 'Falha no login com Google.' });
    } finally {
        setIsGoogleAuthLoading(false);
    }
  };

  if (!isOpen) return null;
  
  const renderAuthContent = () => {
    if (currentUser) {
      return (
        <div className="text-center">
            <h4 className="font-semibold text-white text-xl mb-2">Minha Conta</h4>
            <p className="text-gray-300 mb-4 break-all">Logado como: <strong className="font-medium">{currentUser.email}</strong></p>
            <button
                onClick={onLogout}
                className="w-full max-w-xs mx-auto px-4 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-semibold transition-colors"
            >
                Sair (Logout)
            </button>
        </div>
      );
    }

    const feedbackJsx = feedbackMessage && (
      <div 
        role="alert" 
        aria-live="assertive" 
        className={`p-3 rounded-xl text-center text-sm font-medium ${
            feedbackMessage.type === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'
        }`}
      >
        {feedbackMessage.text}
      </div>
    );
    
    const switchAuthMode = (mode: 'login' | 'signup' | 'forgot') => {
        setAuthMode(mode);
        setFeedbackMessage(null);
    };

    switch(authMode) {
      case 'signup':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="font-semibold text-white text-xl text-center mb-2">Criar sua Conta</h4>
            {feedbackJsx}
            <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required aria-label="E-mail" className="w-full bg-[#2a2a2a] text-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0878d8] placeholder-gray-500" />
            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required aria-label="Senha" className="w-full bg-[#2a2a2a] text-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0878d8] placeholder-gray-500" />
            <input type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required aria-label="Confirmar Senha" className="w-full bg-[#2a2a2a] text-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0878d8] placeholder-gray-500" />
            <button type="submit" disabled={isAuthLoading} className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-[#0878d8] hover:bg-[#2196f3] text-white font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-wait">
              {isAuthLoading && <SpinnerIcon />}
              <span>{isAuthLoading ? 'Criando conta...' : 'Criar Conta'}</span>
            </button>
             <div className="text-center text-sm pt-2">
              <span className="text-gray-400">Já tem uma conta? </span>
              <button type="button" onClick={() => switchAuthMode('login')} className="font-semibold text-[#2196f3] hover:underline bg-transparent border-none p-0 cursor-pointer">Faça login</button>
            </div>
          </form>
        );
      case 'forgot':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="font-semibold text-white text-xl text-center mb-2">Recuperar Senha</h4>
            <p className="text-sm text-gray-400 text-center">Insira seu e-mail e enviaremos um link para redefinir sua senha.</p>
            {feedbackJsx}
            <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required aria-label="E-mail" className="w-full bg-[#2a2a2a] text-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0878d8] placeholder-gray-500" />
            <button type="submit" disabled={isAuthLoading} className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-[#0878d8] hover:bg-[#2196f3] text-white font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-wait">
               {isAuthLoading && <SpinnerIcon />}
               <span>{isAuthLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}</span>
            </button>
            <div className="text-center text-sm pt-2">
              <button type="button" onClick={() => switchAuthMode('login')} className="text-gray-400 hover:text-white hover:underline bg-transparent border-none p-0 cursor-pointer">Voltar para o login</button>
            </div>
          </form>
        );
      case 'login':
      default:
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            {feedbackJsx}
            <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required aria-label="E-mail" className="w-full bg-[#2a2a2a] text-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0878d8] placeholder-gray-500" />
            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required aria-label="Senha" className="w-full bg-[#2a2a2a] text-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0878d8] placeholder-gray-500" />
            <button type="submit" disabled={isAuthLoading || isGoogleAuthLoading} className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-[#0878d8] hover:bg-[#2196f3] text-white font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-wait">
              {isAuthLoading && <SpinnerIcon />}
              <span>{isAuthLoading ? 'Entrando...' : 'Entrar'}</span>
            </button>
            <div className="flex items-center">
              <hr className="flex-grow border-t border-gray-600"/>
              <span className="mx-4 text-sm text-gray-400">ou</span>
              <hr className="flex-grow border-t border-gray-600"/>
            </div>
            <button 
              type="button" 
              onClick={handleGoogleSignIn}
              disabled={isAuthLoading || isGoogleAuthLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-gray-200 text-black font-semibold transition-colors border border-gray-300 disabled:bg-gray-400 disabled:cursor-wait"
            >
              {isGoogleAuthLoading ? <SpinnerIcon /> : <GoogleIcon className="w-5 h-5" />}
              <span>{isGoogleAuthLoading ? 'Aguarde...' : 'Entrar com Google'}</span>
            </button>
            <div className="text-center text-sm pt-2">
              <span className="text-gray-400">Não tem uma conta? </span>
              <button type="button" onClick={() => switchAuthMode('signup')} className="font-semibold text-[#2196f3] hover:underline bg-transparent border-none p-0 cursor-pointer">Crie uma conta</button>
            </div>
            <div className="text-center text-sm">
               <button type="button" onClick={() => switchAuthMode('forgot')} className="text-gray-400 hover:text-white hover:underline bg-transparent border-none p-0 cursor-pointer">Esqueci minha senha</button>
            </div>
          </form>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="bg-[#1c1c1c] border border-gray-700 p-6 rounded-xl shadow-xl w-full max-w-4xl h-full sm:h-[90vh] md:h-[80vh] flex flex-col text-white">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 id="settings-title" className="text-2xl font-semibold">Configurações</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors" aria-label="Fechar configurações">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto pr-4 -mr-4 flex-grow">
          {/* Section: Login */}
          <section className="mb-8" aria-labelledby="login-heading">
            <h3 id="login-heading" className="text-lg font-bold text-[#0878d8] mb-4 border-b border-gray-700 pb-2">
                {currentUser ? '👤 Minha Conta' : '👤 Fazer Login / Criar Conta'}
            </h3>
            <div className="flex justify-center px-2">
              <div className="w-full max-w-md">
                {renderAuthContent()}
              </div>
            </div>
          </section>

          {/* Section: Personalize */}
          <section className="mb-8" aria-labelledby="personalize-heading">
            <h3 id="personalize-heading" className="text-lg font-bold text-[#0878d8] mb-4 border-b border-gray-700 pb-2">🎨 Personalizar Chat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-gray-300 mb-2 font-medium">Idioma da Resposta</label>
                    <div className="flex gap-1 bg-[#2a2a2a] rounded-xl p-1">
                        <button 
                            onClick={() => onLanguageChange('pt-BR')}
                            className={`flex-1 p-2 rounded-lg text-sm transition-colors ${language === 'pt-BR' ? 'bg-[#0878d8]' : 'hover:bg-gray-600'}`}
                        >
                            Português
                        </button>
                        <button 
                           onClick={() => onLanguageChange('en-US')}
                           className={`flex-1 p-2 rounded-lg text-sm transition-colors ${language === 'en-US' ? 'bg-[#0878d8]' : 'hover:bg-gray-600'}`}
                        >
                            English
                        </button>
                    </div>
                </div>
                 <div>
                    <label className="block text-gray-300 mb-2 font-medium">Tamanho da Fonte</label>
                    <div className="flex gap-1 bg-[#2a2a2a] rounded-xl p-1">
                        <button className="flex-1 p-2 rounded-lg text-sm bg-[#0878d8]">Pequena</button>
                        <button className="flex-1 p-2 rounded-lg text-sm hover:bg-gray-600 transition-colors">Média</button>
                        <button className="flex-1 p-2 rounded-lg text-sm hover:bg-gray-600 transition-colors">Grande</button>
                    </div>
                </div>
                 <div>
                    <label htmlFor="button-color" className="block text-gray-300 mb-2 font-medium">Cor dos Botões</label>
                    <input id="button-color" type="color" defaultValue="#0878d8" className="w-20 h-10 p-1 bg-[#2a2a2a] rounded-lg cursor-pointer border-2 border-gray-600"/>
                </div>
                 <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-xl">
                    <label className="block text-gray-300 font-medium">Modo Compacto</label>
                    <ToggleSwitch />
                </div>
            </div>
          </section>
          
          {/* Section: Help */}
          <section className="mb-8" aria-labelledby="help-heading">
             <h3 id="help-heading" className="text-lg font-bold text-[#0878d8] mb-4 border-b border-gray-700 pb-2">❓ Ajuda e Suporte</h3>
             <div className="space-y-4">
                <a href="#" className="block text-gray-300 hover:text-white hover:underline">Perguntas Frequentes (FAQ)</a>
                <button className="px-4 py-2 text-sm rounded-xl bg-gray-600 hover:bg-gray-500 text-white transition-colors">Falar com Suporte</button>
                <div>
                    <h4 className="font-semibold mt-2">Guia rápido de como usar o chat</h4>
                    <p className="text-sm text-gray-400">Use o campo de texto para conversar, clique no ícone '+' para mais opções como enviar imagens, criar novas imagens ou pedir para eu estudar algum conteúdo.</p>
                </div>
             </div>
          </section>

          {/* Section: Other */}
          <section aria-labelledby="other-heading">
            <h3 id="other-heading" className="text-lg font-bold text-[#0878d8] mb-4 border-b border-gray-700 pb-2">⚡ Outras Configurações</h3>
            <div className="space-y-3">
                <button onClick={onClearHistory} className="px-4 py-2 text-sm rounded-xl bg-red-700 hover:bg-red-600 text-white transition-colors">Limpar histórico de chats</button>
                <button className="px-4 py-2 text-sm rounded-xl bg-gray-600 hover:bg-gray-500 text-white transition-colors">Exportar dados</button>
                <p className="text-sm text-gray-500 pt-2">Sobre o projeto: Chat do Robertin Souzah - Versão 1.0</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
