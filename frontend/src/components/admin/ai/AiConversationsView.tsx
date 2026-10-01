import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Sparkles,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Download,
  Archive,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';
import {
  getAiConversationsApi,
  getAiConversationDetailApi,
  getAiConversationStatsApi,
  updateConversationStatusApi,
  type AiConversationSummary,
  type AiConversationDetail,
  type AiConversationStats,
} from '../../../services/aiConversationApi';

export const AiConversationsView: React.FC<{ onNavigateToKnowledgeBase?: () => void }> = ({
  onNavigateToKnowledgeBase,
}) => {
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [conversationDetail, setConversationDetail] = useState<AiConversationDetail | null>(null);
  const [stats, setStats] = useState<AiConversationStats | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');
  const [intentFilter, setIntentFilter] = useState('ALL');

  // Loading states
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Expandable message trace states
  const [expandedTraceIds, setExpandedTraceIds] = useState<Record<number, boolean>>({});
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const fetchConversationsAndStats = async () => {
    setIsLoadingList(true);
    try {
      const [listData, statsData] = await Promise.all([
        getAiConversationsApi({
          search: searchQuery,
          status: statusFilter,
          intent: intentFilter,
          dateRange: dateRangeFilter,
          page: 0,
          size: 50,
        }),
        getAiConversationStatsApi(),
      ]);

      setConversations(listData.content);
      setStats(statsData);

      // Select first conversation if none selected
      if (!selectedConvId && listData.content.length > 0) {
        setSelectedConvId(listData.content[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations or stats:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchConversationsAndStats();
  }, [statusFilter, dateRangeFilter, intentFilter]);

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
      } catch (err) {
        console.error('Failed to load conversation detail:', err);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    loadDetail();
  }, [selectedConvId]);

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
    window.open(`http://localhost:8080/api/admin/ai-conversations/${selectedConvId}/export?format=${format}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block">
            AI OBSERVABILITY & SUPPORT
          </span>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
              AI Conversations
            </h1>
            <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
              {stats?.totalConversations ?? conversations.length} Sessions
            </span>
          </div>
          <p className="text-xs text-[#5e5e5e] mt-1 font-medium">
            Monitor real-time customer dialogues, inspect retrieved RAG citations, and verify product recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchConversationsAndStats}
            disabled={isLoadingList}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-xs">
            <span className="text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider block">
              Total Chats
            </span>
            <span className="text-xl font-extrabold text-black mt-1 block">
              {stats.totalConversations}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-xs">
            <span className="text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider block">
              Active Sessions
            </span>
            <span className="text-xl font-extrabold text-black mt-1 block">
              {stats.activeConversations}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-xs">
            <span className="text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider block">
              RAG Queries
            </span>
            <span className="text-xl font-extrabold text-black mt-1 block">
              {stats.totalRagQueries}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-xs">
            <span className="text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider block">
              Catalog Searches
            </span>
            <span className="text-xl font-extrabold text-black mt-1 block">
              {stats.totalProductSearches}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-xs">
            <span className="text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider block">
              Avg Latency
            </span>
            <span className="text-xl font-extrabold text-black mt-1 block">
              {stats.avgResponseLatencyMs} ms
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-xs">
            <span className="text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider block">
              Satisfaction
            </span>
            <span className="text-xl font-extrabold text-emerald-700 mt-1 block flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              {stats.satisfactionRate}%
            </span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchConversationsAndStats();
          }}
          className="relative flex-1"
        >
          <Search className="w-4 h-4 text-[#8a8a8a] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, topic, or question..."
            className="w-full pl-9 pr-4 py-2 bg-[#f8f8f8] rounded-full text-xs text-black placeholder:text-[#8a8a8a] border border-[#e5e5e5] focus:outline-none focus:ring-1 focus:ring-black"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Intent Filter */}
          <select
            value={intentFilter}
            onChange={(e) => setIntentFilter(e.target.value)}
            className="px-3 py-2 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Actions</option>
            <option value="RAG_QUERY">RAG Knowledge</option>
            <option value="PRODUCT_SEARCH">Product Search</option>
            <option value="GREETING">General / ChitChat</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="px-3 py-2 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Main Monitoring Workspace (Dual Pane) */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px]">
        {/* Left Panel: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-[#e5e5e5] flex flex-col h-full bg-[#fafafa] ${
            showMobileDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-3 border-b border-[#e5e5e5] bg-white flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-black">
              Dialogues ({conversations.length})
            </span>
            <span className="text-[11px] text-[#8a8a8a]">Sorted by activity</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#eeeeee]">
            {isLoadingList && conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8a8a8a]">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-black" />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8a8a8a]">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-[#cccccc]" />
                <span>No conversations found matching filters.</span>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const initials = conv.userName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      setShowMobileDetail(true);
                    }}
                    className={`p-3.5 transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-black text-white'
                        : 'bg-white hover:bg-[#f4f4f4] text-black'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isSelected ? 'bg-white text-black' : 'bg-black text-white'
                        }`}
                      >
                        {initials || 'U'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`font-extrabold text-xs truncate ${
                              isSelected ? 'text-white' : 'text-black'
                            }`}
                          >
                            {conv.userName}
                          </span>
                          <span
                            className={`text-[10px] whitespace-nowrap ${
                              isSelected ? 'text-white/60' : 'text-[#8a8a8a]'
                            }`}
                          >
                            {new Date(conv.lastActivityAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-semibold truncate block mt-0.5 ${
                            isSelected ? 'text-white/90' : 'text-[#444444]'
                          }`}
                        >
                          {conv.title}
                        </span>

                        {conv.lastMessageText && (
                          <p
                            className={`text-[11px] truncate mt-1 ${
                              isSelected ? 'text-white/70' : 'text-[#777777]'
                            }`}
                          >
                            {conv.lastMessageText}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#f0f0f0] text-black border border-[#e0e0e0]'
                            }`}
                          >
                            {conv.messageCount} msgs
                          </span>

                          {conv.ragQueriesCount > 0 && (
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-[#eef2f6] text-[#1e40af]'
                              }`}
                            >
                              RAG ({conv.ragQueriesCount})
                            </span>
                          )}

                          {conv.productSearchesCount > 0 && (
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-[#f3f4f6] text-black'
                              }`}
                            >
                              Products ({conv.productSearchesCount})
                            </span>
                          )}

                          {conv.hasUnanswered && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#fef3f2] text-[#b42318] border border-[#fecdca] flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Gap
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Panel: Full Conversation Transcript */}
        <div
          className={`flex-1 flex flex-col h-full bg-[#fbfbfb] ${
            !showMobileDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {isLoadingDetail ? (
            <div className="flex-1 flex items-center justify-center text-xs text-[#8a8a8a]">
              <Loader2 className="w-6 h-6 animate-spin mr-2 text-black" />
              <span>Loading conversation transcript...</span>
            </div>
          ) : !conversationDetail ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8a8a8a]">
              <MessageSquare className="w-10 h-10 mb-3 text-[#d0d0d0]" />
              <h3 className="font-bold text-sm text-black">No Conversation Selected</h3>
              <p className="text-xs text-[#8a8a8a] mt-1 max-w-sm">
                Select an interaction from the left panel to inspect the full chronological customer chat history and RAG traces.
              </p>
            </div>
          ) : (
            <>
              {/* Transcript Top Bar */}
              <div className="p-4 bg-white border-b border-[#e5e5e5] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileDetail(false)}
                    className="md:hidden p-1 text-black hover:bg-[#f4f4f4] rounded-full"
                    title="Back to conversation list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {conversationDetail.userName.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h2 className="text-sm font-extrabold uppercase tracking-tight text-black flex items-center gap-2">
                      <span>{conversationDetail.userName}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          conversationDetail.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {conversationDetail.status}
                      </span>
                    </h2>
                    <span className="text-[11px] text-[#777777] block">
                      {conversationDetail.userEmail || `Session: ${conversationDetail.sessionId}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-1.5 text-xs"
                    title="Export transcript as CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </Button>

                  {conversationDetail.status === 'ACTIVE' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange('ARCHIVED')}
                      disabled={isUpdatingStatus}
                      className="flex items-center gap-1.5 text-xs"
                      title="Archive this dialogue"
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
                      className="flex items-center gap-1.5 text-xs"
                      title="Reopen dialogue"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reopen</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages Chronological Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {conversationDetail.messages.map((msg) => {
                  const isUser = msg.senderType === 'USER';
                  const isTraceOpen = !!expandedTraceIds[msg.id];

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender Indicator */}
                      <span className="text-[10px] uppercase font-bold text-[#8a8a8a] mb-1 px-1">
                        {isUser ? 'Customer' : 'Store Concierge (AI)'} •{' '}
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-black text-white rounded-br-xs'
                            : 'bg-white text-black border border-[#e5e5e5] rounded-bl-xs shadow-xs'
                        }`}
                      >
                        <p className="whitespace-pre-line font-medium">{msg.content}</p>
                      </div>

                      {/* Assistant Additional Observability Details */}
                      {!isUser && (
                        <div className="mt-2 w-full max-w-[85%] space-y-2">
                          {/* Processing Trace Accordion */}
                          <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
                            <button
                              onClick={() => toggleTrace(msg.id)}
                              className="w-full px-3 py-1.5 flex items-center justify-between text-[10px] font-bold text-[#555555] bg-[#f9f9f9] hover:bg-[#f2f2f2] transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-black" />
                                <span>AI Processing Trace</span>
                                <span className="font-semibold text-[#8a8a8a]">
                                  ({msg.processingTimeMs ?? 0}ms • {msg.modelName || 'local-rag'})
                                </span>
                              </div>
                              {isTraceOpen ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {isTraceOpen && (
                              <div className="p-3 bg-white space-y-2 text-[11px] border-t border-[#e5e5e5]">
                                <div className="grid grid-cols-2 gap-2 text-neutral-600">
                                  <div>
                                    <span className="text-[#8a8a8a] block text-[9px] uppercase font-bold">
                                      Detected Intent
                                    </span>
                                    <span className="font-bold text-black">{msg.intent || 'GENERAL'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#8a8a8a] block text-[9px] uppercase font-bold">
                                      Response Time
                                    </span>
                                    <span className="font-bold text-black">{msg.processingTimeMs ?? 0} ms</span>
                                  </div>
                                  <div>
                                    <span className="text-[#8a8a8a] block text-[9px] uppercase font-bold">
                                      Retrieved Chunks
                                    </span>
                                    <span className="font-bold text-black">
                                      {msg.sources ? msg.sources.length : 0} chunks
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#8a8a8a] block text-[9px] uppercase font-bold">
                                      Catalog Matches
                                    </span>
                                    <span className="font-bold text-black">
                                      {msg.products ? msg.products.length : 0} items
                                    </span>
                                  </div>
                                </div>

                                {msg.errorStatus && (
                                  <div className="mt-2 p-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[10px]">
                                    <span className="font-bold block">Status Note:</span>
                                    <span>{msg.errorStatus}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Grounded RAG Sources */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="p-3 bg-white border border-[#e5e5e5] rounded-xl text-[11px] space-y-1.5">
                              <span className="font-bold text-[10px] text-[#8a8a8a] uppercase tracking-wider block">
                                Grounded RAG Knowledge Citations ({msg.sources.length})
                              </span>
                              <div className="space-y-1">
                                {msg.sources.map((src) => (
                                  <div
                                    key={src.id}
                                    className="p-2 bg-[#f8f8f8] rounded-lg border border-[#e5e5e5]"
                                  >
                                    <div className="flex items-center justify-between font-bold text-black text-[11px]">
                                      <div className="flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-black" />
                                        <span>{src.documentName}</span>
                                        <span className="font-normal text-[#8a8a8a]">• Page {src.pageNumber}</span>
                                      </div>
                                      <span className="text-[10px] bg-neutral-200 text-black px-1.5 py-0.5 rounded font-mono">
                                        {Math.round(src.similarityScore * 100)}% match
                                      </span>
                                    </div>
                                    {src.sourceExcerpt && (
                                      <p className="text-[10px] text-[#555555] mt-1 italic line-clamp-2">
                                        "{src.sourceExcerpt}"
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Catalog Products Triggered */}
                          {msg.products && msg.products.length > 0 && (
                            <div className="p-3 bg-white border border-[#e5e5e5] rounded-xl text-[11px] space-y-2">
                              <span className="font-bold text-[10px] text-[#8a8a8a] uppercase tracking-wider block">
                                Products Recommended from PostgreSQL Catalog ({msg.products.length})
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {msg.products.map((p) => (
                                  <Link
                                    key={p.id}
                                    to={`/products/${p.productSlug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-[#f8f8f8] border border-[#e5e5e5] hover:border-black rounded-lg transition-all group block"
                                  >
                                    <div className="aspect-square bg-white rounded overflow-hidden mb-1">
                                      <img
                                        src={p.imageUrl || '/images/15970.jpg'}
                                        alt={p.productName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    </div>
                                    <span className="font-bold text-[10px] text-black line-clamp-1 group-hover:underline">
                                      {p.productName}
                                    </span>
                                    <span className="text-[10px] font-semibold text-black block mt-0.5">
                                      ₹{p.price?.toLocaleString('en-IN')}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Customer Feedback Pill */}
                          {msg.isHelpful !== null && msg.isHelpful !== undefined && (
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#555555]">
                              {msg.isHelpful ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  <ThumbsUp className="w-3 h-3" /> Customer marked response helpful
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                  <ThumbsDown className="w-3 h-3" /> Customer marked response unhelpful
                                  {msg.feedbackComment && ` — "${msg.feedbackComment}"`}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right Panel: Conversation Metadata Inspector Drawer */}
        {conversationDetail && (
          <div className="hidden xl:flex w-72 border-l border-[#e5e5e5] bg-white p-5 flex-col justify-between overflow-y-auto h-full text-xs">
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-wider block mb-1">
                  Customer Profile
                </span>
                <div className="p-3 bg-[#fafafa] rounded-xl border border-[#e5e5e5] space-y-1.5">
                  <span className="font-extrabold text-xs text-black block">
                    {conversationDetail.userName}
                  </span>
                  <span className="text-[11px] text-[#666666] block">
                    {conversationDetail.userEmail || 'No email provided (Guest)'}
                  </span>
                  <span className="text-[10px] font-mono text-[#8a8a8a] block truncate">
                    ID: {conversationDetail.sessionId}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-wider block mb-1">
                  Session Metrics
                </span>
                <div className="p-3 bg-[#fafafa] rounded-xl border border-[#e5e5e5] space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Started:</span>
                    <span className="font-bold text-black">
                      {new Date(conversationDetail.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Messages:</span>
                    <span className="font-bold text-black">{conversationDetail.messageCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">RAG Questions:</span>
                    <span className="font-bold text-black">{conversationDetail.ragQueriesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Product Queries:</span>
                    <span className="font-bold text-black">
                      {conversationDetail.productSearchesCount}
                    </span>
                  </div>
                </div>
              </div>

              {conversationDetail.hasUnanswered && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-[11px] text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Knowledge Base Gap</span>
                  </div>
                  <p className="text-[10px] text-amber-800">
                    The AI lacked sufficient documentation to answer one or more questions in this dialogue.
                  </p>
                  {onNavigateToKnowledgeBase && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onNavigateToKnowledgeBase}
                      className="w-full text-[10px] py-1.5"
                    >
                      Upload Missing PDF
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#f0f0f0] space-y-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport('json')}
                className="w-full text-xs"
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
