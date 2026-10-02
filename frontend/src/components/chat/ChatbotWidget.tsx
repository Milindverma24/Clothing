import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  FileText,
  Loader2,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Check,
  User,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendChatMessageApi, type ChatResponseData, type CitationSourceItem, type ChatProductItem } from '../../services/ragChatApi';
import { submitChatMessageFeedbackApi, getCustomerChatHistoryApi } from '../../services/aiConversationApi';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  dbMessageId?: number;
  sender: 'user' | 'assistant' | 'agent';
  agentName?: string;
  text: string;
  sources?: CitationSourceItem[];
  products?: ChatProductItem[];
  intent?: string;
  processingTimeMs?: number;
  timestamp: Date;
}

const GUEST_STARTER_PROMPTS = [
  'What is your return policy?',
  'How long does shipping take?',
  'What is the size guide for men?',
  'Do you have navy blue shirts?',
];

const AUTH_STARTER_PROMPTS = [
  'Where is my order?',
  'Show my recent orders',
  'Can I return my order?',
  'What is your return window?',
];

export const ChatbotWidget: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('clothing_chat_conv_id');
    return saved ? Number(saved) : null;
  });
  const [ratedMessages, setRatedMessages] = useState<Record<number, boolean>>({});

  const starterPrompts = isAuthenticated ? AUTH_STARTER_PROMPTS : GUEST_STARTER_PROMPTS;

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

  // Periodic polling for live human agent replies when chat is open
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const interval = setInterval(async () => {
      try {
        const detail = await getCustomerChatHistoryApi(conversationId);
        if (detail && detail.messages && detail.messages.length > 0) {
          setMessages((prev) => {
            const existingDbIds = new Set(prev.map((m) => m.dbMessageId).filter(Boolean));
            const newAgentMessages = detail.messages.filter(
              (m) => m.senderType === 'AGENT' && !existingDbIds.has(m.id)
            );

            if (newAgentMessages.length === 0) return prev;

            const mapped = newAgentMessages.map((m) => ({
              id: `agent-${m.id}`,
              dbMessageId: m.id,
              sender: 'agent' as const,
              agentName: m.modelName || 'Store Support Agent',
              text: m.content,
              timestamp: new Date(m.createdAt),
            }));

            return [...prev, ...mapped];
          });
        }
      } catch {
        // silent polling catch
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, conversationId]);

  const handleResetChat = () => {
    setConversationId(null);
    sessionStorage.removeItem('clothing_chat_conv_id');
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Hello. I am your clothing store assistant. How can I help you today?',
        timestamp: new Date(),
      },
    ]);
  };

  const handleFeedback = async (messageId: number, helpful: boolean) => {
    try {
      await submitChatMessageFeedbackApi(messageId, helpful);
      setRatedMessages((prev) => ({ ...prev, [messageId]: helpful }));
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

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
      const responseData: ChatResponseData = await sendChatMessageApi(query.trim(), {
        conversationId,
        sessionId: sessionStorage.getItem('clothing_chat_session') || undefined,
        userName: user ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
        userEmail: user?.email,
      });

      if (responseData.conversationId) {
        setConversationId(responseData.conversationId);
        sessionStorage.setItem('clothing_chat_conv_id', responseData.conversationId.toString());
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        dbMessageId: responseData.messageId,
        sender: 'assistant',
        text: responseData.answer,
        sources: responseData.sources,
        products: responseData.products,
        intent: responseData.intent,
        processingTimeMs: responseData.processingTimeMs,
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
                onClick={handleResetChat}
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
                className={`flex flex-col ${
                  msg.sender === 'user'
                    ? 'items-end'
                    : msg.sender === 'agent'
                    ? 'items-start'
                    : 'items-start'
                }`}
              >
                {/* Agent Header Badge */}
                {msg.sender === 'agent' && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <div className="w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center">
                      <UserCheck className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-[11px] font-bold text-black">
                      {msg.agentName || 'Store Support Team'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                      Live Agent
                    </span>
                  </div>
                )}

                {/* Text Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed text-xs ${
                    msg.sender === 'user'
                      ? 'bg-black text-white rounded-br-none shadow-sm'
                      : msg.sender === 'agent'
                      ? 'bg-neutral-900 text-white rounded-bl-none shadow-md border border-black'
                      : 'bg-white text-black border border-[#e5e5e5] rounded-bl-none shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Optional "Talk to Human Support" helper when AI is uncertain */}
                {msg.sender === 'assistant' &&
                  (msg.text.toLowerCase().includes("couldn't find that information") ||
                    msg.text.toLowerCase().includes('do not have sufficient') ||
                    msg.text.toLowerCase().includes('not covered in our')) && (
                    <div className="mt-2">
                      <button
                        onClick={() =>
                          handleSendMessage('Could a store support agent please help me with this inquiry?')
                        }
                        className="px-3 py-1.5 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#333] transition-colors shadow-xs"
                      >
                        <User className="w-3 h-3 text-white" />
                        <span>Request Store Support Agent</span>
                      </button>
                    </div>
                  )}

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

                <div className="flex items-center justify-between w-full mt-1 px-1">
                  <span className="text-[9px] text-[#afafaf]">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {msg.sender === 'assistant' && msg.dbMessageId && (
                    <div className="flex items-center gap-1 text-neutral-400">
                      {ratedMessages[msg.dbMessageId] !== undefined ? (
                        <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Feedback saved
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.dbMessageId!, true)}
                            className="p-1 hover:text-black hover:bg-neutral-200/60 rounded-full transition-all"
                            title="Helpful response"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.dbMessageId!, false)}
                            className="p-1 hover:text-black hover:bg-neutral-200/60 rounded-full transition-all"
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
              {starterPrompts.map((prompt) => (
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
