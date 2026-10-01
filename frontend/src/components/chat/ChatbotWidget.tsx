import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, FileText, Loader2, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendChatMessageApi, type ChatResponseData, type CitationSourceItem, type ChatProductItem } from '../../services/ragChatApi';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: CitationSourceItem[];
  products?: ChatProductItem[];
  intent?: string;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  'What is your return policy?',
  'How long does shipping take?',
  'What is the size guide for men?',
  'Do you have navy blue shirts?',
];

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello. I am your clothing store assistant. I can answer questions about our return policy, delivery times, size guides, or help you discover pieces from our catalog.',
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const responseData: ChatResponseData = await sendChatMessageApi(query.trim());

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: responseData.answer,
        sources: responseData.sources,
        products: responseData.products,
        intent: responseData.intent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to connect to the knowledge base service right now. Please ensure the backend server is running.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 px-5 py-3.5 bg-black text-white hover:bg-[#2a2a2a] rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/20"
          aria-label="Open AI Store Assistant"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider hidden sm:inline">
            Store Assistant
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-[#e5e5e5] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-black text-white px-5 py-4 flex items-center justify-between border-b border-black flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-tight text-white flex items-center gap-2">
                  <span>Store Assistant</span>
                  <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                    RAG AI
                  </span>
                </h3>
                <span className="text-[10px] text-[#afafaf] block">Grounded in official store documents</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome',
                      sender: 'assistant',
                      text: 'Conversation reset. How can I assist you with our catalog or store policies today?',
                      timestamp: new Date(),
                    },
                  ])
                }
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 hover:text-white"
                title="Reset Conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#fafafa] text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Text Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-black text-white rounded-br-none shadow-sm'
                      : 'bg-white text-black border border-[#e5e5e5] rounded-bl-none shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Grounded Citation Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 max-w-[85%] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] block">
                      Grounded Sources ({msg.sources.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 bg-white border border-[#e5e5e5] rounded-md text-[10px] text-[#5e5e5e] flex items-center gap-1.5 shadow-xs"
                          title={s.snippet}
                        >
                          <FileText className="w-3 h-3 text-black" />
                          <span className="font-semibold text-black">{s.documentName}</span>
                          <span>• Page {s.pageNumber}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Product Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 w-full space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] block">
                      Matching Catalog Pieces:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {msg.products.map((p) => (
                        <Link
                          key={p.id}
                          to={`/products/${p.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="bg-white p-2.5 rounded-xl border border-[#e5e5e5] hover:border-black transition-all flex flex-col group shadow-xs"
                        >
                          <div className="aspect-square rounded-lg bg-[#f4f4f4] overflow-hidden mb-2 relative">
                            <img
                              src={p.imageUrl || '/images/15970.jpg'}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <span className="font-bold text-[11px] text-black line-clamp-1 group-hover:underline">
                            {p.name}
                          </span>
                          <span className="font-semibold text-[11px] text-black mt-0.5">
                            ₹{p.basePrice.toLocaleString('en-IN')}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[9px] text-[#afafaf] mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#8a8a8a] bg-white px-3.5 py-2 rounded-2xl border border-[#e5e5e5] w-fit shadow-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                <span>Searching knowledge base & catalog...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 bg-white border-t border-[#f4f4f4] flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-[10px] font-semibold text-black transition-all whitespace-nowrap flex-shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input Bar */}
          <div className="p-3 bg-white border-t border-[#e5e5e5] flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about returns, shipping, size, or products..."
                disabled={isLoading}
                className="w-full pl-4 pr-12 py-2.5 bg-[#f4f4f4] rounded-full text-xs text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-1 focus:ring-black border border-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="absolute right-1.5 w-8 h-8 rounded-full bg-black text-white hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
