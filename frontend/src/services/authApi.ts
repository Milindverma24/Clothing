import type {
  User,
  Address,
  UserNotification,
  CustomerReview,
  SecurityAuditLog,
  Order,
  Product,
  AuthResponse,
} from '../types';

const API_BASE = 'http://localhost:8080/api';
const TOKEN_KEY = 'clothing_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return (data?.data ?? data) as T;
}

// AUTH API
export async function registerApi(payload: {
  firstName: string;
  lastName?: string;
  email: string;
  password?: string;
  phone?: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginApi(payload: {
  email: string;
  password?: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function googleAuthApi(payload: {
  idToken?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  providerUserId?: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function forgotPasswordApi(email: string): Promise<string> {
  return request<string>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordApi(payload: {
  token: string;
  newPassword?: string;
}): Promise<string> {
  return request<string>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAuthConfigApi(): Promise<{
  googleOAuthEnabled: boolean;
  googleClientId: string;
  passwordMinLength: number;
}> {
  return request<{
    googleOAuthEnabled: boolean;
    googleClientId: string;
    passwordMinLength: number;
  }>('/auth/config');
}

// ACCOUNT API
export async function getMeApi(): Promise<User> {
  return request<User>('/account/me');
}

export async function updateProfileApi(payload: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}): Promise<User> {
  return request<User>('/account/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function changePasswordApi(payload: {
  currentPassword?: string;
  newPassword?: string;
}): Promise<string> {
  return request<string>('/account/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function unlinkGoogleApi(): Promise<string> {
  return request<string>('/account/unlink-google', {
    method: 'POST',
  });
}

export async function deleteAccountApi(): Promise<string> {
  return request<string>('/account/delete-account', {
    method: 'POST',
  });
}

export async function getSecurityEventsApi(): Promise<SecurityAuditLog[]> {
  return request<SecurityAuditLog[]>('/account/security-events');
}

// ADDRESSES API
export async function getAddressesApi(): Promise<Address[]> {
  return request<Address[]>('/account/addresses');
}

export async function createAddressApi(address: Omit<Address, 'id'>): Promise<Address> {
  return request<Address>('/account/addresses', {
    method: 'POST',
    body: JSON.stringify(address),
  });
}

export async function updateAddressApi(id: number, address: Partial<Address>): Promise<Address> {
  return request<Address>(`/account/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(address),
  });
}

export async function deleteAddressApi(id: number): Promise<string> {
  return request<string>(`/account/addresses/${id}`, {
    method: 'DELETE',
  });
}

export async function setDefaultShippingAddressApi(id: number): Promise<string> {
  return request<string>(`/account/addresses/${id}/default-shipping`, {
    method: 'PATCH',
  });
}

// WISHLIST API
export async function getWishlistApi(): Promise<Product[]> {
  return request<Product[]>('/account/wishlist');
}

export async function addToWishlistApi(productId: string | number): Promise<string> {
  return request<string>(`/account/wishlist/${productId}`, {
    method: 'POST',
  });
}

export async function removeFromWishlistApi(productId: string | number): Promise<string> {
  return request<string>(`/account/wishlist/${productId}`, {
    method: 'DELETE',
  });
}

export async function syncWishlistApi(productIds: (string | number)[]): Promise<number[]> {
  const numericIds = productIds.map((id) => Number(id)).filter((id) => !isNaN(id));
  return request<number[]>('/account/wishlist/sync', {
    method: 'POST',
    body: JSON.stringify({ productIds: numericIds }),
  });
}

// ORDERS API
export async function getUserOrdersApi(): Promise<Order[]> {
  return request<Order[]>('/account/orders');
}

export async function getOrderDetailsApi(id: string | number): Promise<Order> {
  return request<Order>(`/account/orders/${id}`);
}

export async function requestOrderReturnApi(
  id: string | number,
  payload: { reason: string; comment?: string }
): Promise<Order> {
  return request<Order>(`/account/orders/${id}/return`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// REVIEWS API
export async function getUserReviewsApi(): Promise<CustomerReview[]> {
  return request<CustomerReview[]>('/account/reviews');
}

export async function submitReviewApi(payload: {
  productId: number;
  rating: number;
  title: string;
  comment: string;
}): Promise<CustomerReview> {
  return request<CustomerReview>('/account/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// NOTIFICATIONS API
export async function getUserNotificationsApi(): Promise<UserNotification[]> {
  return request<UserNotification[]>('/account/notifications');
}

export async function markNotificationReadApi(id: number): Promise<string> {
  return request<string>(`/account/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsReadApi(): Promise<string> {
  return request<string>('/account/notifications/mark-all-read', {
    method: 'POST',
  });
}

// CART VALIDATE & MERGE API
export async function validateAndMergeCartApi(
  items: Array<{ productId: number; size?: string; color?: string; quantity: number }>,
  couponCode?: string
): Promise<{
  items: any[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  appliedCoupon?: string;
}> {
  return request('/cart/validate-and-merge', {
    method: 'POST',
    body: JSON.stringify({ items, couponCode }),
  });
}

// PUBLIC ORDER TRACKING API
export async function trackPublicOrderApi(trackingNumber: string): Promise<Order> {
  return request<Order>(`/orders/track/${encodeURIComponent(trackingNumber)}`);
}

// ADMIN CUSTOMERS API
export async function getAdminCustomersApi(page = 0, size = 20, search?: string) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    ...(search ? { search } : {}),
  });
  return request<any>(`/admin/customers?${query.toString()}`);
}
