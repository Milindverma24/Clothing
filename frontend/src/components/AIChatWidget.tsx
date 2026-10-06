import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  getOrderDetail,
  cancelOrder as apiCancelOrder,
  returnOrder as apiReturnOrder,
  type MyOrderDetail
} from '../services/orderApi';
import { queryClient } from '../lib/queryClient';
import { SizeGuideVisual } from './chat/SizeGuideVisual';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

interface RichAction {
  label: string;
  action: string;
  style?: 'primary' | 'destructive' | 'secondary';
}

interface ChatCard {
  card_type: 'PRODUCT' | 'ORDER_STATUS' | 'ORDER_CONFIRMATION' | 'RETURN_CONFIRMATION' | string;
  id?: number | string;
  title: string;
  subtitle?: string;
  price?: number;
  image?: string;
  url?: string;
  slug?: string;
  data?: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  cards?: ChatCard[];
  actions?: RichAction[];
  timestamp: string;
}

const RETURN_REASONS = [
  'Product damaged',
  'Wrong product',
  'Size/fit issue',
  'Product not as expected',
  'Changed my mind',
  'Other',
];

// Helpers for multi-client isolation
function decodeJwtPayload(token: string | null): { sub?: string; email?: string; name?: string } | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    }
  } catch {
    return null;
  }
  return null;
}

function getGuestClientId(): string {
  try {
    let guestId = localStorage.getItem('clothing_guest_client_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('clothing_guest_client_id', guestId);
    }
    return guestId;
  } catch {
    return 'guest_transient';
  }
}

