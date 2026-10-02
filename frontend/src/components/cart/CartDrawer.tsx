import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ArrowRight, Tag, ArrowLeft } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    showToast,
  } = useShop();

  const { isAuthenticated, openAuthModal } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError(null);
    const result = applyCoupon(couponInput);
    if (!result.success) {
      setCouponError(result.message);
    } else {
      setCouponInput('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    if (!isAuthenticated) {
      showToast('Please sign in to proceed to checkout');
      openAuthModal('login', () => {
        navigate('/checkout');
      });
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e5e5e5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full hover:bg-[#f4f4f4] text-[#5e5e5e] hover:text-black transition-colors"
                aria-label="Back to shopping"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-base tracking-tight uppercase text-black">
                YOUR BAG
              </span>
              <span className="text-xs text-[#8a8a8a] font-medium">
                ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f4f4f4] transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#f4f4f4]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-[#f4f4f4] flex items-center justify-center mb-4 text-[#8a8a8a]">
                  <Tag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg text-black mb-1">Your bag is empty</h3>
                <p className="text-sm text-[#5e5e5e] max-w-xs mb-6">
                  {!isAuthenticated
                    ? 'Sign in to your customer account to add pieces, save your shopping bag across devices, and checkout.'
                    : 'Explore our modern clothing collection and discover everyday essentials.'}
                </p>
                <div className="flex flex-col gap-2.5 w-full max-w-xs">
                  {!isAuthenticated && (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        setIsCartOpen(false);
                        openAuthModal('login');
                      }}
                      className="w-full"
                    >
                      Sign In / Register
                    </Button>
                  )}
                  <Button
                    variant={!isAuthenticated ? 'secondary' : 'primary'}
                    size="md"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/shop');
                    }}
                    className="inline-flex items-center justify-center gap-2 w-full"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Explore Catalog</span>
                  </Button>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  {/* Thumbnail */}
                  <img
                    src={item.product.images[0] || '/images/15970.jpg'}
                    alt={item.product.name}
                    className="w-20 aspect-[4/5] object-cover rounded-xl bg-[#f4f4f4] flex-shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/products/${item.product.slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-sm font-semibold text-black hover:underline line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#8a8a8a] hover:text-[#b42318] p-1 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-[#8a8a8a] mt-0.5 space-x-2">
                        <span>Size: <strong className="text-black">{item.selectedSize}</strong></span>
                        <span>•</span>
                        <span>Color: <strong className="text-black">{item.selectedColor}</strong></span>
                      </div>
                    </div>

                    {/* Quantity + Unit Price */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#e5e5e5] rounded-full px-2 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-[#5e5e5e] hover:text-black"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-black">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#5e5e5e] hover:text-black"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-bold text-black">
                        ₹{item.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Order Summary */}
          {cart.length > 0 && (
            <div className="px-6 py-5 border-t border-[#e5e5e5] bg-[#fcfcfc] space-y-4">
              {/* Coupon Form */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-[#e8f5ee] border border-[#a6d9be] text-[#167a45] px-3.5 py-2 rounded-xl text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>
                        <strong>{appliedCoupon.code}</strong> applied (-₹{cartDiscount})
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-[#b42318] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. WELCOME10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 bg-white border border-[#e5e5e5] text-xs px-3.5 py-2.5 rounded-full text-black focus:outline-none focus:border-black uppercase placeholder:normal-case"
                    />
                    <Button variant="secondary" size="sm" type="submit">
                      Apply
                    </Button>
                  </form>
                )}
                {couponError && (
                  <p className="text-xs text-[#b42318] mt-1 font-medium">{couponError}</p>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-1.5 text-xs text-[#5e5e5e] border-t border-[#e5e5e5] pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-black font-medium">
                    ₹{cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {cartDiscount > 0 && (
                  <div className="flex justify-between text-[#167a45]">
                    <span>Discount</span>
                    <span>-₹{cartDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-black font-medium">
                    {cartShipping === 0 ? (
                      <span className="text-[#167a45] font-semibold">FREE</span>
                    ) : (
                      `₹${cartShipping}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-bold text-black pt-2 border-t border-[#e5e5e5]">
                  <span>Total</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleProceedToCheckout}
                className="flex items-center justify-center gap-2"
              >
                <span>CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
