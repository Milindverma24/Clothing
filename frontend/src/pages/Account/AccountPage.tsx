import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, User, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../../components/ui/Button';

export const AccountPage: React.FC = () => {
  const { orders } = useShop();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-semibold text-black transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Store</span>
        </Link>
      </div>

      <div className="pb-8 mb-8 border-b border-[#e5e5e5]">
        <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block mb-1">
          CUSTOMER PORTAL
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black">
          My Account
        </h1>
        <p className="text-xs text-[#5e5e5e] mt-1 font-medium">
          Manage your orders, saved addresses, and profile details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'orders'
                ? 'bg-black text-white'
                : 'bg-[#f4f4f4] text-black hover:bg-[#e5e5e5]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'profile'
                ? 'bg-black text-white'
                : 'bg-[#f4f4f4] text-black hover:bg-[#e5e5e5]'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Profile Details</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'addresses'
                ? 'bg-black text-white'
                : 'bg-[#f4f4f4] text-black hover:bg-[#e5e5e5]'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Addresses</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-black mb-6">
                Past Orders
              </h2>

              {orders.length === 0 ? (
                <div className="p-12 text-center bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl">
                  <Package className="w-12 h-12 text-[#8a8a8a] mx-auto mb-3" />
                  <h3 className="font-bold text-base text-black mb-1">No orders placed yet</h3>
                  <p className="text-xs text-[#5e5e5e] mb-6">
                    When you place orders, you can track packages and view invoices here.
                  </p>
                  <Link to="/shop">
                    <Button variant="primary" size="sm">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-[#e5e5e5] rounded-2xl p-6 transition-all hover:shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#f4f4f4]">
                        <div>
                          <span className="text-xs font-bold text-black uppercase block">
                            Order #{ord.id}
                          </span>
                          <span className="text-[11px] text-[#8a8a8a] flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(ord.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-[#e8f5ee] text-[#167a45] rounded-full text-[11px] font-bold uppercase tracking-wider">
                            {ord.status}
                          </span>
                          <span className="text-sm font-extrabold text-black">
                            ₹{ord.total.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-4 space-y-3">
                        {ord.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4">
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="w-14 aspect-[4/5] object-cover rounded-lg bg-[#f4f4f4]"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-black truncate">
                                {item.productName}
                              </h4>
                              <p className="text-[11px] text-[#8a8a8a]">
                                Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-black">
                              ₹{item.finalPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer Info */}
                      <div className="pt-3 border-t border-[#f4f4f4] flex flex-wrap items-center justify-between text-xs text-[#8a8a8a] gap-2">
                        <span>
                          Tracking: <strong className="text-black">{ord.trackingNumber}</strong>
                        </span>
                        <span>Payment: {ord.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="text-xl font-bold uppercase tracking-tight text-black mb-4">
                Profile Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#8a8a8a] block mb-1">Full Name</span>
                  <span className="text-black font-semibold text-sm">Rahul Sharma</span>
                </div>
                <div>
                  <span className="text-[#8a8a8a] block mb-1">Email Address</span>
                  <span className="text-black font-semibold text-sm">rahul.sharma@example.com</span>
                </div>
                <div>
                  <span className="text-[#8a8a8a] block mb-1">Phone Number</span>
                  <span className="text-black font-semibold text-sm">+91 98765 43210</span>
                </div>
                <div>
                  <span className="text-[#8a8a8a] block mb-1">Member Since</span>
                  <span className="text-black font-semibold text-sm">January 2026</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="text-xl font-bold uppercase tracking-tight text-black mb-4">
                Saved Delivery Addresses
              </h2>
              <div className="border border-[#e5e5e5] rounded-xl p-4 text-xs">
                <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded-full uppercase mb-2 inline-block">
                  Primary Address
                </span>
                <p className="font-bold text-sm text-black mb-1">Rahul Sharma</p>
                <p className="text-[#5e5e5e] leading-relaxed">
                  Flat 402, Signature Towers, Indiranagar<br />
                  Bengaluru, Karnataka - 560038<br />
                  Phone: +91 98765 43210
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
