
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { DownloadIcon } from './icons';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const { sender, text, imageUrl, videoUrl } = message;
  const isUser = sender === 'user';

  const wrapperClasses = `flex my-4 ${isUser ? 'justify-end' : 'justify-start'}`;
  const bubbleClasses = `px-4 py-3 rounded-xl shadow-md max-w-2xl`;
  const userBubbleClasses = `bg-[#0878d8] text-white`;
  const modelBubbleClasses = `bg-[#1c1c1c] text-white`;

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `gerado-por-ia-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={wrapperClasses}>
      <div className={`${bubbleClasses} ${isUser ? userBubbleClasses : modelBubbleClasses}`}>
        {imageUrl && (
          <div className="relative group">
            <img 
              src={imageUrl} 
              alt="Conteúdo da imagem" 
              className="rounded-lg mb-2 max-w-full h-auto" 
            />
            {sender === 'model' && imageUrl.startsWith('data:image') && (
              <button
                onClick={handleDownload}
                className="absolute top-2 right-2 p-2 bg-black bg-opacity-60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                aria-label="Baixar imagem"
                title="Baixar imagem"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        {videoUrl && (
            <video 
                src={videoUrl} 
                controls 
                className="rounded-lg mb-2 max-w-full h-auto"
                aria-label="Vídeo gerado"
            >
                Seu navegador não suporta a tag de vídeo.
            </video>
        )}
        <div className="prose prose-invert max-w-none prose-p:my-2 prose-headings:my-2">
          {isUser ? (
             <div style={{ whiteSpace: 'pre-wrap' }}>{text || '...'}</div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {text || '...'}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
