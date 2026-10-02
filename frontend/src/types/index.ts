export type Gender = 'Men' | 'Women' | 'Boys' | 'Girls' | 'Unisex';

export interface ProductVariant {
  id: string | number;
  productId: string | number;
  sku: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color: string;
  price: number;
  stock: number;
  image?: string;
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';
}

export interface Product {
  id: string | number;
  externalProductId?: number;
  name: string;
  slug: string;
  description: string;
  gender: Gender;
  masterCategory: string; // e.g. Apparel, Footwear, Accessories
  subCategory: string;    // e.g. Topwear, Bottomwear, Shoes
  articleType: string;    // e.g. T-Shirts, Shirts, Casual Shoes
  baseColour: string;
  season?: string;
  releaseYear?: number;
  usage?: string;
  basePrice: number;
  compareAtPrice?: number;
  images: string[];
  variants: ProductVariant[];
  tags?: string[];
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK';
  badge?: 'NEW' | 'SALE' | 'BESTSELLER' | 'LIMITED' | 'LOW STOCK';
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string | number;
  variantId: string | number;
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Coupon {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minimumCartValue?: number;
  maximumDiscount?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  description?: string;
}

export interface OrderItem {
  id: string;
  productId: string | number;
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  finalPrice: number;
  image: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  trackingNumber?: string;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  gender?: Gender;
  subcategories: string[];
}

export interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image: string;
  featured?: boolean;
}

export interface FilterState {
  gender?: string;
  category?: string;
  subCategory?: string;
  articleType?: string;
  color?: string;
  size?: string;
  priceRange?: [number, number];
  sort?: 'recommended' | 'newest' | 'price_asc' | 'price_desc' | 'best_selling' | 'rating';
  searchQuery?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  role: string;
  status: string;
  createdAt?: string;
  hasPassword?: boolean;
  connectedProviders?: string[];
}

export interface Address {
  id?: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'HOME' | 'WORK' | 'OTHER';
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export interface UserNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface CustomerReview {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN' | 'FLAGGED';
  createdAt: string;
}

export interface SecurityAuditLog {
  id: number;
  userId?: number;
  action: string;
  ipAddress?: string;
  details?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

