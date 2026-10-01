import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck, Truck, CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartSubtotal, cartDiscount, cartShipping, cartTotal, appliedCoupon, createOrder, setIsCartOpen } = useShop();

  const [formData, setFormData] = useState({
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 98765 43210',
    address: 'Flat 402, Signature Towers, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India',
  });

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cart.length === 0 && !placedOrder) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold uppercase text-black mb-3">Your Bag is Empty</h2>
        <p className="text-sm text-[#5e5e5e] mb-8">Add items to your bag before checking out.</p>
        <Link to="/shop">
          <Button variant="primary">Explore Catalog</Button>
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const order = createOrder(formData, paymentMethod.toUpperCase());
      setPlacedOrder(order);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 800);
  };

  // Order Confirmed View
  if (placedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-[#e8f5ee] text-[#167a45] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#167a45] block mb-2">
          ORDER CONFIRMED
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black mb-2">
          Thank You, {placedOrder.customerName}
        </h1>
        <p className="text-sm text-[#5e5e5e] mb-8">
          Order <strong>#{placedOrder.id}</strong> has been successfully placed. We've sent details to <strong>{placedOrder.customerEmail}</strong>.
        </p>

        <div className="bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl p-6 text-left mb-8 space-y-4">
          <div className="flex justify-between pb-3 border-b border-[#e5e5e5] text-xs">
            <span className="text-[#8a8a8a]">Tracking Number</span>
            <span className="font-mono font-bold text-black">{placedOrder.trackingNumber}</span>
          </div>
          <div className="flex justify-between pb-3 border-b border-[#e5e5e5] text-xs">
            <span className="text-[#8a8a8a]">Delivery Address</span>
            <span className="font-medium text-black text-right max-w-xs">
              {placedOrder.shippingAddress.address}, {placedOrder.shippingAddress.city}, {placedOrder.shippingAddress.postalCode}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold text-black pt-1">
            <span>Total Paid</span>
            <span>₹{placedOrder.total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/account/orders">
            <Button variant="primary" size="md">
              View Order History
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="secondary" size="md">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <button
          onClick={() => {
            setIsCartOpen(true);
            navigate(-1);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-semibold text-black transition-all group"
          aria-label="Return to cart"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Bag / Cart</span>
        </button>
      </div>

      <div className="mb-10 pb-6 border-b border-[#e5e5e5]">
        <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block mb-1">
          SECURE CHECKOUT
        </span>
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-black">
          Complete Your Order
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-10">
          {/* 1. Contact & Shipping Address */}
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-black mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Delivery Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <Input
                label="Phone Number"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Street Address & Flat / Suite"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <Input
                label="City"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />

              <Input
                label="State"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />

              <Input
                label="PIN Code"
                required
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />

              <Input
                label="Country"
                required
                disabled
                value={formData.country}
              />
            </div>
          </div>

          {/* 2. Payment Method */}
          <div className="pt-6 border-t border-[#f4f4f4]">
            <h2 className="text-base font-bold uppercase tracking-wider text-black mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Payment Option</span>
            </h2>

            <div className="space-y-3">
              <label
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-black bg-[#fcfcfc] ring-1 ring-black'
                    : 'border-[#e5e5e5] hover:border-black'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="accent-black"
                  />
                  <div>
                    <span className="text-sm font-semibold text-black block">UPI / QR Code</span>
                    <span className="text-xs text-[#8a8a8a]">Instant zero-fee transfer via Google Pay, PhonePe, Paytm</span>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-black" />
              </label>

              <label
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'border-black bg-[#fcfcfc] ring-1 ring-black'
                    : 'border-[#e5e5e5] hover:border-black'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-black"
                  />
                  <div>
                    <span className="text-sm font-semibold text-black block">Credit / Debit Card</span>
                    <span className="text-xs text-[#8a8a8a]">Visa, Mastercard, RuPay, Amex</span>
                  </div>
                </div>
                <Lock className="w-4 h-4 text-black" />
              </label>

              <label
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-black bg-[#fcfcfc] ring-1 ring-black'
                    : 'border-[#e5e5e5] hover:border-black'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-black"
                  />
                  <div>
                    <span className="text-sm font-semibold text-black block">Cash on Delivery</span>
                    <span className="text-xs text-[#8a8a8a]">Pay at doorstep upon arrival</span>
                  </div>
                </div>
                <Truck className="w-5 h-5 text-black" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary Column (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl p-6 sm:p-8 sticky top-28 space-y-6">
            <h3 className="font-bold text-base uppercase tracking-wider text-black pb-4 border-b border-[#e5e5e5]">
              Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h3>

            {/* Item Previews */}
            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={item.product.images[0] || '/images/15970.jpg'}
                    alt={item.product.name}
                    className="w-14 aspect-[4/5] object-cover rounded-lg bg-[#f4f4f4]"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-black truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-[11px] text-[#8a8a8a]">
                      Size: {item.selectedSize} • Qty: {item.quantity}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-black">
                    ₹{item.total.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs text-[#5e5e5e] pt-4 border-t border-[#e5e5e5]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-black font-semibold">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-[#167a45]">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₹{cartDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-black font-semibold">
                  {cartShipping === 0 ? <span className="text-[#167a45]">FREE</span> : `₹${cartShipping}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-black pt-3 border-t border-[#e5e5e5]">
                <span>Total Amount</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Processing Order...' : 'Place Order'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#8a8a8a] text-center">
              <ShieldCheck className="w-4 h-4 text-[#167a45]" />
              <span>256-bit encrypted checkout with buyer protection</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
