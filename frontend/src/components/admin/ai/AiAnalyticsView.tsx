import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Package,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import {
  getAiConversationStatsApi,
  type AiConversationStats,
} from '../../../services/aiConversationApi';

interface AiAnalyticsViewProps {
  onNavigateToConversations?: () => void;
  onNavigateToUnanswered?: () => void;
  onNavigateToKnowledgeBase?: () => void;
}

export const AiAnalyticsView: React.FC<AiAnalyticsViewProps> = ({
  onNavigateToConversations,
  onNavigateToUnanswered,
  onNavigateToKnowledgeBase,
}) => {
  const [stats, setStats] = useState<AiConversationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await getAiConversationStatsApi();
      setStats(data);
    } catch (err) {
      console.error('Failed to load AI analytics stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="bg-white rounded-[16px] border border-[#e5e5e5] p-16 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-black mx-auto mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-black">
          Compiling AI Observability Analytics...
        </h3>
        <p className="text-xs text-[#5e5e5e] mt-1">
          Aggregating conversation sessions, RAG queries, product recommendations, and customer satisfaction metrics.
        </p>
      </div>
    );
  }

  const intentEntries = Object.entries(stats?.intentBreakdown || {});
  const totalIntentCalls = intentEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-black text-white p-6 md:p-8 rounded-[16px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Telemetry & Observability</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">
            AI Operations & Performance Analytics
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Real-time telemetry measuring customer AI assistant interactions, RAG retrieval accuracy, catalog search hit rates, and user sentiment.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 flex-shrink-0">
          <Button
            variant="secondary"
            onClick={fetchStats}
            className="border-white/30 text-white bg-transparent hover:bg-white hover:text-black rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </Button>

          {onNavigateToConversations && (
            <Button
              variant="primary"
              onClick={onNavigateToConversations}
              className="bg-white text-black hover:bg-gray-100 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <span>View Live Feeds</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[16px] border border-[#e5e5e5] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">
              Total Conversations
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black">
              {stats?.totalConversations ?? 0}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">
              +{stats?.todayConversations ?? 0} today
            </span>
          </div>
          <div className="text-[11px] text-[#5e5e5e]">
            {stats?.activeConversations ?? 0} currently active
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#e5e5e5] shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider block">
            Avg Response Latency
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black">
              {stats?.avgResponseLatencyMs ?? 0}
            </span>
            <span className="text-xs font-semibold text-[#5e5e5e]">ms</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Fast RAG Vector + Search pipeline
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#e5e5e5] shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider block">
            Customer Satisfaction
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black">
              {stats?.satisfactionRate ?? 0}%
            </span>
            <span className="text-xs text-[#5e5e5e]">helpful rating</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#5e5e5e]">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ThumbsUp className="w-3 h-3" /> {stats?.helpfulCount ?? 0}
            </span>
            <span className="flex items-center gap-1 text-rose-600 font-semibold">
              <ThumbsDown className="w-3 h-3" /> {stats?.notHelpfulCount ?? 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#e5e5e5] shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider block">
            Avg Turn Depth
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black">
              {stats?.avgMessagesPerConversation ?? 0}
            </span>
            <span className="text-xs font-semibold text-[#5e5e5e]">msgs/session</span>
          </div>
          <div className="text-[11px] text-[#5e5e5e]">
            {stats?.totalMessages ?? 0} total messages logged
          </div>
        </div>
      </div>

      {/* Secondary Metrics Strip: Actions & Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[16px] border border-[#e5e5e5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider block mb-1">
              RAG Knowledge Queries
            </span>
            <span className="text-2xl font-black text-black">
              {stats?.totalRagQueries ?? 0}
            </span>
            <p className="text-[11px] text-[#5e5e5e] mt-1">
              Document citations generated
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#e5e5e5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider block mb-1">
              Product Searches
            </span>
            <span className="text-2xl font-black text-black">
              {stats?.totalProductSearches ?? 0}
            </span>
            <p className="text-[11px] text-[#5e5e5e] mt-1">
              Catalog matches recommended
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#e5e5e5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider block mb-1">
              Unanswered Inquiries
            </span>
            <span className="text-2xl font-black text-amber-600">
              {stats?.unansweredCount ?? 0}
            </span>
            <p className="text-[11px] text-[#5e5e5e] mt-1">
              Knowledge base gaps detected
            </p>
          </div>
          {onNavigateToUnanswered && (
            <button
              onClick={onNavigateToUnanswered}
              className="text-xs font-bold uppercase tracking-wider text-black underline hover:text-[#5e5e5e]"
            >
              Review Gaps →
            </button>
          )}
        </div>
      </div>

      {/* Two Column Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intent Distribution Breakdown */}
        <div className="bg-white p-6 rounded-[16px] border border-[#e5e5e5] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#f4f4f4]">
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-tight">
                AI Intent Classification Breakdown
              </h3>
              <p className="text-xs text-[#5e5e5e]">
                Distribution of detected customer intent across all turns
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-black" />
          </div>

          <div className="space-y-3.5">
            {intentEntries.length === 0 ? (
              <p className="text-xs text-[#5e5e5e] py-6 text-center">No intent data available yet.</p>
            ) : (
              intentEntries.map(([intentKey, count]) => {
                const percent = totalIntentCalls > 0 ? Math.round((count / totalIntentCalls) * 100) : 0;
                let colorClass = 'bg-black';
                let label = intentKey;
                if (intentKey === 'RAG_QUERY') {
                  colorClass = 'bg-blue-600';
                  label = 'Knowledge Base / RAG Inquiries';
                } else if (intentKey === 'PRODUCT_SEARCH') {
                  colorClass = 'bg-emerald-600';
                  label = 'Product Discovery & Catalog Search';
                } else if (intentKey === 'GREETING') {
                  colorClass = 'bg-neutral-600';
                  label = 'Greetings & Navigation';
                }

                return (
                  <div key={intentKey} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-black">{label}</span>
                      <span className="text-[#5e5e5e] font-mono">
                        {count} turns ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#f4f4f4] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Cited Knowledge Documents */}
        <div className="bg-white p-6 rounded-[16px] border border-[#e5e5e5] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#f4f4f4]">
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-tight">
                Most Cited Knowledge Base Documents
              </h3>
              <p className="text-xs text-[#5e5e5e]">
                Documents frequently retrieved by vector similarity search
              </p>
            </div>
            {onNavigateToKnowledgeBase && (
              <button
                onClick={onNavigateToKnowledgeBase}
                className="text-xs font-bold uppercase tracking-wider text-black underline hover:text-[#5e5e5e]"
              >
                Manage Docs →
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(!stats?.topCitedDocuments || stats.topCitedDocuments.length === 0) ? (
              <p className="text-xs text-[#5e5e5e] py-6 text-center">No document citations recorded yet.</p>
            ) : (
              stats.topCitedDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-[12px] bg-[#f9f9f9] border border-[#f0f0f0]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-black block">{doc.documentName}</span>
                      <span className="text-[10px] text-[#5e5e5e]">Semantic Vector Chunks Indexed</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-black block font-mono">
                      {doc.citations}
                    </span>
                    <span className="text-[10px] text-[#5e5e5e]">citations</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Recommended Catalog Products */}
        <div className="bg-white p-6 rounded-[16px] border border-[#e5e5e5] shadow-xs space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#f4f4f4]">
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-tight">
                Top Products Recommended by AI
              </h3>
              <p className="text-xs text-[#5e5e5e]">
                Products most frequently returned to customers via chat search recommendations
              </p>
            </div>
            <Package className="w-4 h-4 text-black" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(!stats?.topRecommendedProducts || stats.topRecommendedProducts.length === 0) ? (
              <p className="text-xs text-[#5e5e5e] py-6 text-center col-span-3">No product recommendations recorded yet.</p>
            ) : (
              stats.topRecommendedProducts.map((prod, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[12px] bg-[#f9f9f9] border border-[#f0f0f0] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#5e5e5e] uppercase">
                      Rank #{idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-black line-clamp-1">{prod.productName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-black font-mono block">
                      {prod.recommendations}
                    </span>
                    <span className="text-[9px] text-[#5e5e5e] uppercase">shown</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
