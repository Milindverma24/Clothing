const API_BASE = 'http://localhost:8080/api';

export interface CitationSourceItem {
  documentName: string;
  pageNumber: number;
  snippet: string;
}

export interface ChatProductItem {
  id: string | number;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  imageUrl: string;
  gender?: string;
  articleType?: string;
  baseColour?: string;
}

export interface ChatResponseData {
  answer: string;
  sources: CitationSourceItem[];
  products: ChatProductItem[];
  intent: 'KNOWLEDGE' | 'PRODUCT_SEARCH' | 'HYBRID';
  conversationId?: number;
  messageId?: number;
  userMessageId?: number;
  processingTimeMs?: number;
  modelName?: string;
}

export interface KnowledgeDocumentSummary {
  id: number;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  status: 'UPLOADED' | 'PROCESSING' | 'INDEXED' | 'FAILED' | 'DELETING';
  chunkCount: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string | null;
}

/**
 * Send a chat question to the RAG AI Store Assistant
 */
export async function sendChatMessageApi(
  message: string,
  options?: {
    conversationId?: number | null;
    sessionId?: string | null;
    userName?: string;
    userEmail?: string;
    token?: string;
  }
): Promise<ChatResponseData> {
  const token = options?.token || localStorage.getItem('clothing_auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      conversationId: options?.conversationId,
      sessionId: options?.sessionId,
      userName: options?.userName,
      userEmail: options?.userEmail,
    }),
  });

  if (!res.ok) {
    throw new Error(`Chat API request failed: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

function getAdminHeaders(): Record<string, string> {
  const token = localStorage.getItem('clothing_auth_token') || localStorage.getItem('clothing_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Admin: List all knowledge base documents
 */
export async function getKnowledgeDocumentsApi(): Promise<KnowledgeDocumentSummary[]> {
  const res = await fetch(`${API_BASE}/admin/knowledge-base/documents`, {
    headers: getAdminHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch documents: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data || [];
}

/**
 * Admin: Upload a PDF document for RAG ingestion
 */
export async function uploadKnowledgeDocumentApi(file: File): Promise<KnowledgeDocumentSummary> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/admin/knowledge-base/documents`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || `Document upload failed: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Admin: Re-index an existing document
 */
export async function reindexKnowledgeDocumentApi(id: number): Promise<KnowledgeDocumentSummary> {
  const headers = { ...getAdminHeaders(), 'Content-Type': 'application/json' };
  const res = await fetch(`${API_BASE}/admin/knowledge-base/documents/${id}/reindex`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to re-index document: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Admin: Delete a document and its vector chunks
 */
export async function deleteKnowledgeDocumentApi(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/knowledge-base/documents/${id}`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to delete document: ${res.statusText}`);
  }
}
