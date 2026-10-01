import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Sparkles,
  FileText,
  Download,
  Archive,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Send,
  UserCheck,
  BookOpen,
  Info,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';
import {
  getAiConversationsApi,
  getAiConversationDetailApi,
  getAiConversationStatsApi,
  updateConversationStatusApi,
  sendAdminReplyApi,
  type AiConversationSummary,
  type AiConversationDetail,
  type AiConversationStats,
} from '../../../services/aiConversationApi';

interface AiConversationsViewProps {
  onNavigateToKnowledgeBase?: () => void;
}

export const AiConversationsView: React.FC<AiConversationsViewProps> = ({
  onNavigateToKnowledgeBase,
}) => {
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [conversationDetail, setConversationDetail] = useState<AiConversationDetail | null>(null);
  const [stats, setStats] = useState<AiConversationStats | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'UNANSWERED' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');

  // Loading states
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Human reply input state
  const [replyText, setReplyText] = useState('');
  const [showRightDrawer, setShowRightDrawer] = useState(false);

  // Expandable trace states
  const [expandedTraceIds, setExpandedTraceIds] = useState<Record<number, boolean>>({});
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversationsAndStats = async () => {
    setIsLoadingList(true);
    try {
      const [listData, statsData] = await Promise.all([
        getAiConversationsApi({
          search: searchQuery,
          status: activeFilterTab === 'UNANSWERED' ? 'ALL' : activeFilterTab,
          dateRange: dateRangeFilter,
          page: 0,
          size: 50,
        }),
        getAiConversationStatsApi(),
      ]);

      let filteredContent = listData.content;
      if (activeFilterTab === 'UNANSWERED') {
        filteredContent = listData.content.filter((c) => c.hasUnanswered);
      }

      setConversations(filteredContent);
      setStats(statsData);

      // Select first conversation if none selected
      if (!selectedConvId && filteredContent.length > 0) {
        setSelectedConvId(filteredContent[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations or stats:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchConversationsAndStats();
  }, [activeFilterTab, dateRangeFilter]);

  // Load detail whenever selectedConvId changes
  useEffect(() => {
    if (!selectedConvId) {
      setConversationDetail(null);
      return;
    }

    const loadDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const detail = await getAiConversationDetailApi(selectedConvId);
        setConversationDetail(detail);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error('Failed to load conversation detail:', err);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    loadDetail();
  }, [selectedConvId]);

  const handleSendAdminReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConvId || !replyText.trim() || isSendingReply) return;

    const textToSend = replyText.trim();
    setIsSendingReply(true);
    try {
      const newMsg = await sendAdminReplyApi(selectedConvId, textToSend, 'Support Team');
      setReplyText('');

      // Update detail transcript locally
      if (conversationDetail && conversationDetail.id === selectedConvId) {
        setConversationDetail({
          ...conversationDetail,
          hasUnanswered: false,
          messageCount: conversationDetail.messageCount + 1,
          messages: [...conversationDetail.messages, newMsg],
        });
      }

      // Update conversation in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? {
                ...c,
                hasUnanswered: false,
                messageCount: c.messageCount + 1,
                lastMessageText: textToSend,
                lastSenderType: 'AGENT',
                lastActivityAt: new Date().toISOString(),
              }
            : c
        )
      );

      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to send admin reply:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const toggleTrace = (messageId: number) => {
    setExpandedTraceIds((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedConvId) return;
    setIsUpdatingStatus(true);
    try {
      await updateConversationStatusApi(selectedConvId, newStatus);
      if (conversationDetail) {
        setConversationDetail({ ...conversationDetail, status: newStatus as any });
      }
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConvId ? { ...c, status: newStatus as any } : c))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!selectedConvId) return;
    window.open(
      `http://localhost:8080/api/admin/ai-conversations/${selectedConvId}/export?format=${format}`,
      '_blank'
    );
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-[#1a1a1a] text-white',
      'bg-[#3b3b3b] text-white',
      'bg-[#2d3748] text-white',
      'bg-[#4a5568] text-white',
      'bg-[#111827] text-white',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Telemetry Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-[16px] border border-[#e5e5e5] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-wider block">
                Total Conversations
              </span>
              <span className="text-xl font-black text-black">{stats.totalConversations}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#f4f4f4] flex items-center justify-center text-black">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-[16px] border border-[#e5e5e5] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-wider block">
                Needs Reply / Gaps
              </span>
              <span className="text-xl font-black text-amber-600">{stats.unansweredCount}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-[16px] border border-[#e5e5e5] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-wider block">
                RAG Queries
              </span>
              <span className="text-xl font-black text-black">{stats.totalRagQueries}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-[16px] border border-[#e5e5e5] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-wider block">
                Avg Response Latency
              </span>
              <span className="text-xl font-black text-black">{stats.avgResponseLatencyMs} ms</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Main Messaging Layout Container */}
      <div className="bg-white border border-[#e5e5e5] rounded-[20px] shadow-sm overflow-hidden flex flex-col md:flex-row h-[780px]">
        {/* ========================================================
            LEFT COLUMN: Messages & Conversation Channel List
            (Inspired by Realtime-Chat messaging channel)
           ======================================================== */}
        <div
          className={`w-full md:w-[360px] lg:w-[400px] border-r border-[#e5e5e5] flex flex-col bg-white flex-shrink-0 ${
            showMobileDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-[#f4f4f4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-black tracking-tight">Messages</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#f4f4f4] text-black font-bold">
                {conversations.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchConversationsAndStats}
                className="w-8 h-8 rounded-full hover:bg-[#f4f4f4] flex items-center justify-center text-[#5e5e5e] hover:text-black transition-colors"
                title="Refresh list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
              </button>
              <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shadow-xs">
                S
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="px-4 py-3 border-b border-[#f4f4f4]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchConversationsAndStats();
              }}
              className="relative"
            >
              <Search className="w-4 h-4 text-[#8a8a8a] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#f4f4f4] border-0 rounded-[12px] text-xs text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-1 focus:ring-black transition-all"
              />
            </form>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2.5 flex items-center gap-1.5 border-b border-[#f4f4f4] overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'All' },
              {
                id: 'UNANSWERED',
                label: 'Needs Reply',
                badge: stats?.unansweredCount && stats.unansweredCount > 0 ? stats.unansweredCount : undefined,
              },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'ARCHIVED', label: 'Archived' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilterTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  activeFilterTab === tab.id
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-[#f4f4f4] text-[#5e5e5e] hover:bg-[#e8e8e8] hover:text-black'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}

            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="ml-auto px-2.5 py-1 bg-[#f4f4f4] border-0 rounded-full text-[10px] font-bold text-black focus:outline-none focus:ring-1 focus:ring-black flex-shrink-0"
            >
              <option value="ALL">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7d</option>
              <option value="30days">Last 30d</option>
            </select>
          </div>

          {/* Conversation Channel Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f8f8f8]">
            {isLoadingList ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-black mx-auto mb-2" />
                <p className="text-xs text-[#8a8a8a] font-medium">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#f4f4f4] text-[#8a8a8a] flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-black uppercase">No conversations found</p>
                <p className="text-[11px] text-[#8a8a8a]">
                  Customer inquiries and chat dialogues will appear here.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const avatarColor = getAvatarColor(conv.userName || 'Customer');
                const initial = conv.userName ? conv.userName[0].toUpperCase() : 'C';

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      setShowMobileDetail(true);
                    }}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-[#f4f4f4]'
                        : 'hover:bg-[#fafafa]'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-11 h-11 rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm shadow-xs`}
                      >
                        {initial}
                      </div>
                      {conv.status === 'ACTIVE' && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                      )}
                    </div>

                    {/* Content Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-black truncate">
                          {conv.userName}
                        </span>
                        <span className="text-[10px] text-[#8a8a8a] flex-shrink-0 font-medium">
                          {formatRelativeTime(conv.lastActivityAt)}
                        </span>
                      </div>

                      <p className="text-xs text-[#5e5e5e] truncate leading-snug">
                        {conv.lastMessageText || conv.title}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        {conv.hasUnanswered && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                            <span>Needs Reply</span>
                          </span>
                        )}
                        {conv.ragQueriesCount > 0 && (
                          <span className="text-[10px] text-[#8a8a8a] flex items-center gap-0.5">
                            <BookOpen className="w-2.5 h-2.5" />
                            <span>{conv.ragQueriesCount} RAG</span>
                          </span>
                        )}
                        <span className="text-[10px] text-[#8a8a8a]">
                          {conv.messageCount} msgs
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: Channel Transcript & Live Agent Chatting
           ======================================================== */}
        <div
          className={`flex-1 flex flex-col bg-[#fafafa] overflow-hidden ${
            showMobileDetail ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* EMPTY STATE: Welcome Screen (Matches Realtime-Chat Reference) */}
          {!selectedConvId || !conversationDetail ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white space-y-4">
              <div className="w-20 h-20 rounded-full bg-black text-white text-3xl font-black flex items-center justify-center shadow-lg">
                S
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-black tracking-tight">
                  Welcome, <span className="underline decoration-black">Support Lead</span>
                </h3>
                <p className="text-xs text-[#5e5e5e] max-w-sm mx-auto leading-relaxed">
                  Select a customer conversation from the left to inspect multi-turn transcripts,
                  verify RAG knowledge citations, or reply directly as a live store agent.
                </p>
              </div>

              {stats?.unansweredCount && stats.unansweredCount > 0 ? (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveFilterTab('UNANSWERED')}
                    className="rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Review {stats.unansweredCount} Unanswered Questions</span>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {/* Channel Header */}
              <div className="px-5 py-3.5 bg-white border-b border-[#e5e5e5] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileDetail(false)}
                    className="md:hidden p-1.5 rounded-full hover:bg-[#f4f4f4] text-black"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div
                    className={`w-10 h-10 rounded-full ${getAvatarColor(
                      conversationDetail.userName
                    )} flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0`}
                  >
                    {conversationDetail.userName ? conversationDetail.userName[0].toUpperCase() : 'C'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-black">
                        {conversationDetail.userName}
                      </h3>
                      {conversationDetail.hasUnanswered && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                          Waiting for Support
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8a8a8a] block">
                      {conversationDetail.userEmail || `Session: ${conversationDetail.sessionId}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowRightDrawer(!showRightDrawer)}
                    className="text-xs rounded-full h-8 px-3 border-[#e5e5e5] flex items-center gap-1.5"
                    title="Toggle Session Details"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Details</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExport('csv')}
                    className="text-xs rounded-full h-8 px-3 border-[#e5e5e5] flex items-center gap-1.5"
                    title="Export CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">CSV</span>
                  </Button>

                  {conversationDetail.status === 'ACTIVE' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange('ARCHIVED')}
                      disabled={isUpdatingStatus}
                      className="text-xs rounded-full h-8 px-3 border-[#e5e5e5] flex items-center gap-1.5"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Archive</span>
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange('ACTIVE')}
                      disabled={isUpdatingStatus}
                      className="text-xs rounded-full h-8 px-3 border-[#e5e5e5] flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reopen</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Main Transcript Message Bubbles */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {isLoadingDetail ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-black mx-auto mb-2" />
                    <p className="text-xs text-[#8a8a8a]">Retrieving chronological transcript...</p>
                  </div>
                ) : (
                  conversationDetail.messages.map((msg) => {
                    const isUser = msg.senderType === 'USER';
                    const isAgent = msg.senderType === 'AGENT';
                    const isAssistant = msg.senderType === 'ASSISTANT';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isUser ? 'items-start' : isAgent ? 'items-end' : 'items-start'
                        }`}
                      >
                        {/* Sender Label & Timestamp */}
                        <div
                          className={`flex items-center gap-2 mb-1 px-1 text-[11px] font-semibold text-[#8a8a8a] ${
                            isAgent ? 'flex-row-reverse' : ''
                          }`}
                        >
                          {isUser ? (
                            <span>{conversationDetail.userName}</span>
                          ) : isAgent ? (
                            <span className="text-black font-bold flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-black" />
                              <span>{msg.modelName || 'Store Support Agent'}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-black font-bold">
                              <Sparkles className="w-3 h-3 text-black" />
                              <span>Store AI Assistant</span>
                            </span>
                          )}
                          <span>•</span>
                          <span>{formatRelativeTime(msg.createdAt)}</span>
                        </div>

                        {/* Bubble Content */}
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-[18px] p-4 text-xs shadow-xs space-y-3 ${
                            isUser
                              ? 'bg-white border border-[#e5e5e5] text-black rounded-tl-xs'
                              : isAgent
                              ? 'bg-black text-white rounded-tr-xs'
                              : 'bg-white border border-[#e5e5e5] text-black rounded-tl-xs'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap font-normal">
                            {msg.content}
                          </p>

                          {/* RAG Knowledge Sources Chips */}
                          {isAssistant && msg.sources && msg.sources.length > 0 && (
                            <div className="pt-2 border-t border-[#f0f0f0] space-y-2">
                              <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-wider block">
                                Grounded RAG Citations ({msg.sources.length})
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {msg.sources.map((src) => (
                                  <div
                                    key={src.id}
                                    className="bg-[#f9f9f9] border border-[#e5e5e5] rounded-[10px] p-2 text-[10px] space-y-1"
                                  >
                                    <div className="flex items-center gap-1.5 font-bold text-black">
                                      <FileText className="w-3 h-3 text-[#5e5e5e]" />
                                      <span>{src.documentName}</span>
                                      <span className="text-[#8a8a8a]">p.{src.pageNumber}</span>
                                    </div>
                                    {src.sourceExcerpt && (
                                      <p className="text-[#5e5e5e] italic line-clamp-2">
                                        “{src.sourceExcerpt}”
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommended Catalog Products */}
                          {isAssistant && msg.products && msg.products.length > 0 && (
                            <div className="pt-2 border-t border-[#f0f0f0] space-y-2">
                              <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-wider block">
                                Recommended Catalog Products
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {msg.products.map((prod) => (
                                  <Link
                                    key={prod.id}
                                    to={`/products/${prod.productSlug || prod.productId}`}
                                    target="_blank"
                                    className="flex items-center gap-2.5 p-2 rounded-[10px] bg-[#f9f9f9] border border-[#e5e5e5] hover:border-black transition-colors"
                                  >
                                    <div className="w-9 h-9 rounded-md bg-white border border-[#e5e5e5] overflow-hidden flex-shrink-0">
                                      <img
                                        src={prod.imageUrl || '/images/15970.jpg'}
                                        alt={prod.productName}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <h5 className="font-bold text-black text-[11px] truncate">
                                        {prod.productName}
                                      </h5>
                                      {prod.price && (
                                        <span className="text-[10px] text-[#5e5e5e] font-mono">
                                          ₹{prod.price}
                                        </span>
                                      )}
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Technical AI Processing Trace Button */}
                          {isAssistant && (
                            <div className="pt-1 flex items-center justify-between text-[10px] text-[#8a8a8a]">
                              <button
                                onClick={() => toggleTrace(msg.id)}
                                className="hover:text-black font-semibold flex items-center gap-1"
                              >
                                <span>AI Trace</span>
                                {expandedTraceIds[msg.id] ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </button>

                              {msg.processingTimeMs !== undefined && msg.processingTimeMs > 0 && (
                                <span>{msg.processingTimeMs} ms</span>
                              )}
                            </div>
                          )}

                          {/* Expanded Trace Details */}
                          {expandedTraceIds[msg.id] && (
                            <div className="p-2.5 bg-[#f4f4f4] rounded-[8px] font-mono text-[10px] space-y-1 text-[#333]">
                              <div>Intent: {msg.intent || 'RAG_QUERY'}</div>
                              <div>Model: {msg.modelName || 'local-synthesizer'}</div>
                              <div>Turn Latency: {msg.processingTimeMs || 0} ms</div>
                              {msg.errorStatus && (
                                <div className="text-amber-800 font-bold">
                                  Gap: {msg.errorStatus}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* If conversation has an unanswered question or missing context, show banner */}
                {conversationDetail.hasUnanswered && (
                  <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <span>Knowledge Gap Detected: AI Could Not Find Documented Answer</span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      The AI Assistant did not find sufficient coverage in current PDF policy documents.
                      You can reply directly below as a human support agent to answer {conversationDetail.userName} immediately.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() =>
                          setReplyText(
                            'Hello, yes we offer international shipping to Canada via DHL Express with tracking.'
                          )
                        }
                        className="px-2.5 py-1 rounded-full bg-white text-amber-900 border border-amber-300 text-[10px] font-semibold hover:bg-amber-100 transition-colors"
                      >
                        + “Yes, we ship to Canada via DHL”
                      </button>
                      <button
                        onClick={() =>
                          setReplyText(
                            'Our standard return window is 30 days from delivery. Return shipping is complimentary for exchanges.'
                          )
                        }
                        className="px-2.5 py-1 rounded-full bg-white text-amber-900 border border-amber-300 text-[10px] font-semibold hover:bg-amber-100 transition-colors"
                      >
                        + “Our return window is 30 days”
                      </button>
                      {onNavigateToKnowledgeBase && (
                        <button
                          onClick={onNavigateToKnowledgeBase}
                          className="px-2.5 py-1 rounded-full bg-amber-900 text-white text-[10px] font-semibold hover:bg-amber-800 transition-colors"
                        >
                          Upload PDF to Knowledge Base →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ========================================================
                  HUMAN AGENT REPLY / CHAT INPUT BAR
                  (Allows a person to reply directly into the RAG conversation)
                 ======================================================== */}
              <div className="p-3 md:p-4 bg-white border-t border-[#e5e5e5]">
                <form onSubmit={handleSendAdminReply} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={`Reply as Store Support Agent to ${conversationDetail.userName}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={isSendingReply}
                      className="w-full pl-4 pr-10 py-3 bg-[#f4f4f4] border-0 rounded-full text-xs text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!replyText.trim() || isSendingReply}
                    className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0 bg-black text-white hover:bg-[#222]"
                    title="Send Reply"
                  >
                    {isSendingReply ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </Button>
                </form>
                <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-[#8a8a8a]">
                  <span>
                    Your reply will be delivered directly into {conversationDetail.userName}'s chat session.
                  </span>
                  <span>Press Enter to send</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ========================================================
            RIGHT INSPECTOR DRAWER (Collapsible Details)
           ======================================================== */}
        {showRightDrawer && conversationDetail && (
          <div className="w-80 border-l border-[#e5e5e5] bg-white p-5 space-y-6 overflow-y-auto flex-shrink-0 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#f4f4f4]">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                Conversation Details
              </h4>
              <button
                onClick={() => setShowRightDrawer(false)}
                className="text-xs font-bold text-[#8a8a8a] hover:text-black"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-[#8a8a8a] uppercase block">User</span>
                <span className="text-xs font-bold text-black">{conversationDetail.userName}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8a8a8a] uppercase block">Email</span>
                <span className="text-xs text-black font-mono">
                  {conversationDetail.userEmail || 'Anonymous Guest'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8a8a8a] uppercase block">
                  Session ID
                </span>
                <span className="text-[11px] text-[#5e5e5e] font-mono break-all">
                  {conversationDetail.sessionId}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8a8a8a] uppercase block">Status</span>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f4f4f4] text-black">
                  {conversationDetail.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8a8a8a] uppercase block">
                  Total Messages
                </span>
                <span className="text-xs font-bold text-black">
                  {conversationDetail.messageCount} turns
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#f4f4f4] space-y-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport('json')}
                className="w-full text-xs rounded-full"
              >
                Download JSON Transcript
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
