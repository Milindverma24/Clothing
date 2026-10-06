import { getStoredToken } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

function getAdminHeaders(extraHeaders: Record<string, string> = {}): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface AiSourceItem {
  id: number;
  documentId?: number;
  chunkId?: number;
  documentName: string;
  pageNumber: number;
  similarityScore: number;
  sourceExcerpt?: string;
}

export interface AiProductItem {
  id: number;
  productId: number;
  externalProductId?: number;
  productName: string;
  productSlug?: string;
  relevanceScore?: number;
  price?: number;
  imageUrl?: string;
}

export interface AiMessageItem {
  id: number;
  conversationId: number;
  senderType: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'AGENT';
  content: string;
  intent?: string;
  modelName?: string;
  processingTimeMs?: number;
  tokenUsage?: number;
  errorStatus?: string;
  isHelpful?: boolean | null;
  feedbackComment?: string;
  sequenceNumber: number;
  createdAt: string;
  sources: AiSourceItem[];
  products: AiProductItem[];
}

export interface AiConversationSummary {
  id: number;
  userId?: number | null;
  sessionId: string;
  userName: string;
  userEmail?: string;
  title: string;
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  startedAt: string;
  lastActivityAt: string;
  messageCount: number;
  ragQueriesCount: number;
  productSearchesCount: number;
  hasUnanswered: boolean;
  lastMessageText?: string;
  lastSenderType?: string;
  lastMessageCreatedAt?: string;
  primaryIntent?: string;
}

export interface AiConversationDetail extends AiConversationSummary {
  createdAt: string;
  updatedAt: string;
  messages: AiMessageItem[];
  allSources: AiSourceItem[];
  allProducts: AiProductItem[];
}

export interface AiConversationStats {
  totalConversations: number;
  todayConversations: number;
  activeConversations: number;
  totalMessages: number;
  totalRagQueries: number;
  totalProductSearches: number;
  unansweredCount: number;
  avgMessagesPerConversation: number;
  avgResponseLatencyMs: number;
  helpfulCount: number;
  notHelpfulCount: number;
  satisfactionRate: number;
  intentBreakdown: Record<string, number>;
  topCitedDocuments: Array<{ documentName: string; citations: number }>;
  topRecommendedProducts: Array<{ productName: string; recommendations: number }>;
}

export interface UnansweredQuestionItem {
  id: number;
  conversationId: number;
  userName: string;
  userEmail?: string;
  userQuestion: string;
  aiResponse: string;
  reason: string;
  timestamp: string;
}

export interface ConversationListResponse {
  content: AiConversationSummary[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export async function getAiConversationsApi(params: {
  search?: string;
  status?: string;
  intent?: string;
  dateRange?: string;
  page?: number;
  size?: number;
}): Promise<ConversationListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.intent && params.intent !== 'ALL') query.append('intent', params.intent);
  if (params.dateRange && params.dateRange !== 'ALL') query.append('dateRange', params.dateRange);
  query.append('page', (params.page ?? 0).toString());
  query.append('size', (params.size ?? 20).toString());

  const res = await fetch(`${API_BASE_URL}/admin/ai-conversations?${query.toString()}`, {
    headers: getAdminHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch AI conversations');
  const json = await res.json();
  return json.data;
}

export async function getAiConversationDetailApi(id: number): Promise<AiConversationDetail> {
  const res = await fetch(`${API_BASE_URL}/admin/ai-conversations/${id}`, {
    headers: getAdminHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch conversation details');
  const json = await res.json();
  return json.data;
}

export async function getAiConversationStatsApi(): Promise<AiConversationStats> {
  const res = await fetch(`${API_BASE_URL}/admin/ai-conversations/stats`, {
    headers: getAdminHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch AI conversation statistics');
  const json = await res.json();
  return json.data;
}

export async function getUnansweredQuestionsApi(page = 0, size = 20): Promise<{
  content: UnansweredQuestionItem[];
  totalPages: number;
  totalElements: number;
}> {
  const res = await fetch(`${API_BASE_URL}/admin/ai-conversations/unanswered?page=${page}&size=${size}`, {
    headers: getAdminHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch unanswered questions');
  const json = await res.json();
  return json.data;
}

export async function updateConversationStatusApi(id: number, status: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/ai-conversations/${id}/status?status=${status}`, {
    method: 'PATCH',
    headers: getAdminHeaders(),
  });
  if (!res.ok) throw new Error('Failed to update conversation status');
}

export async function submitChatMessageFeedbackApi(
  messageId: number,
  helpful: boolean,
  comment?: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/chat/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, helpful, comment }),
  });
  if (!res.ok) throw new Error('Failed to submit message feedback');
}

export async function sendAdminReplyApi(
  conversationId: number,
  message: string,
  adminName?: string
): Promise<AiMessageItem> {
  const res = await fetch(`${API_BASE_URL}/admin/ai-conversations/${conversationId}/reply`, {
    method: 'POST',
    headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ message, adminName }),
  });
  if (!res.ok) throw new Error('Failed to send admin reply');
  const json = await res.json();
  return json.data;
}

export async function getCustomerChatHistoryApi(conversationId: number): Promise<AiConversationDetail> {
  const res = await fetch(`${API_BASE_URL}/chat/history/${conversationId}`);
  if (!res.ok) throw new Error('Failed to fetch customer chat history');
  const json = await res.json();
  return json.data;
}

