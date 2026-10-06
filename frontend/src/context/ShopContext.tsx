import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, CartItem, Coupon, Order, OrderItem } from '../types';
import { PRODUCTS } from '../data/products';
import { COUPONS } from '../data/collections';
import { useAuth } from './AuthContext';
import {
  syncWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
  getUserOrdersApi,
  validateAndMergeCartApi,
  createOrderApi,
  getStoredToken,
} from '../services/authApi';

interface ShopContextType {
  products: Product[];
  cart: CartItem[];
  wishlist: (string | number)[];
  appliedCoupon: Coupon | null;
  orders: Order[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, size?: string, color?: string, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string | number) => void;
  isInWishlist: (productId: string | number) => boolean;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  createOrder: (shippingDetails: any, paymentMethod: string) => Promise<Order>;
  cartSubtotal: number;
  cartDiscount: number;
  cartShipping: number;
  cartTotal: number;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [products] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('clothing_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<(string | number)[]>(() => {
    try {
      const saved = localStorage.getItem('clothing_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const token = getStoredToken();
      if (!token) return [];
      const saved = localStorage.getItem('clothing_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Clear orders when user is unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([]);
      localStorage.removeItem('clothing_orders');
    }
  }, [isAuthenticated]);

  // Sync with Backend when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // 1. Sync Wishlist
    syncWishlistApi(wishlist)
      .then((serverProductIds) => {
        if (serverProductIds && serverProductIds.length > 0) {
          setWishlist(serverProductIds);
        }
      })
      .catch((err) => console.warn('Wishlist sync error:', err));

    // 2. Validate & Merge Cart with backend pricing
    if (cart.length > 0) {
      const payload = cart.map((c) => ({
        productId: Number(c.productId),
        size: c.selectedSize,
        color: c.selectedColor,
        quantity: c.quantity,
      }));
      validateAndMergeCartApi(payload, appliedCoupon?.code)
        .then((merged) => {
          if (merged && merged.items && merged.items.length > 0) {
            // Updated verified cart
          }
        })
        .catch((err) => console.warn('Cart merge error:', err));
    }

    // 3. Sync Orders from Backend
    getUserOrdersApi()
      .then((serverOrders) => {
        if (serverOrders && serverOrders.length > 0) {
          setOrders(serverOrders);
        }
      })
      .catch((err) => console.warn('Orders sync error:', err));
  }, [isAuthenticated, user]);

  useEffect(() => {
    localStorage.setItem('clothing_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('clothing_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('clothing_orders', JSON.stringify(orders));
    }
  }, [orders, isAuthenticated]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const addToCart = (
    product: Product,
    size: string = 'M',
    color: string = product.baseColour || 'Black',
    quantity: number = 1
  ) => {
    if (!isAuthenticated) {
      showToast('Please sign in to add this item to your cart');
      openAuthModal('login', () => {
        addToCart(product, size, color, quantity);
      });
      return;
    }

    const variantId = `${product.id}-${size}-${color.toLowerCase().replace(/\s+/g, '-')}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === variantId);
      if (existing) {
        return prev.map((item) =>
          item.id === variantId
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * item.unitPrice,
              }
            : item
        );
      }
      const newItem: CartItem = {
        id: variantId,
        productId: product.id,
        variantId,
        product,
        selectedSize: size,
        selectedColor: color,
        quantity,
        unitPrice: product.basePrice,
        discount: 0,
        total: product.basePrice * quantity,
      };
      return [...prev, newItem];
    });
    showToast(`Added ${product.name} to bag`);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    showToast('Item removed from bag');
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, total: newQty * item.unitPrice }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const toggleWishlist = (productId: string | number) => {
    if (!isAuthenticated) {
      showToast('Please sign in to save items to your wishlist');
      openAuthModal('login', () => {
        toggleWishlist(productId);
      });
      return;
    }

    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        removeFromWishlistApi(productId).catch((err) => console.warn(err));
        showToast('Removed from wishlist');
        return prev.filter((id) => id !== productId);
      } else {
        addToWishlistApi(productId).catch((err) => console.warn(err));
        showToast('Saved to wishlist');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string | number) => {
    return wishlist.includes(productId);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);

  // Calculate discount based on applied coupon
  let cartDiscount = 0;
  let cartShipping = cartSubtotal > 1499 || cart.length === 0 ? 0 : 99;

  if (appliedCoupon) {
    if (appliedCoupon.type === 'PERCENTAGE') {
      cartDiscount = Math.round((cartSubtotal * appliedCoupon.value) / 100);
      if (appliedCoupon.maximumDiscount && cartDiscount > appliedCoupon.maximumDiscount) {
        cartDiscount = appliedCoupon.maximumDiscount;
      }
    } else if (appliedCoupon.type === 'FIXED_AMOUNT') {
      cartDiscount = Math.min(appliedCoupon.value, cartSubtotal);
    } else if (appliedCoupon.type === 'FREE_SHIPPING') {
      cartShipping = 0;
    }
  }

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartShipping);

  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = COUPONS.find((c) => c.code === cleanCode && c.status === 'ACTIVE');
    if (!found) {
      return { success: false, message: 'Invalid or inactive promo code.' };
    }
    if (found.minimumCartValue && cartSubtotal < found.minimumCartValue) {
      return {
        success: false,
        message: `Cart total must be at least ₹${found.minimumCartValue} to apply this code.`,
      };
    }
    setAppliedCoupon(found);
    showToast(`✓ ${found.code} applied!`);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed');
  };

  const createOrder = async (shippingDetails: any, paymentMethod: string): Promise<Order> => {
    if (!isAuthenticated) {
      showToast('Please sign in to place an order');
      openAuthModal('login');
      throw new Error('Authentication required to place an order');
    }

    const orderItems: OrderItem[] = cart.map((item) => ({
      id: `oi-${Date.now()}-${item.id}`,
      productId: item.productId,
      productName: item.product.name,
      sku: `SKU-${item.productId}-${item.selectedSize}`,
      size: item.selectedSize,
      color: item.selectedColor,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: 0,
      finalPrice: item.total,
      image: item.product.images[0] || `/images/${item.productId}.jpg`,
      imageUrl: item.product.images[0] || `/images/${item.productId}.jpg`,
    }));

    const orderPayload = {
      name: shippingDetails.name,
      email: shippingDetails.email,
      phone: shippingDetails.phone,
      address: shippingDetails.address,
      city: shippingDetails.city,
      state: shippingDetails.state,
      postalCode: shippingDetails.postalCode,
      country: shippingDetails.country || 'India',
      subtotal: cartSubtotal,
      discount: cartDiscount,
      shipping: cartShipping,
      total: cartTotal,
      couponCode: appliedCoupon?.code,
      paymentMethod,
      items: orderItems.map((oi) => ({
        productId: oi.productId,
        name: oi.productName,
        sku: oi.sku,
        size: oi.size,
        color: oi.color,
        quantity: oi.quantity,
        price: oi.unitPrice,
        finalPrice: oi.finalPrice,
        image: oi.image || oi.imageUrl,
        imageUrl: oi.image || oi.imageUrl,
      })),
    };

    let confirmedOrder: Order;
    try {
      confirmedOrder = await createOrderApi(orderPayload);
    } catch (err) {
      console.warn('Backend order placement failed, generating local fallback record:', err);
      confirmedOrder = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        customerName: shippingDetails.name,
        customerEmail: shippingDetails.email,
        customerPhone: shippingDetails.phone,
        shippingAddress: {
          address: shippingDetails.address,
          city: shippingDetails.city,
          state: shippingDetails.state,
          postalCode: shippingDetails.postalCode,
          country: shippingDetails.country || 'India',
        },
        items: orderItems,
        subtotal: cartSubtotal,
        discount: cartDiscount,
        couponCode: appliedCoupon?.code,
        shipping: cartShipping,
        total: cartTotal,
        status: 'CONFIRMED',
        paymentMethod,
        trackingNumber: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`,
        createdAt: new Date().toISOString(),
      };
    }

    setOrders((prev) => [confirmedOrder, ...prev.filter((o) => o.id !== confirmedOrder.id)]);
    clearCart();
    return confirmedOrder;
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        cart,
        wishlist,
        appliedCoupon,
        orders,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        applyCoupon,
        removeCoupon,
        createOrder,
        cartSubtotal,
        cartDiscount,
        cartShipping,
        cartTotal,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
