import { getStoredToken } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

function getAuthHeaders(extraHeaders: Record<string, string> = {}): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface MyOrderItem {
  orderItemId?: number;
  productId?: number;
  productName: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  productImageUrlSnapshot?: string;
}

export interface OrderTracking {
  available: boolean;
  carrier?: string;
  trackingNumber?: string;
  currentStatus?: string;
  estimatedDeliveryDate?: string;
}

export interface OrderCancellation {
  eligible: boolean;
  status?: string;
  reason?: string;
  requestedAt?: string;
  refundAmount?: number;
  refundStatus?: string;
}

export interface OrderReturn {
  eligible: boolean;
  status?: string;
  daysRemaining?: number;
  returnDeadline?: string;
  reason?: string;
  requestedAt?: string;
  refundAmount?: number;
  refundStatus?: string;
}

export interface OrderActionItem {
  type: string;
  label?: string;
  enabled: boolean;
  reason?: string;
  daysRemaining?: number;
}

export interface MyOrderDetail {
  id: number;
  orderId: string;
  orderDate: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  items: MyOrderItem[];
  tracking?: OrderTracking;
  cancellation?: OrderCancellation;
  returnInfo?: OrderReturn;
  availableActions?: string[];
  actionDetails?: OrderActionItem[];
}

export interface CancelOrderResponse {
  success: boolean;
  message: string;
  orderId: string;
  status: string;
  cancellation?: OrderCancellation;
  order?: MyOrderDetail;
}

export interface ReturnOrderResponse {
  success: boolean;
  message: string;
  orderId: string;
  status: string;
  returnRequest?: OrderReturn;
  order?: MyOrderDetail;
}

/**
 * 1. Fetch only trackable orders strictly belonging to authenticated customer
 */
export async function getTrackableOrders(): Promise<MyOrderDetail[]> {
  const res = await fetch(`${API_BASE_URL}/my/orders/trackable`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Please sign in to view your orders.');
    throw new Error('Could not load trackable orders.');
  }
  const json = await res.json();
  return json.data || [];
}

/**
 * 3. Fetch latest live order details from Spring Boot / PostgreSQL
 * Strictly scoped to authenticated customer; returns 404 on IDOR attempts.
 */
export async function getOrderDetail(orderId: string | number): Promise<MyOrderDetail> {
  const cleanId = String(orderId).trim();
  const res = await fetch(`${API_BASE_URL}/my/orders/${cleanId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Order not found or access denied.');
    if (res.status === 401) throw new Error('Please sign in to view order details.');
    throw new Error(`Failed to load order #${cleanId}.`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * 13. Dynamic actions available for this order
 */
export async function getOrderActions(orderId: string | number): Promise<{ orderId: string; actions: OrderActionItem[] }> {
  const cleanId = String(orderId).trim();
  const res = await fetch(`${API_BASE_URL}/my/orders/${cleanId}/actions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to retrieve available actions.');
  }
  const json = await res.json();
  return json.data;
}

/**
 * 5. Transactional Order Cancellation with Idempotency
 */
export async function cancelOrder(
  orderId: string | number,
  reason: string = 'Changed my mind',
  idempotencyKey?: string
): Promise<CancelOrderResponse> {
  const cleanId = String(orderId).trim();
  const key = idempotencyKey || `cancel-${cleanId}-${Date.now()}`;
  const requestBody = JSON.stringify({
    reason,
    confirmationToken: `conf-${cleanId}`,
  });

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/my/orders/${cleanId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Idempotency-Key': key,
      }),
      body: requestBody,
    });
  } catch (err: any) {
    // Resilient fallback: If custom header preflight fails in browser, retry with standard auth headers
    try {
      res = await fetch(`${API_BASE_URL}/my/orders/${cleanId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: requestBody,
      });
    } catch {
      throw new Error(`Unable to connect to server to cancel order #${cleanId}. Please check your connection.`);
    }
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Please sign in to cancel your order.');
    }
    const errorMsg = json?.message || `Failed to cancel order #${cleanId}.`;
    throw new Error(errorMsg);
  }
  return json.data;
}

/**
 * 9. Transactional Return Request with 14-day validation and Idempotency
 */
export async function returnOrder(
  orderId: string | number,
  payload: {
    reason: string;
    items?: Array<{ orderItemId?: number; quantity: number }>;
  },
  idempotencyKey?: string
): Promise<ReturnOrderResponse> {
  const cleanId = String(orderId).trim();
  const key = idempotencyKey || `return-${cleanId}-${Date.now()}`;
  const requestBody = JSON.stringify({
    reason: payload.reason,
    items: payload.items || [],
    confirmationToken: `conf-ret-${cleanId}`,
  });

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/my/orders/${cleanId}/return`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Idempotency-Key': key,
      }),
      body: requestBody,
    });
  } catch (err: any) {
    // Resilient fallback: If custom header preflight fails in browser, retry with standard auth headers
    try {
      res = await fetch(`${API_BASE_URL}/my/orders/${cleanId}/return`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: requestBody,
      });
    } catch {
      throw new Error(`Unable to connect to server to submit return for order #${cleanId}. Please check your connection.`);
    }
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Please sign in to submit a return request.');
    }
    const errorMsg = json?.message || `Failed to submit return request for order #${cleanId}.`;
    throw new Error(errorMsg);
  }
  return json.data;
}