export const AIChatWidget: React.FC = () => {
  const { isCartOpen } = useShop();
  const { authModalOpen } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cancellation & Return interactive prompt state
  const [cancellationPromptOrder, setCancellationPromptOrder] = useState<string | null>(null);
  const [returnPromptOrder, setReturnPromptOrder] = useState<{
    orderId: string;
    returnDeadline?: string;
    daysRemaining?: number;
  } | null>(null);
  const [selectedReturnReason, setSelectedReturnReason] = useState<string>('Size/fit issue');
  const [isActionInProgress, setIsActionInProgress] = useState<boolean>(false);

  // Compute isolated client/user scope key so two clients NEVER share conversations
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('clothing_auth_token') || localStorage.getItem('token') || localStorage.getItem('accessToken') || null;
    } catch {
      return null;
    }
  });

  const clientScopeKey = useMemo(() => {
    const payload = decodeJwtPayload(authToken);
    if (payload?.sub) {
      return `user_${payload.sub}`;
    }
    return getGuestClientId();
  }, [authToken]);

  const welcomeMessage = useMemo<ChatMessage>(() => ({
    id: 'welcome',
    sender: 'agent',
    text: "Hello 👋 Welcome to Nova.\n\nFind something you'll love, check your size, manage your orders, or ask me anything.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }), []);

  // Per-client isolated conversation & message state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);

  // Sync state whenever client changes (e.g., login, switch account, or logout)
  useEffect(() => {
    const checkToken = () => {
      try {
        const cur = localStorage.getItem('clothing_auth_token') || localStorage.getItem('token') || localStorage.getItem('accessToken') || null;
        if (cur !== authToken) setAuthToken(cur);
      } catch {}
    };
    const interval = setInterval(checkToken, 2000);
    return () => clearInterval(interval);
  }, [authToken]);

  // Load client's isolated chat history
  useEffect(() => {
    try {
      const storedConv = localStorage.getItem(`clothing_ai_chat_conv_${clientScopeKey}`);
      const storedMsgs = localStorage.getItem(`clothing_ai_chat_msgs_${clientScopeKey}`);
      if (storedConv) setConversationId(storedConv);
      if (storedMsgs) {
        const parsed = JSON.parse(storedMsgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {}
    setConversationId(null);
    setMessages([welcomeMessage]);
  }, [clientScopeKey, welcomeMessage]);

  // Save client's chat history to scoped storage
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    try {
      localStorage.setItem(`clothing_ai_chat_msgs_${clientScopeKey}`, JSON.stringify(messages));
    } catch {}
  }, [messages, clientScopeKey]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const navigateToProduct = (slugOrId: string | number | undefined) => {
    if (!slugOrId) return;
    window.location.href = `/products/${slugOrId}`;
  };

  const handleResetChat = () => {
    try {
      localStorage.removeItem(`clothing_ai_chat_conv_${clientScopeKey}`);
      localStorage.removeItem(`clothing_ai_chat_msgs_${clientScopeKey}`);
    } catch {}
    setConversationId(null);
    setMessages([welcomeMessage]);
  };

  /**
   * Listen for external 'open-size-guide' events (e.g. from ProductDetailPage)
   */
  useEffect(() => {
    const handleOpenSizeGuide = (e: any) => {
      setIsOpen(true);
      const detail = e.detail;
      if (detail) {
        const { gender, category, name } = detail;
        let query = 'Size guide';
        if (gender && category) {
          query = `${gender} ${category} size guide`;
        } else if (gender) {
          query = `${gender} size guide`;
        } else if (name) {
          query = `${name} size guide`;
        }
        sendMessage(query);
      } else {
        sendMessage('Size guide');
      }
    };
    window.addEventListener('open-size-guide', handleOpenSizeGuide);
    return () => window.removeEventListener('open-size-guide', handleOpenSizeGuide);
  }, []);

  /**
   * Listen for 'clothing-size-selected' events on the product page
   */
  useEffect(() => {
    const handleSizeSelected = (e: any) => {
      const { size, product } = e.detail || {};
      if (!size) return;
      if (isOpen) {
        const checkMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'agent',
          text: `You selected size **${size}**${product?.name ? ` for *${product.name}*` : ''}.\n\nWould you like to check whether **${size}** is the right fit?`,
          actions: [
            { label: `Check Size ${size}`, action: 'FIND_MY_SIZE', style: 'primary' },
            { label: 'View Size Guide', action: product?.gender ? `${product.gender} size guide` : 'Size guide', style: 'secondary' }
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, checkMsg]);
      }
    };
    window.addEventListener('clothing-size-selected', handleSizeSelected);
    return () => window.removeEventListener('clothing-size-selected', handleSizeSelected);
  }, [isOpen]);

  /**
   * 3. SHOW ORDER: Always fetch fresh, live state directly from Spring Boot / PostgreSQL.
   * Never displays stale cached state. Invalidates and updates TanStack Query.
   */
  const handleShowOrder = async (orderId: string | number) => {
    const cleanId = String(orderId).trim();
    if (!cleanId) return;

    setIsLoading(true);
    try {
      // Refresh cache
      queryClient.invalidateQueries({ queryKey: ['order', cleanId] });
      queryClient.invalidateQueries({ queryKey: ['order-actions', cleanId] });

      const detail: MyOrderDetail = await getOrderDetail(cleanId);

      // Store fresh live data in TanStack Query
      queryClient.setQueryData(['order', detail.orderId], detail);
      queryClient.setQueryData(['order', String(detail.id)], detail);

      const ordNum = detail.orderId || `ORD-${detail.id}`;
      const isCancelled = detail.status === 'CANCELLED';

      // Dynamic action buttons from backend
      const dynamicActions: RichAction[] = [];
      const avail = detail.availableActions || [];

      if ((avail.includes('TRACK_ORDER') || ['SHIPPED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY'].includes(detail.status)) && !isCancelled) {
        dynamicActions.push({ label: '🚚 Track Order', action: `TRACK_${ordNum}`, style: 'primary' });
      }

      if (avail.includes('CANCEL_ORDER') || detail.cancellation?.eligible) {
        dynamicActions.push({ label: '❌ Cancel Order', action: `CANCEL_${ordNum}`, style: 'destructive' });
      }

      if (avail.includes('RETURN_ORDER') || detail.returnInfo?.eligible) {
        dynamicActions.push({ label: '📦 Return Order', action: `RETURN_${ordNum}`, style: 'primary' });
      }

      dynamicActions.push({ label: '🔍 Show Order', action: `SHOW_ORDER_${ordNum}`, style: 'secondary' });
      dynamicActions.push({ label: '💬 Contact Support', action: 'HUMAN_SUPPORT', style: 'secondary' });

      // Formatted text lines
      const dateStr = detail.orderDate
        ? new Date(detail.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Recent';

      const lines = [
        `📋 **Order #${ordNum}** Details:`,
        `• **Order Date:** ${dateStr}`,
        `• **Status:** **${detail.status}**`,
        `• **Total:** ₹${detail.total.toLocaleString('en-IN')}`
      ];

      if (detail.tracking?.available && detail.tracking.trackingNumber) {
        lines.push(`• **Carrier:** ${detail.tracking.carrier || 'Express Express'} (${detail.tracking.trackingNumber})`);
        if (detail.tracking.estimatedDeliveryDate) {
          lines.push(`• **Expected Delivery:** ${detail.tracking.estimatedDeliveryDate}`);
        }
      }

      if (detail.cancellation?.status && detail.cancellation.status !== 'NONE') {
        lines.push(`• **Cancellation:** **${detail.cancellation.status}**`);
      }

      if (detail.returnInfo?.eligible) {
        lines.push(`• **Return:** Eligible — **${detail.returnInfo.daysRemaining || 0} days remaining** (Window valid for 14 days from purchase)`);
      } else if (detail.returnInfo?.status && detail.returnInfo.status !== 'NONE') {
        lines.push(`• **Return Status:** **${detail.returnInfo.status}**`);
        if (detail.returnInfo.refundStatus) {
          lines.push(`• **Refund Status:** **${detail.returnInfo.refundStatus}**`);
        }
      }

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: lines.join('\n'),
        cards: [
          {
            card_type: 'ORDER_STATUS',
            id: detail.id,
            title: `Order #${ordNum}`,
            subtitle: detail.status,
            price: detail.total,
            data: detail
          }
        ],
        actions: dynamicActions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: err.message || `Unable to load order #${cleanId}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 5. CANCEL ORDER: Performs transactional cancellation via Spring Boot and updates PostgreSQL.
   */
  /**
   * 5. CANCEL ORDER: Performs transactional cancellation via Spring Boot and updates PostgreSQL.
   */
  const handleConfirmCancellation = async (orderId: string) => {
    // 1. Immediately dismiss modal so it vanishes instantly
    setCancellationPromptOrder(null);
    setIsActionInProgress(true);

    const cleanOrdId = String(orderId).trim();
    const ordNum = cleanOrdId.startsWith('ORD-') ? cleanOrdId : `ORD-${cleanOrdId}`;

    // 2. Remove cancellation & return action buttons immediately from all messages
    setMessages((prev) =>
      prev.map((msg) => {
        let updatedCards = msg.cards;
        let updatedActions = msg.actions;
        if (msg.cards) {
          updatedCards = msg.cards.map((card) => {
            const cardRef = String(card.data?.orderNumber || card.data?.orderId || card.id);
            if (cardRef === cleanOrdId || cardRef === ordNum || String(card.id) === cleanOrdId) {
              return {
                ...card,
                subtitle: 'CANCELLED',
                data: {
                  ...card.data,
                  status: 'CANCELLED',
                  cancellation: {
                    ...card.data?.cancellation,
                    eligible: false,
                    status: 'COMPLETED'
                  },
                  returnInfo: {
                    ...card.data?.returnInfo,
                    eligible: false
                  }
                }
              };
            }
            return card;
          });
        }
        if (msg.actions) {
          updatedActions = msg.actions.filter(
            (act) => !act.action.includes(cleanOrdId) && !act.action.includes(ordNum)
          );
        }
        return { ...msg, cards: updatedCards, actions: updatedActions };
      })
    );

    try {
      const res = await apiCancelOrder(orderId, 'Changed my mind');

      // TanStack Query invalidation
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['trackable-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-actions', orderId] });

      const resolvedOrdNum = res.orderId || ordNum;
      const updatedOrder = res.order;

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: `Your order **#${resolvedOrdNum}** has been cancelled successfully.\n\n• **Status:** **CANCELLED**\n• **Cancellation:** **COMPLETED**\n• **Refund:** Initiated to original payment method.`,
        cards: updatedOrder ? [
          {
            card_type: 'ORDER_STATUS',
            id: updatedOrder.id,
            title: `Order #${resolvedOrdNum}`,
            subtitle: 'CANCELLED',
            price: updatedOrder.total,
            data: updatedOrder
          }
        ] : [],
        actions: [
          { label: '🔍 Show Order', action: `SHOW_ORDER_${resolvedOrdNum}`, style: 'secondary' },
          { label: '💬 Contact Support', action: 'HUMAN_SUPPORT', style: 'secondary' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `Cancellation failed: ${err.message || 'Please contact customer support.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsActionInProgress(false);
    }
  };

  /**
   * 9. RETURN ORDER: Submits return request via Spring Boot within 14-day order-date window.
   */
  const handleConfirmReturn = async (orderId: string, reason: string) => {
    // 1. Immediately dismiss modal so it vanishes instantly
    setReturnPromptOrder(null);
    setIsActionInProgress(true);

    const cleanOrdId = String(orderId).trim();
    const ordNum = cleanOrdId.startsWith('ORD-') ? cleanOrdId : `ORD-${cleanOrdId}`;

    // 2. Remove return & cancel buttons immediately from all messages
    setMessages((prev) =>
      prev.map((msg) => {
        let updatedCards = msg.cards;
        let updatedActions = msg.actions;
        if (msg.cards) {
          updatedCards = msg.cards.map((card) => {
            const cardRef = String(card.data?.orderNumber || card.data?.orderId || card.id);
            if (cardRef === cleanOrdId || cardRef === ordNum || String(card.id) === cleanOrdId) {
              return {
                ...card,
                subtitle: 'RETURN_REQUESTED',
                data: {
                  ...card.data,
                  status: 'RETURN_REQUESTED',
                  returnInfo: {
                    ...card.data?.returnInfo,
                    eligible: false,
                    status: 'REQUESTED'
                  },
                  cancellation: {
                    ...card.data?.cancellation,
                    eligible: false
                  }
                }
              };
            }
            return card;
          });
        }
        if (msg.actions) {
          updatedActions = msg.actions.filter(
            (act) => !act.action.includes(cleanOrdId) && !act.action.includes(ordNum)
          );
        }
        return { ...msg, cards: updatedCards, actions: updatedActions };
      })
    );

    try {
      const res = await apiReturnOrder(orderId, { reason });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['trackable-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-actions', orderId] });

      const resolvedOrdNum = res.orderId || ordNum;
      const updatedOrder = res.order;
      const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: `Your return request has been submitted successfully.\n\n• **Return Status:** **REQUESTED**\n• **Order Status:** **RETURN_REQUESTED**\n• **Return Requested:** ${todayStr}\n• **Refund Status:** **PENDING**\n• **Reason:** ${reason}`,
        cards: updatedOrder ? [
          {
            card_type: 'ORDER_STATUS',
            id: updatedOrder.id,
            title: `Order #${resolvedOrdNum}`,
            subtitle: 'RETURN_REQUESTED',
            price: updatedOrder.total,
            data: updatedOrder
          }
        ] : [],
        actions: [
          { label: '🔍 Show Order', action: `SHOW_ORDER_${resolvedOrdNum}`, style: 'secondary' },
          { label: '💬 Contact Support', action: 'HUMAN_SUPPORT', style: 'secondary' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `Return request failed: ${err.message || 'Please contact customer support.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleActionClick = (act: RichAction) => {
    if (act.action === 'LOGIN' || act.label.toLowerCase().includes('sign in')) {
      window.location.href = '/login';
      return;
    }
    if (act.action.startsWith('SHOW_ORDER_')) {
      const ref = act.action.replace('SHOW_ORDER_', '');
      handleShowOrder(ref);
      return;
    }
    if (act.action.startsWith('CANCEL_')) {
      const ref = act.action.replace('CANCEL_', '');
      setCancellationPromptOrder(ref);
      return;
    }
    if (act.action.startsWith('RETURN_')) {
      const ref = act.action.replace('RETURN_', '');
      if (ref && ref !== 'POLICY' && ref !== 'ORDER') {
        setReturnPromptOrder({
          orderId: ref,
          daysRemaining: 14,
          returnDeadline: new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        });
        return;
      }
      sendMessage('Track order');
      return;
    }
    if (act.action.startsWith('TRACK_')) {
      const ref = act.action.replace('TRACK_', '');
      handleShowOrder(ref);
      return;
    }
    if (act.action?.startsWith('SELECT_SIZE_')) {
      const sz = act.action.replace('SELECT_SIZE_', '');
      window.dispatchEvent(new CustomEvent('clothing-select-size', { detail: { size: sz } }));
      sendMessage(`Select ${sz}`);
      return;
    }
    if (act.action === 'FIND_MY_SIZE') {
      sendMessage('Find My Size');
      return;
    }
    if (act.action === 'SWITCH_TO_WOMEN') {
      sendMessage('Women / Girls');
      return;
    }
    if (act.action === 'SWITCH_TO_MEN') {
      sendMessage('Men / Boys');
      return;
    }
    if (act.action === 'SIZE_CHANGE_CAT') {
      sendMessage('Change category');
      return;
    }
    if (act.action === 'VIEW_SIZE_CHART') {
      sendMessage('Show size chart');
      return;
    }
    if (act.action?.startsWith('MEASURE_')) {
      const parts = act.action.replace('MEASURE_', '').toLowerCase().split('_');
      if (parts.length >= 2) {
        const type = parts[0];
        const val = parts[1];
        sendMessage(`My ${type} is ${val} inches`);
        return;
      }
    }
    sendMessage(act.label);
  };

  // Helper to cleanly render inline markdown (bold text, etc.)
  const renderInlineMarkdown = (raw: string) => {
    if (!raw) return null;
    const parts = raw.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-neutral-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Helper to cleanly render formatted text (bold, lists, and markdown tables)
  const renderFormattedText = (text: string) => {
    if (!text) return null;

    const rawLines = text.split('\n');
    const blocks: { type: 'table' | 'lines'; lines: string[] }[] = [];
    let currentTable: string[] = [];
    let currentLines: string[] = [];

    const flushLines = () => {
      if (currentLines.length > 0) {
        blocks.push({ type: 'lines', lines: [...currentLines] });
        currentLines = [];
      }
    };
    const flushTable = () => {
      if (currentTable.length > 0) {
        blocks.push({ type: 'table', lines: [...currentTable] });
        currentTable = [];
      }
    };

    rawLines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushLines();
        currentTable.push(trimmed);
      } else {
        flushTable();
        currentLines.push(line);
      }
    });
    flushLines();
    flushTable();

    return (
      <div className="space-y-2 leading-relaxed">
        {blocks.map((block, bIdx) => {
          if (block.type === 'table') {
            if (block.lines.length < 2) return null;
            const parseRow = (r: string) =>
              r
                .split('|')
                .slice(1, -1)
                .map((c) => c.trim());

            const headers = parseRow(block.lines[0]);
            const isSep = (r: string) => /^[|\s-:]+$/.test(r);
            const contentRows = block.lines.slice(1).filter((r) => !isSep(r)).map(parseRow);

            return (
              <div
                key={bIdx}
                className="overflow-x-auto my-2 rounded-xl border border-neutral-200 bg-white shadow-2xs"
              >
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-neutral-100/90 border-b border-neutral-200 text-neutral-900 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3 py-2 whitespace-nowrap">
                          {renderInlineMarkdown(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {contentRows.map((rowCells, rIdx) => {
                      const isRec = rowCells.some((c) => c.toLowerCase().includes('recommended'));
                      return (
                        <tr
                          key={rIdx}
                          className={`transition-colors ${
                            isRec
                              ? 'bg-neutral-100 font-bold text-black border-l-2 border-l-black'
                              : rIdx % 2 === 1
                              ? 'bg-neutral-50/50 hover:bg-neutral-100/40'
                              : 'bg-white hover:bg-neutral-50/60'
                          }`}
                        >
                          {rowCells.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap">
                              {renderInlineMarkdown(cell)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }

          return (
            <div key={bIdx} className="space-y-1.5">
              {block.lines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={lIdx} className="h-1" />;

                // Section Headers
                if (trimmed.startsWith('### ')) {
                  return (
                    <h5 key={lIdx} className="font-bold text-neutral-900 text-xs pt-1 uppercase tracking-wider">
                      {trimmed.replace(/^###\s+/, '')}
                    </h5>
                  );
                }

                const isBullet =
                  trimmed.startsWith('•') ||
                  trimmed.startsWith('-') ||
                  trimmed.startsWith('* ') ||
                  /^\d+\./.test(trimmed);
                const cleanLine = isBullet ? trimmed.replace(/^(?:[•\-\*]|\d+\.|\.)\s*/, '') : trimmed;

                if (isBullet) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-1 text-neutral-800">
                      <span className="text-neutral-400 font-bold select-none">•</span>
                      <span className="flex-1">{renderInlineMarkdown(cleanLine)}</span>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="text-neutral-800">
                    {renderInlineMarkdown(cleanLine)}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const sendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading) return;

    if (!textToSend) setInput('');

    // Fast-path for explicit Show Order phrasing
    const showMatch = messageText.match(/^(?:show\s+order\s*#?|SHOW_ORDER_)(ORD-[A-Z0-9]+|\d+)/i);
    if (showMatch) {
      const targetId = showMatch[1];
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        text: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, userMsg]);
      handleShowOrder(targetId);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('clothing_auth_token') || localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
      const agentUrl = import.meta.env.VITE_AI_AGENT_URL || 'http://localhost:8001';

      const response = await fetch(`${agentUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: messageText,
          conversation_id: conversationId,
          session_id: clientScopeKey
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error?.message || errJson?.message || errJson?.detail;
        if (errMsg) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'agent',
              text: errMsg,
              actions: errMsg.toLowerCase().includes('sign in')
                ? [{ label: 'Sign In / Register', action: 'LOGIN', style: 'primary' }]
                : [],
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          return;
        }
        throw new Error('Network response failed');
      }

      const data = await response.json();
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
        try {
          localStorage.setItem(`clothing_ai_chat_conv_${clientScopeKey}`, data.conversation_id);
        } catch {}
      }

      let parsedCards: ChatCard[] = [];
      if (Array.isArray(data.cards) && data.cards.length > 0) {
        parsedCards = data.cards;
      } else if (Array.isArray(data.products) && data.products.length > 0) {
        parsedCards = data.products.map((p: any) => ({
          card_type: 'PRODUCT',
          id: p.id,
          title: p.name,
          subtitle: `₹${(p.basePrice || 0).toLocaleString('en-IN')}${p.baseColour ? ` • ${p.baseColour}` : ''}`,
          price: p.basePrice,
          image: p.imageUrl || `/images/${p.id}.jpg`,
          url: `/products/${p.slug || p.id}`,
          slug: p.slug || p.id,
          data: p
        }));
      }

      if (data.order && !parsedCards.some((c) => c.card_type === 'ORDER_STATUS')) {
        parsedCards.push({
          card_type: 'ORDER_STATUS',
          id: data.order.id,
          title: `Order #${data.order.orderNumber || data.order.id}`,
          subtitle: data.order.status,
          data: data.order
        });
      }

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: data.message,
        cards: parsedCards,
        actions: data.actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: 'I could not connect to the assistant service right now. Please ensure the backend and AI microservice are running.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickSuggestions = [
    {
      id: 'search',
      icon: '↗',
      label: 'Search Products',
      prompt: 'Search products',
      desc: 'Discover contemporary garments & essentials'
    },
    {
      id: 'track',
      icon: '📦',
      label: 'Track Order',
      prompt: 'Track order',
      desc: 'Check live status for your active orders'
    },
    {
      id: 'size',
      icon: '📏',
      label: 'Size Guide',
      prompt: 'Size guide',
      desc: 'Interactive charts & Find My Size fit recommendations'
    },
    {
      id: 'cart',
      icon: '🛍️',
      label: 'My Cart',
      prompt: 'Show my cart',
      desc: 'View cart items, quantities & order subtotal'
    },
    {
      id: 'wishlist',
      icon: '🤍',
      label: 'Wishlist',
      prompt: 'Show my wishlist',
      desc: 'View and manage your saved garments'
    },
    {
      id: 'recommendations',
      icon: '✨',
      label: 'Recommendations',
      prompt: 'Show recommendations',
      desc: 'Curated apparel styles selected for you'
    }
  ];

  const isInitialState = messages.length <= 1;

  // Prevent floating button from overlapping CartDrawer Checkout CTA or Auth Modal
  if (!isOpen && (isCartOpen || authModalOpen)) {
    return null;
  }

  return (
    <div className={`fixed ${isOpen ? 'bottom-4 right-4 sm:bottom-6 sm:right-6 z-50' : 'bottom-6 right-6 z-40'} font-sans`}>
      {/* Floating Trigger Button (56px x 56px, right: 24px, bottom: 24px) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-neutral-800 transition-all transform hover:scale-105 cursor-pointer border border-neutral-800 relative group"
          aria-label="Nova AI Assistant"
          title="Nova AI Assistant"
        >
          <span className="text-xl">💬</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute top-3.5 right-3.5 ring-2 ring-black animate-pulse"></span>
          <span className="sr-only">Nova AI Assistant</span>
        </button>
      )}

      {/* Expanded Chat Window (400px–440px wide, 600px–720px height) */}
      {isOpen && (
        <div className="w-[420px] max-w-[calc(100vw-32px)] h-[660px] max-h-[calc(100vh-80px)] bg-white border border-neutral-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 relative">
          
          {/* Header */}
          <div className="bg-black text-white px-4 py-3.5 flex justify-between items-center border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div className="flex items-center gap-2">
                <img
                  src="/nova-calligraphy-white.png"
                  srcSet="/nova-calligraphy-white.png 1x, /nova-calligraphy-white@2x.png 2x"
                  alt="Nova"
                  className="h-5 w-auto object-contain"
                />
                <span className="text-xs text-neutral-300 font-medium tracking-tight">AI Concierge</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetChat}
                title="Start a fresh conversation"
                className="text-neutral-400 hover:text-white transition p-1.5 rounded-full hover:bg-neutral-800 text-xs cursor-pointer flex items-center gap-1"
                aria-label="New Conversation"
              >
                <span>↺</span>
                <span className="text-[10px] hidden sm:inline">New</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-white transition p-1.5 rounded-full hover:bg-neutral-800 text-sm cursor-pointer ml-0.5"
                aria-label="Close Assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-neutral-50/60 text-sm">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-2xl max-w-[92%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-black text-white rounded-br-none shadow-sm'
                      : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-none shadow-xs'
                  }`}
                >
                  {/* Clean Formatted Text */}
                  {m.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  ) : (
                    renderFormattedText(m.text)
                  )}

                  {/* Render Product Cards with Photos and Click Navigation */}
                  {m.cards && m.cards.length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      {m.cards.map((c, idx) => (
                        <div key={idx}>
                          {c.card_type === 'PRODUCT' && (
                            <div
                              onClick={() => navigateToProduct(c.slug || c.data?.slug || c.id || c.data?.id)}
                              className="group flex gap-3 p-2.5 bg-white hover:bg-neutral-50 rounded-2xl border border-neutral-200 transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-neutral-300"
                              title={`Click to view ${c.title} on website`}
                            >
                              <div className="w-16 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200 relative">
                                <img
                                  src={c.image || (c.data?.id ? `/images/${c.data.id}.jpg` : '/shirt.png')}
                                  alt={c.title}
                                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300';
                                  }}
                                />
                              </div>
                              <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                                <div>
                                  <p className="font-semibold text-neutral-900 text-xs truncate group-hover:text-black leading-snug">
                                    {c.title}
                                  </p>
                                  <p className="text-[11px] text-neutral-600 font-medium mt-0.5">
                                    {c.subtitle || (c.price ? `₹${Number(c.price).toLocaleString('en-IN')}` : '')}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-100">
                                  <span className="text-[10px] text-neutral-700 font-medium group-hover:text-black flex items-center gap-1">
                                    View Product ↗
                                  </span>
                                  <span className="text-[10px] bg-black hover:bg-neutral-800 text-white px-2.5 py-1 rounded-full transition font-medium">
                                    Open
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. ORDER CARD: Section 2 specification with live status, snapshot image, quantity, expected delivery, and Show Order button */}
                          {c.card_type === 'ORDER_STATUS' && (
                            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 text-xs shadow-xs space-y-2.5">
                              {/* Order Header */}
                              <div className="flex justify-between items-center font-medium">
                                <span className="text-neutral-900 font-bold text-xs">
                                  {c.title?.startsWith('Order #') ? c.title : `Order #${c.data?.orderNumber || c.data?.orderId || c.id}`}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    c.subtitle === 'DELIVERED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : c.subtitle === 'CONFIRMED' || c.subtitle === 'PROCESSING'
                                      ? 'bg-blue-100 text-blue-800'
                                      : c.subtitle === 'SHIPPED' || c.subtitle === 'OUT_FOR_DELIVERY'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : c.subtitle === 'RETURN_REQUESTED' || c.subtitle === 'REQUESTED'
                                      ? 'bg-amber-100 text-amber-800'
                                      : c.subtitle === 'CANCELLED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-neutral-100 text-neutral-800'
                                  }`}
                                >
                                  {c.subtitle || c.data?.status || 'CONFIRMED'}
                                </span>
                              </div>

                              {/* Snapshot Items List */}
                              {c.data?.items && Array.isArray(c.data.items) && c.data.items.length > 0 && (
                                <div className="space-y-1.5 pt-1 border-t border-neutral-100">
                                  {c.data.items.map((it: any, iIdx: number) => (
                                    <div key={iIdx} className="flex items-center gap-2.5 text-[11px]">
                                      <div className="w-10 h-11 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200">
                                        <img
                                          src={
                                            it.productImageUrlSnapshot ||
                                            it.imageUrl ||
                                            it.image ||
                                            (it.productId ? `/images/${it.productId}.jpg` : '/shirt.png')
                                          }
                                          alt={it.productName || 'Garment'}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100';
                                          }}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-neutral-800 truncate">{it.productName || it.name || 'Garment Item'}</p>
                                        <p className="text-[10px] text-neutral-500">Qty: {it.quantity || 1}{it.size ? ` • Size: ${it.size}` : ''}</p>
                                      </div>
                                      <span className="font-semibold text-neutral-900 text-[11px]">
                                        ₹{Number(it.price || it.finalPrice || it.unitPrice || 0).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Price & Delivery Details */}
                              <div className="p-2.5 bg-neutral-50 rounded-xl space-y-1 border border-neutral-100 text-[11px]">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-500">Total Amount:</span>
                                  <strong className="text-neutral-900 font-bold text-xs">
                                    ₹{Number(c.data?.total || c.data?.totalAmount || c.price || 0).toLocaleString('en-IN')}
                                  </strong>
                                </div>

                                {c.data?.tracking?.estimatedDeliveryDate && (
                                  <div className="flex justify-between items-center text-neutral-600">
                                    <span>Expected Delivery:</span>
                                    <span className="font-medium text-neutral-900">{c.data.tracking.estimatedDeliveryDate}</span>
                                  </div>
                                )}

                                {c.data?.tracking?.trackingNumber && (
                                  <div className="flex justify-between items-center text-neutral-600">
                                    <span>Tracking:</span>
                                    <code className="font-mono text-neutral-900">{c.data.tracking.carrier || 'BlueDart'}: {c.data.tracking.trackingNumber}</code>
                                  </div>
                                )}

                                {c.data?.returnInfo?.eligible && (
                                  <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md mt-1">
                                    <span>Return Eligible:</span>
                                    <span className="font-semibold">{c.data.returnInfo.daysRemaining || 0} days remaining</span>
                                  </div>
                                )}

                                {c.data?.cancellation?.status && c.data.cancellation.status !== 'NONE' && (
                                  <div className="flex justify-between items-center text-rose-700 bg-rose-50 px-2 py-1 rounded-md mt-1">
                                    <span>Cancellation:</span>
                                    <span className="font-semibold">{c.data.cancellation.status}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Footer with [Show Order] Button */}
                              <div className="pt-1.5 border-t border-neutral-100 flex flex-wrap gap-1.5 items-center">
                                <button
                                  onClick={() => handleShowOrder(c.data?.orderNumber || c.data?.orderId || c.id)}
                                  className="flex-1 bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-full font-medium text-[11px] transition text-center cursor-pointer shadow-xs active:scale-95"
                                >
                                  🔍 Show Order
                                </button>

                                {c.data?.cancellation?.eligible && c.subtitle !== 'CANCELLED' && c.data?.status !== 'CANCELLED' && (
                                  <button
                                    onClick={() => setCancellationPromptOrder(c.data?.orderNumber || c.data?.orderId || String(c.id))}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-full font-medium text-[11px] transition text-center cursor-pointer active:scale-95"
                                  >
                                    Cancel Order
                                  </button>
                                )}

                                {c.data?.returnInfo?.eligible && c.subtitle !== 'RETURN_REQUESTED' && c.data?.status !== 'RETURN_REQUESTED' && c.subtitle !== 'CANCELLED' && c.data?.status !== 'CANCELLED' && (
                                  <button
                                    onClick={() => setReturnPromptOrder({
                                      orderId: c.data?.orderNumber || c.data?.orderId || String(c.id),
                                      daysRemaining: c.data.returnInfo.daysRemaining,
                                      returnDeadline: c.data.returnInfo.returnDeadline
                                    })}
                                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-1.5 rounded-full font-medium text-[11px] transition text-center cursor-pointer active:scale-95"
                                  >
                                    Return Order
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {c.card_type === 'ORDER_CONFIRMATION' && (
                            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 text-xs shadow-xs space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-neutral-900">{c.title}</span>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  CONFIRMED
                                </span>
                              </div>
                              <p className="text-neutral-600 font-medium">{c.subtitle}</p>
                              {c.price && (
                                <p className="text-neutral-900 font-bold text-sm">
                                  ₹{Number(c.price).toLocaleString('en-IN')}
                                </p>
                              )}
                              <button
                                onClick={() => handleShowOrder(c.id || c.data?.orderNumber || '')}
                                className="block text-center w-full bg-black hover:bg-neutral-800 text-white py-2 rounded-full font-medium text-[11px] transition cursor-pointer"
                              >
                                Show Live Order Details →
                              </button>
                            </div>
                          )}

                          {c.card_type === 'RETURN_CONFIRMATION' && (
                            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 text-xs shadow-xs space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-neutral-900">{c.title}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                                  REQUESTED
                                </span>
                              </div>
                              <p className="text-neutral-600 text-[11px]">
                                Your return request is submitted. Courier pickup will be scheduled.
                              </p>
                              <button
                                onClick={() => handleShowOrder(c.id || c.data?.orderNumber || '')}
                                className="block text-center w-full bg-black hover:bg-neutral-800 text-white py-1.5 rounded-full font-medium text-[11px] transition cursor-pointer"
                              >
                                🔍 Show Order
                              </button>
                            </div>
                          )}

                          {/* 18. VISUAL SIZE CHART CARD: Interactive SVG body silhouette, unit toggle, table from PostgreSQL/Spring Boot */}
                          {c.card_type === 'SIZE_CHART' && c.data && (
                            <SizeGuideVisual
                              chart={c.data}
                              highlightSize={c.data?.highlightSize || (c as any).highlight_size}
                              onSelectSize={(sz) => {
                                window.dispatchEvent(new CustomEvent('clothing-select-size', { detail: { size: sz } }));
                                sendMessage(`Select ${sz}`);
                              }}
                              onFindMySizeClick={() => {
                                sendMessage('Find My Size');
                              }}
                              onSendMessage={(txt) => {
                                sendMessage(txt);
                              }}
                            />
                          )}

                          {/* 19. SIZE RECOMMENDATION CARD: Authoritative backend calculation with disclaimer & select CTA */}
                          {c.card_type === 'SIZE_RECOMMENDATION' && (
                            <div className="bg-white p-4 rounded-2xl border-2 border-black text-xs shadow-sm space-y-3 animate-in fade-in">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                                    ✓
                                  </span>
                                  <div>
                                    <span className="font-bold text-neutral-900 text-sm">
                                      Recommended: <span className="underline decoration-2">{c.data?.recommendedSize || 'M'}</span>
                                    </span>
                                    <p className="text-[10px] text-neutral-500 font-medium">
                                      {c.data?.chartName || 'Size Guide'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-300">
                                  {c.data?.fit || 'Regular Fit'}
                                </span>
                              </div>

                              {/* Matched measurements breakdown */}
                              {c.data?.matchedMeasurements && Object.keys(c.data.matchedMeasurements).length > 0 && (
                                <div className="p-3 bg-neutral-50 rounded-xl space-y-2 border border-neutral-100">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                    Measurement Comparison
                                  </p>
                                  {Object.entries(c.data.matchedMeasurements).map(([measName, info]: [string, any]) => (
                                    <div key={measName} className="flex justify-between items-center text-[11px]">
                                      <span className="text-neutral-600 capitalize font-medium">{measName}:</span>
                                      <div className="text-right">
                                        <span className="font-bold text-neutral-900">{info.formatted || `${info.min}-${info.max}"`}</span>
                                        <span className="text-neutral-500 text-[10px] ml-1.5">
                                          (Your meas: {info.user}{info.unit === 'CM' ? 'cm' : '"'})
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <p className="text-[10px] text-neutral-500 italic leading-snug">
                                Size recommendations are based on the available size chart. Fit can vary by product, brand, and style.
                              </p>

                              {/* Embedded Size Guide Visual if provided and not already rendered as separate card */}
                              {c.data?.sizeChart && !m.cards?.some((other) => other !== c && other.card_type === 'SIZE_CHART') && (
                                <div className="pt-2 border-t border-neutral-100">
                                  <SizeGuideVisual
                                    chart={c.data.sizeChart}
                                    highlightSize={c.data?.recommendedSize}
                                    onSelectSize={(sz) => {
                                      window.dispatchEvent(new CustomEvent('clothing-select-size', { detail: { size: sz } }));
                                      sendMessage(`Select ${sz}`);
                                    }}
                                    onFindMySizeClick={() => {
                                      sendMessage('Find My Size');
                                    }}
                                    onSendMessage={(txt) => {
                                      sendMessage(txt);
                                    }}
                                  />
                                </div>
                              )}

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => {
                                    const sz = c.data?.recommendedSize || 'M';
                                    window.dispatchEvent(new CustomEvent('clothing-select-size', { detail: { size: sz } }));
                                    sendMessage(`Select ${sz}`);
                                  }}
                                  className="flex-1 bg-black hover:bg-neutral-800 text-white py-2 rounded-full font-bold text-xs transition cursor-pointer active:scale-95 text-center shadow-xs"
                                >
                                  Select Size {c.data?.recommendedSize || 'M'}
                                </button>
                                <button
                                  onClick={() => sendMessage('Show size chart')}
                                  className="px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-2 rounded-full font-medium text-xs transition cursor-pointer active:scale-95"
                                >
                                  Full Chart
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Interactive Action / Confirmation Buttons with modern Pill styling */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.actions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(act)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer active:scale-95 shadow-2xs ${
                            act.style === 'primary' || act.action?.startsWith('TRACK_') || act.action?.startsWith('SHOW_')
                              ? 'bg-black text-white hover:bg-neutral-800 border border-black'
                              : act.style === 'destructive' || act.action?.startsWith('CANCEL_')
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-100 hover:border-black'
                          }`}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {/* Empty/Welcome State Cards */}
            {isInitialState && (
              <div className="pt-2 pb-1 space-y-2 animate-in fade-in duration-300">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Suggested Actions
                  </span>
                  <span className="text-[10px] text-neutral-400">Tap to ask</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickSuggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => sendMessage(s.prompt)}
                      className="group p-2.5 bg-white hover:bg-black rounded-2xl border border-neutral-200 hover:border-black text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm group-hover:scale-110 transition-transform">{s.icon}</span>
                        <p className="font-semibold text-xs text-neutral-900 group-hover:text-white transition-colors">
                          {s.label}
                        </p>
                      </div>
                      <p className="text-[10px] text-neutral-500 group-hover:text-neutral-300 line-clamp-2 transition-colors leading-tight">
                        {s.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-1.5 p-2.5 bg-[#F7F7F7] rounded-2xl border border-[#E7E7E7] max-w-[80px] shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-bounce delay-300"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 5. CANCEL ORDER CONFIRMATION MODAL */}
          {cancellationPromptOrder && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-3xl p-5 shadow-2xl border border-neutral-200 w-full max-w-[340px] space-y-3.5 text-center">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl">
                  ⚠️
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">Cancel Order #{cancellationPromptOrder}?</h4>
                  <p className="text-neutral-500 text-xs mt-1">
                    Are you sure you want to cancel order {cancellationPromptOrder}? This action will immediately release reserved inventory and trigger a refund.
                  </p>
                </div>
                <div className="space-y-2 pt-1">
                  <button
                    disabled={isActionInProgress}
                    onClick={() => handleConfirmCancellation(cancellationPromptOrder)}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-full text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isActionInProgress ? 'Cancelling on Backend...' : 'Confirm Cancellation'}
                  </button>
                  <button
                    disabled={isActionInProgress}
                    onClick={() => setCancellationPromptOrder(null)}
                    className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 15. RETURN REASON & CONFIRMATION MODAL */}
          {returnPromptOrder && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-3xl p-5 shadow-2xl border border-neutral-200 w-full max-w-[350px] space-y-3.5 text-left">
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">Return Order #{returnPromptOrder.orderId}</h4>
                  <p className="text-emerald-700 font-medium text-xs mt-0.5">
                    Your return window is valid until {returnPromptOrder.returnDeadline || '14 days from purchase'}.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-neutral-700">Select reason for return:</label>
                  <select
                    value={selectedReturnReason}
                    onChange={(e) => setSelectedReturnReason(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs bg-white text-neutral-900 focus:outline-none focus:border-black"
                  >
                    {RETURN_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600">
                  Confirm return request for Order {returnPromptOrder.orderId}?
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    disabled={isActionInProgress}
                    onClick={() => handleConfirmReturn(returnPromptOrder.orderId, selectedReturnReason)}
                    className="w-full bg-black hover:bg-neutral-800 text-white py-2.5 rounded-full text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isActionInProgress ? 'Submitting Return Request...' : 'Confirm Return'}
                  </button>
                  <button
                    disabled={isActionInProgress}
                    onClick={() => setReturnPromptOrder(null)}
                    className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer text-center block"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Persistent Horizontal Pill Chips & Input */}
          <div className="p-3 bg-white border-t border-neutral-200 space-y-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {quickSuggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => sendMessage(s.prompt)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 border border-neutral-200 hover:border-black text-[11px] font-medium transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about orders, returns, shirts..."
                className="flex-1 border border-neutral-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="bg-black text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-neutral-800 disabled:opacity-40 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
