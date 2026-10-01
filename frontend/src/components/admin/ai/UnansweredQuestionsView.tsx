import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  UploadCloud,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import {
  getUnansweredQuestionsApi,
  type UnansweredQuestionItem,
} from '../../../services/aiConversationApi';

interface UnansweredQuestionsViewProps {
  onNavigateToKnowledgeBase?: () => void;
  onViewConversation?: (conversationId: number) => void;
}

export const UnansweredQuestionsView: React.FC<UnansweredQuestionsViewProps> = ({
  onNavigateToKnowledgeBase,
  onViewConversation,
}) => {
  const [questions, setQuestions] = useState<UnansweredQuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchUnanswered = async (page = 0) => {
    setIsLoading(true);
    try {
      const data = await getUnansweredQuestionsApi(page, 20);
      setQuestions(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to load unanswered questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnanswered(0);
  }, []);

  const filteredQuestions = questions.filter((q) => {
    if (!searchFilter) return true;
    const lower = searchFilter.toLowerCase();
    return (
      q.userQuestion.toLowerCase().includes(lower) ||
      q.userName.toLowerCase().includes(lower) ||
      (q.userEmail && q.userEmail.toLowerCase().includes(lower)) ||
      q.reason.toLowerCase().includes(lower)
    );
  });

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getReasonLabel = (reason: string) => {
    if (reason.includes('INSUFFICIENT_KNOWLEDGE') || reason.includes('KNOWLEDGE')) {
      return 'Missing Policy / Knowledge Doc';
    }
    if (reason.includes('LOW_SIMILARITY')) {
      return 'Low Vector Similarity';
    }
    if (reason.includes('EMPTY')) {
      return 'No Matching Chunks Found';
    }
    return reason;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Improvement Loop Explanation */}
      <div className="bg-black text-white p-6 md:p-8 rounded-[16px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Continuous Knowledge Base Loop</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">
            Questions AI Could Not Answer
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            When customer questions cannot be resolved with existing documentation, they are logged here.
            Review knowledge gaps below, then upload new policy PDFs to re-index your vector database and enable accurate future answers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Button
            variant="secondary"
            onClick={() => fetchUnanswered(currentPage)}
            className="border-white/30 text-white bg-transparent hover:bg-white hover:text-black rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {onNavigateToKnowledgeBase && (
            <Button
              variant="primary"
              onClick={onNavigateToKnowledgeBase}
              className="bg-white text-black hover:bg-gray-100 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload New PDF</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[16px] border border-[#e5e5e5] shadow-xs">
          <span className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider block mb-1">
            Total Knowledge Gaps
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-black">{totalElements}</span>
            <span className="text-xs text-[#5e5e5e]">unanswered inquiries</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#e5e5e5] shadow-xs">
          <span className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider block mb-1">
            Primary Gap Cause
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-amber-700">Missing Coverage</span>
            <span className="text-xs text-[#5e5e5e]">in uploaded PDFs</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#e5e5e5] shadow-xs">
          <span className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider block mb-1">
            Action Loop Status
          </span>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ready for PDF Re-index</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-[16px] border border-[#e5e5e5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#5e5e5e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions, user names, emails..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f9f9f9] border border-[#e5e5e5] rounded-full text-xs text-black placeholder:text-[#8e8e8e] focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div className="text-xs text-[#5e5e5e] font-medium">
          Showing {filteredQuestions.length} of {totalElements} logged inquiries
        </div>
      </div>

      {/* List of Questions */}
      {isLoading ? (
        <div className="bg-white rounded-[16px] border border-[#e5e5e5] p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-black mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#5e5e5e]">
            Scanning Knowledge Gap Logs...
          </p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-[#e5e5e5] p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-black uppercase tracking-tight">
              No Unanswered Questions
            </h3>
            <p className="text-xs text-[#5e5e5e] mt-1 max-w-md mx-auto">
              Great news! The AI chatbot has successfully found relevant documentation for customer inquiries.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-[16px] border border-[#e5e5e5] hover:border-black/30 p-5 md:p-6 transition-all shadow-xs space-y-4"
            >
              {/* Question Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f4f4f4]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center uppercase">
                    {q.userName ? q.userName[0] : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-black">{q.userName}</span>
                      {q.userEmail && (
                        <span className="text-[11px] text-[#5e5e5e] font-mono">({q.userEmail})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#5e5e5e]">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(q.timestamp)}</span>
                      <span>•</span>
                      <span>Conv #{q.conversationId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{getReasonLabel(q.reason)}</span>
                  </span>
                </div>
              </div>

              {/* Question & AI Response Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#f9f9f9] p-4 rounded-[12px] border border-[#f0f0f0] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#5e5e5e] uppercase tracking-wider block">
                    Customer Asked:
                  </span>
                  <p className="text-sm font-semibold text-black leading-snug">
                    “{q.userQuestion}”
                  </p>
                </div>

                <div className="bg-[#f9f9f9] p-4 rounded-[12px] border border-[#f0f0f0] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#5e5e5e] uppercase tracking-wider block">
                    AI Chatbot Output:
                  </span>
                  <p className="text-xs text-[#5e5e5e] leading-relaxed line-clamp-3">
                    {q.aiResponse}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-[#5e5e5e] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Recommendation: Upload relevant PDF covering this subject.</span>
                </div>

                <div className="flex items-center gap-2">
                  {onViewConversation && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewConversation(q.conversationId)}
                      className="rounded-full text-[11px] font-bold uppercase tracking-wider h-8 px-4 flex items-center gap-1.5 border-[#e5e5e5] text-black hover:bg-black hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Conversation</span>
                    </Button>
                  )}

                  {onNavigateToKnowledgeBase && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onNavigateToKnowledgeBase}
                      className="rounded-full text-[11px] font-bold uppercase tracking-wider h-8 px-4 flex items-center gap-1.5 bg-black text-white hover:bg-gray-800"
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Upload PDF to Fix</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-[#5e5e5e]">
                Page {currentPage + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => fetchUnanswered(currentPage - 1)}
                  className="rounded-full text-xs font-bold uppercase tracking-wider h-8 px-3"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => fetchUnanswered(currentPage + 1)}
                  className="rounded-full text-xs font-bold uppercase tracking-wider h-8 px-3"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
