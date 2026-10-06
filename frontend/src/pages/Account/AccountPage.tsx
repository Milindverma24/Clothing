import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package,
  MapPin,
  User as UserIcon,
  Clock,
  ChevronRight,
  ArrowLeft,
  Heart,
  Shield,
  Bell,
  Star,
  Settings,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
  LogOut,
  ShoppingBag,
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import {
  getAddressesApi,
  createAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultShippingAddressApi,
  getWishlistApi,
  removeFromWishlistApi,
  getUserOrdersApi,
  requestOrderReturnApi,
  getUserReviewsApi,
  submitReviewApi,
  getUserNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  getSecurityEventsApi,
} from '../../services/authApi';
import type {
  Address,
  Product,
  Order,
  CustomerReview,
  UserNotification,
  SecurityAuditLog,
} from '../../types';
import { Button } from '../../components/ui/Button';

type AccountTab =
  | 'overview'
  | 'orders'
  | 'wishlist'
  | 'addresses'
  | 'profile'
  | 'security'
  | 'reviews'
  | 'notifications'
  | 'settings';

export const AccountPage: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    logout,
    updateProfile,
    changePassword,
    unlinkGoogle,
    deleteAccount,
  } = useAuth();

  const { addToCart, showToast } = useShop();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab navigation state synced with query param
  const currentTabParam = (searchParams.get('tab') as AccountTab) || 'overview';
  const [activeTab, setActiveTab] = useState<AccountTab>(currentTabParam);

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab') as AccountTab);
    }
  }, [searchParams]);

  const setTab = (tab: AccountTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Redirect unauthenticated guests to login with redirect back to account
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/account');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>([]);

  // Modals & sub-flows
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderReturnModal, setOrderReturnModal] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('Size did not fit');
  const [returnComment, setReturnComment] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Address modal state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<Address>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    addressType: 'HOME',
    isDefaultShipping: true,
    isDefaultBilling: false,
  });

  // Profile Edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    avatarUrl: '',
  });

  // Password Change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changingPass, setChangingPass] = useState(false);

  // Write Review state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<number>(15970);
  const [reviewProductName, setReviewProductName] = useState<string>('Garment');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load account data when tab changes or user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || '',
      });
    }

    const loadData = async () => {
      try {
        if (activeTab === 'overview' || activeTab === 'orders') {
          const ords = await getUserOrdersApi();
          setOrders(ords);
        }
        if (activeTab === 'overview' || activeTab === 'wishlist') {
          const wish = await getWishlistApi();
          setWishlistItems(wish);
        }
        if (activeTab === 'overview' || activeTab === 'addresses') {
          const addrs = await getAddressesApi();
          setAddresses(addrs);
        }
        if (activeTab === 'reviews') {
          const revs = await getUserReviewsApi();
          setReviews(revs);
        }
        if (activeTab === 'overview' || activeTab === 'notifications') {
          const notifs = await getUserNotificationsApi();
          setNotifications(notifs);
        }
        if (activeTab === 'security') {
          const logs = await getSecurityEventsApi();
          setSecurityLogs(logs);
        }
      } catch (err) {
        console.warn('Error fetching account data:', err);
      }
    };

    loadData();
  }, [activeTab, isAuthenticated, user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setIsEditingProfile(false);
      showToast('Profile updated successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setChangingPass(true);
    setPasswordMsg(null);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      const logs = await getSecurityEventsApi();
      setSecurityLogs(logs);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err?.message || 'Failed to change password.' });
    } finally {
      setChangingPass(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Google account?')) return;
    try {
      await unlinkGoogle();
      showToast('Google account disconnected');
    } catch (err: any) {
      showToast(err?.message || 'Could not disconnect Google');
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await updateAddressApi(editingAddressId, addressForm);
        showToast('Address updated');
      } else {
        await createAddressApi(addressForm);
        showToast('Address added');
      }
      setAddressModalOpen(false);
      setEditingAddressId(null);
      const updated = await getAddressesApi();
      setAddresses(updated);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await deleteAddressApi(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast('Address deleted');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete address');
    }
  };

  const handleSetDefaultShipping = async (id: number) => {
    try {
      await setDefaultShippingAddressApi(id);
      const updated = await getAddressesApi();
      setAddresses(updated);
      showToast('Default shipping address updated');
    } catch (err: any) {
      showToast(err?.message || 'Failed to set default shipping address');
    }
  };

  const handleRemoveWishlist = async (productId: number | string) => {
    try {
      await removeFromWishlistApi(productId);
      setWishlistItems((prev) => prev.filter((p) => p.id !== productId));
      showToast('Removed from wishlist');
    } catch (err: any) {
      showToast('Could not remove item');
    }
  };

  const handleMoveWishlistToBag = (product: Product) => {
    addToCart(product, 'M', product.baseColour || 'Black', 1);
    handleRemoveWishlist(product.id);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderReturnModal) return;
    setSubmittingReturn(true);
    try {
      const updated = await requestOrderReturnApi(orderReturnModal.id, {
        reason: returnReason,
        comment: returnComment,
      });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (selectedOrder?.id === updated.id) {
        setSelectedOrder(updated);
      }
      setOrderReturnModal(null);
      setReturnComment('');
      showToast('Return request submitted');
    } catch (err: any) {
      showToast(err?.message || 'Failed to request return');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const rev = await submitReviewApi({
        productId: reviewProductId,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      setReviews((prev) => [rev, ...prev]);
      setReviewModalOpen(false);
      setReviewTitle('');
      setReviewComment('');
      showToast('Review submitted successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All notifications marked as read');
    } catch {
      // ignore
    }
  };

  const handleAccountDeletion = async () => {
    const confirmation = window.prompt(
      'Type "DELETE" to confirm closing and anonymizing your account. (Historical orders will be retained for statutory compliance).'
    );
    if (confirmation === 'DELETE') {
      try {
        await deleteAccount();
        showToast('Your account has been deactivated.');
        navigate('/');
      } catch (err: any) {
        showToast(err?.message || 'Could not deactivate account');
      }
    }
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-[#5e5e5e] font-medium uppercase tracking-wider">
          Loading Customer Account...
        </p>
      </div>
    );
  }

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Breadcrumb & Exit */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-semibold text-black transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Continue Shopping</span>
        </Link>

        <button
          onClick={() => {
            logout();
            showToast('Signed out of account');
            navigate('/');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fff2f2] hover:bg-[#ffe5e5] text-xs font-semibold text-[#b91c1c] transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Account Hero Banner */}
      <div className="pb-8 mb-8 border-b border-[#e5e5e5] flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center font-extrabold text-xl uppercase tracking-wider overflow-hidden shadow-xs">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <span>{user.firstName.charAt(0)}{user.lastName?.charAt(0) || ''}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
                Hello, {user.firstName} 👋
              </h1>
              {user.emailVerified && (
                <span className="px-2 py-0.5 bg-[#e8f5ee] text-[#167a45] rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-[#5e5e5e] font-medium">{user.email}</p>
          </div>
        </div>

        {/* Quick Nav Pills on Mobile/Tablet */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTab('orders')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'orders' ? 'bg-black text-white' : 'bg-[#f4f4f4] hover:bg-[#e5e5e5] text-black'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setTab('wishlist')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'wishlist' ? 'bg-black text-white' : 'bg-[#f4f4f4] hover:bg-[#e5e5e5] text-black'
            }`}
          >
            Wishlist ({wishlistItems.length})
          </button>
          <button
            onClick={() => setTab('notifications')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
              activeTab === 'notifications' ? 'bg-black text-white' : 'bg-[#f4f4f4] hover:bg-[#e5e5e5] text-black'
            }`}
          >
            <Bell className="w-3 h-3" />
            <span>Alerts</span>
            {unreadNotifsCount > 0 && (
              <span className="ml-1 w-4 h-4 bg-black text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Dynamic Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1.5">
          {[
            { id: 'overview', label: 'Dashboard', icon: UserIcon },
            { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
            { id: 'wishlist', label: `Wishlist (${wishlistItems.length})`, icon: Heart },
            { id: 'addresses', label: `Addresses (${addresses.length})`, icon: MapPin },
            { id: 'profile', label: 'Profile Details', icon: UserIcon },
            { id: 'security', label: 'Security & Login', icon: Shield },
            { id: 'reviews', label: 'My Reviews', icon: Star },
            {
              id: 'notifications',
              label: 'Notifications',
              icon: Bell,
              badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
            },
            { id: 'settings', label: 'Account Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as AccountTab)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-[#f8f8f8] text-black hover:bg-[#efefef]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="w-4 h-4 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#8a8a8a]'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div
                  onClick={() => setTab('orders')}
                  className="p-5 bg-white border border-[#e5e5e5] rounded-2xl hover:border-black cursor-pointer transition-all"
                >
                  <Package className="w-5 h-5 text-black mb-2" />
                  <span className="text-2xl font-extrabold text-black block">{orders.length}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">
                    Total Orders
                  </span>
                </div>

                <div
                  onClick={() => setTab('wishlist')}
                  className="p-5 bg-white border border-[#e5e5e5] rounded-2xl hover:border-black cursor-pointer transition-all"
                >
                  <Heart className="w-5 h-5 text-black mb-2" />
                  <span className="text-2xl font-extrabold text-black block">{wishlistItems.length}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">
                    Wishlist Items
                  </span>
                </div>

                <div
                  onClick={() => setTab('addresses')}
                  className="p-5 bg-white border border-[#e5e5e5] rounded-2xl hover:border-black cursor-pointer transition-all"
                >
                  <MapPin className="w-5 h-5 text-black mb-2" />
                  <span className="text-2xl font-extrabold text-black block">{addresses.length}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">
                    Saved Addresses
                  </span>
                </div>

                <div
                  onClick={() => setTab('notifications')}
                  className="p-5 bg-white border border-[#e5e5e5] rounded-2xl hover:border-black cursor-pointer transition-all"
                >
                  <Bell className="w-5 h-5 text-black mb-2" />
                  <span className="text-2xl font-extrabold text-black block">{unreadNotifsCount}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">
                    Unread Alerts
                  </span>
                </div>
              </div>

              {/* Recent Order Preview */}
              <div className="bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#f4f4f4]">
                  <div>
                    <h2 className="text-lg font-extrabold uppercase tracking-tight text-black">
                      Recent Activity
                    </h2>
                    <p className="text-xs text-[#5e5e5e]">Your most recent package and dispatch status</p>
                  </div>
                  {orders.length > 0 && (
                    <button
                      onClick={() => setTab('orders')}
                      className="text-xs font-bold uppercase tracking-wider text-black hover:underline"
                    >
                      View All Orders →
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-10 h-10 text-[#8a8a8a] mx-auto mb-2" />
                    <p className="text-xs text-[#5e5e5e] mb-4">You haven't placed any orders yet.</p>
                    <Link to="/shop">
                      <Button variant="primary" size="sm">
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const latest = orders[0];
                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#fbfbfb] border border-[#eeeeee] rounded-2xl">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold uppercase text-black">
                                #{latest.id}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f5ee] text-[#167a45] uppercase">
                                {latest.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#5e5e5e]">
                              {latest.items.length} item(s) • ₹{latest.total.toLocaleString('en-IN')}
                            </p>
                            {latest.trackingNumber && (
                              <p className="text-[11px] text-[#8a8a8a] font-mono">
                                Tracking: {latest.trackingNumber}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedOrder(latest)}
                              className="px-4 py-2 bg-black hover:bg-[#222222] text-white text-xs font-bold uppercase rounded-full transition-all"
                            >
                              Track & Details
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8">
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-black mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => setTab('orders')}
                    className="p-4 bg-[#f8f8f8] hover:bg-black hover:text-white rounded-2xl text-left transition-all group"
                  >
                    <Truck className="w-5 h-5 mb-2 text-black group-hover:text-white" />
                    <span className="text-xs font-bold uppercase block">Track Order</span>
                    <span className="text-[10px] text-[#8a8a8a] group-hover:text-white/70">Check status</span>
                  </button>

                  <button
                    onClick={() => setTab('wishlist')}
                    className="p-4 bg-[#f8f8f8] hover:bg-black hover:text-white rounded-2xl text-left transition-all group"
                  >
                    <Heart className="w-5 h-5 mb-2 text-black group-hover:text-white" />
                    <span className="text-xs font-bold uppercase block">My Wishlist</span>
                    <span className="text-[10px] text-[#8a8a8a] group-hover:text-white/70">Saved pieces</span>
                  </button>

                  <button
                    onClick={() => setTab('addresses')}
                    className="p-4 bg-[#f8f8f8] hover:bg-black hover:text-white rounded-2xl text-left transition-all group"
                  >
                    <MapPin className="w-5 h-5 mb-2 text-black group-hover:text-white" />
                    <span className="text-xs font-bold uppercase block">Addresses</span>
                    <span className="text-[10px] text-[#8a8a8a] group-hover:text-white/70">Manage delivery</span>
                  </button>

                  <button
                    onClick={() => setTab('profile')}
                    className="p-4 bg-[#f8f8f8] hover:bg-black hover:text-white rounded-2xl text-left transition-all group"
                  >
                    <UserIcon className="w-5 h-5 mb-2 text-black group-hover:text-white" />
                    <span className="text-xs font-bold uppercase block">Edit Profile</span>
                    <span className="text-[10px] text-[#8a8a8a] group-hover:text-white/70">Personal details</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-tight text-black">
                    Your Orders
                  </h2>
                  <p className="text-xs text-[#5e5e5e]">Track, review, or return your purchased items</p>
                </div>
                <span className="text-xs font-bold uppercase text-[#8a8a8a]">
                  {orders.length} Placed
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center bg-[#fcfcfc] border border-[#e5e5e5] rounded-3xl">
                  <Package className="w-12 h-12 text-[#8a8a8a] mx-auto mb-3" />
                  <h3 className="font-bold text-base text-black mb-1">No orders found</h3>
                  <p className="text-xs text-[#5e5e5e] mb-6">
                    When you purchase pieces from the store, they will appear here with live tracking.
                  </p>
                  <Link to="/shop">
                    <Button variant="primary" size="sm">
                      Browse New Arrivals
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-[#e5e5e5] rounded-3xl p-6 transition-all hover:shadow-xs"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#f4f4f4]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-black uppercase">
                              Order #{ord.id}
                            </span>
                            <span className="px-2.5 py-0.5 bg-[#e8f5ee] text-[#167a45] rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {ord.status}
                            </span>
                            {ord.returnStatus && ord.returnStatus !== 'NONE' && (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                ord.returnStatus === 'AWAITING_APPROVAL'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold animate-pulse'
                                  : ord.returnStatus === 'REQUESTED'
                                  ? 'bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5]'
                                  : ord.returnStatus === 'APPROVED'
                                  ? 'bg-[#eff6ff] text-[#1d4ed8] border border-[#dbeafe]'
                                  : ord.returnStatus === 'REFUNDED'
                                  ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]'
                                  : 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]'
                              }`}>
                                {ord.returnStatus === 'AWAITING_APPROVAL' ? '⚠️ Under Atelier Review' : ord.returnStatus === 'APPROVED' ? '✓ Return Approved' : `Return: ${ord.returnStatus}`}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#8a8a8a] flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ord.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-extrabold text-black">
                            ₹{ord.total.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-4 py-2 bg-black hover:bg-[#222222] text-white text-xs font-semibold rounded-full transition-all"
                          >
                            Order Details
                          </button>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="py-4 space-y-3">
                        {ord.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4">
                            <img
                              src={item.image || item.imageUrl || (item.productId ? `/images/${item.productId}.jpg` : '/images/15970.jpg')}
                              alt={item.productName}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (item.productId && !target.src.includes(`/images/${item.productId}.jpg`)) {
                                  target.src = `/images/${item.productId}.jpg`;
                                } else if (!target.src.includes('/images/15970.jpg')) {
                                  target.src = '/images/15970.jpg';
                                }
                              }}
                              className="w-14 aspect-[4/5] object-cover rounded-xl bg-[#f4f4f4]"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-black truncate">
                                {item.productName}
                              </h4>
                              <p className="text-[11px] text-[#8a8a8a]">
                                Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-black">
                              ₹{item.finalPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Actions Footer */}
                      <div className="pt-3 border-t border-[#f4f4f4] flex flex-wrap items-center justify-between text-xs text-[#8a8a8a] gap-2">
                        <div className="flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-black" />
                          <span>
                            Tracking: <strong className="text-black font-mono">{ord.trackingNumber || 'TRK-IN-PROGRESS'}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {ord.status === 'DELIVERED' && (
                            <button
                              onClick={() => {
                                const firstItem = ord.items[0];
                                setReviewProductId(Number(firstItem?.productId) || 15970);
                                setReviewProductName(firstItem?.productName || 'Clothing Piece');
                                setReviewModalOpen(true);
                              }}
                              className="text-xs font-bold text-black hover:underline"
                            >
                              Write Review
                            </button>
                          )}
                          {ord.returnStatus && ord.returnStatus !== 'NONE' ? (
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              ord.returnStatus === 'AWAITING_APPROVAL'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold animate-pulse'
                                : ord.returnStatus === 'REFUNDED'
                                ? 'bg-[#f0fdf4] text-[#15803d]'
                                : ord.returnStatus === 'APPROVED'
                                ? 'bg-[#eff6ff] text-[#1d4ed8]'
                                : 'bg-[#fff7ed] text-[#c2410c]'
                            }`}>
                              {ord.returnStatus === 'AWAITING_APPROVAL' ? '⚠️ Under Review' : ord.returnStatus === 'APPROVED' ? '✓ Return Approved' : `● Return ${ord.returnStatus}`}
                            </span>
                          ) : (
                            ['DELIVERED', 'SHIPPED', 'CONFIRMED'].includes(ord.status) && (
                              <button
                                onClick={() => setOrderReturnModal(ord)}
                                className="text-xs font-bold text-[#b91c1c] hover:underline"
                              >
                                Request Return
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-tight text-black">
                    Saved Wishlist
                  </h2>
                  <p className="text-xs text-[#5e5e5e]">Items you love, synced across all your devices</p>
                </div>
                <span className="text-xs font-bold uppercase text-[#8a8a8a]">
                  {wishlistItems.length} Saved
                </span>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="p-12 text-center bg-[#fcfcfc] border border-[#e5e5e5] rounded-3xl">
                  <Heart className="w-12 h-12 text-[#8a8a8a] mx-auto mb-3" />
                  <h3 className="font-bold text-base text-black mb-1">Your wishlist is empty</h3>
                  <p className="text-xs text-[#5e5e5e] mb-6">
                    Tap the heart icon on any piece to save it for later review or instant checkout.
                  </p>
                  <Link to="/shop">
                    <Button variant="primary" size="sm">
                      Explore Products
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistItems.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden group flex flex-col justify-between"
                    >
                      <div className="relative aspect-[4/5] bg-[#f4f4f4] overflow-hidden">
                        <img
                          src={product.images[0] || '/images/hero-campaign.jpg'}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <button
                          onClick={() => handleRemoveWishlist(product.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-black hover:text-white flex items-center justify-center transition-colors shadow-xs"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#8a8a8a] block">
                            {product.articleType || product.subCategory}
                          </span>
                          <h4 className="text-xs font-bold text-black truncate mt-0.5">
                            {product.name}
                          </h4>
                          <span className="text-xs font-extrabold text-black block mt-1">
                            ₹{product.basePrice.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#f4f4f4]">
                          <button
                            onClick={() => handleMoveWishlistToBag(product)}
                            className="flex-1 py-2 bg-black hover:bg-[#222222] text-white text-[11px] font-bold uppercase rounded-full flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Move to Bag</span>
                          </button>
                          <Link
                            to={`/products/${product.slug}`}
                            className="p-2 bg-[#f4f4f4] hover:bg-[#e5e5e5] rounded-full text-black transition-colors"
                            title="View product details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-tight text-black">
                    Saved Addresses
                  </h2>
                  <p className="text-xs text-[#5e5e5e]">Delivery destinations for seamless 1-click checkout</p>
                </div>
                <button
                  onClick={() => {
                    setEditingAddressId(null);
                    setAddressForm({
                      fullName: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
                      phone: user.phone || '',
                      addressLine1: '',
                      addressLine2: '',
                      city: '',
                      state: '',
                      postalCode: '',
                      country: 'India',
                      addressType: 'HOME',
                      isDefaultShipping: addresses.length === 0,
                      isDefaultBilling: false,
                    });
                    setAddressModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-[#222222] text-white text-xs font-bold uppercase rounded-full transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="p-12 text-center bg-[#fcfcfc] border border-[#e5e5e5] rounded-3xl">
                  <MapPin className="w-12 h-12 text-[#8a8a8a] mx-auto mb-3" />
                  <h3 className="font-bold text-base text-black mb-1">No addresses saved</h3>
                  <p className="text-xs text-[#5e5e5e] mb-4">
                    Save your shipping address now to speed up checkout on your next order.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="bg-white border border-[#e5e5e5] rounded-2xl p-5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-[#f4f4f4] text-black text-[10px] font-bold rounded-full uppercase">
                            {addr.addressType}
                          </span>
                          {addr.isDefaultShipping ? (
                            <span className="px-2.5 py-0.5 bg-black text-white text-[10px] font-bold rounded-full uppercase">
                              Primary Shipping
                            </span>
                          ) : (
                            <button
                              onClick={() => addr.id && handleSetDefaultShipping(addr.id)}
                              className="text-[11px] font-semibold text-[#5e5e5e] hover:text-black underline"
                            >
                              Set as Default
                            </button>
                          )}
                        </div>

                        <p className="text-sm font-bold text-black">{addr.fullName}</p>
                        <p className="text-xs text-[#5e5e5e] leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 && <>, {addr.addressLine2}</>}
                          <br />
                          {addr.city}, {addr.state} - {addr.postalCode}
                          <br />
                          {addr.country}
                        </p>
                        <p className="text-[11px] text-[#8a8a8a]">Phone: {addr.phone}</p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-[#f4f4f4] flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            if (!addr.id) return;
                            setEditingAddressId(addr.id);
                            setAddressForm({ ...addr });
                            setAddressModalOpen(true);
                          }}
                          className="p-2 rounded-full hover:bg-[#f4f4f4] text-[#5e5e5e] hover:text-black transition-colors"
                          title="Edit Address"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => addr.id && handleDeleteAddress(addr.id)}
                          className="p-2 rounded-full hover:bg-[#fff2f2] text-[#8a8a8a] hover:text-[#b91c1c] transition-colors"
                          title="Delete Address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#f4f4f4]">
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-tight text-black">
                    Personal Information
                  </h2>
                  <p className="text-xs text-[#5e5e5e]">Update your display name, contact phone, or avatar</p>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 bg-black hover:bg-[#222222] text-white text-xs font-bold uppercase rounded-full transition-all"
                  >
                    Edit Details
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-black uppercase mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-black uppercase mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-black uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-black uppercase mb-1">
                      Avatar Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={profileForm.avatarUrl}
                      onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-black hover:bg-[#222222] text-white text-xs font-bold uppercase rounded-full transition-all"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-5 py-2.5 bg-[#f4f4f4] hover:bg-[#e5e5e5] text-black text-xs font-semibold rounded-full transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div className="p-4 bg-[#fbfbfb] rounded-2xl border border-[#eeeeee]">
                    <span className="text-[#8a8a8a] block text-[11px] uppercase font-bold tracking-wider mb-1">
                      Full Name
                    </span>
                    <span className="text-black font-bold text-sm">
                      {user.firstName} {user.lastName || ''}
                    </span>
                  </div>

                  <div className="p-4 bg-[#fbfbfb] rounded-2xl border border-[#eeeeee]">
                    <span className="text-[#8a8a8a] block text-[11px] uppercase font-bold tracking-wider mb-1">
                      Email Address
                    </span>
                    <span className="text-black font-bold text-sm">{user.email}</span>
                  </div>

                  <div className="p-4 bg-[#fbfbfb] rounded-2xl border border-[#eeeeee]">
                    <span className="text-[#8a8a8a] block text-[11px] uppercase font-bold tracking-wider mb-1">
                      Contact Phone
                    </span>
                    <span className="text-black font-bold text-sm">{user.phone || 'Not provided'}</span>
                  </div>

                  <div className="p-4 bg-[#fbfbfb] rounded-2xl border border-[#eeeeee]">
                    <span className="text-[#8a8a8a] block text-[11px] uppercase font-bold tracking-wider mb-1">
                      Role & Tier
                    </span>
                    <span className="text-black font-bold text-sm uppercase">
                      {user.role} Member
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SECURITY & LOGIN */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              {/* Connected Auth Providers */}
              <div className="bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8">
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-black mb-1">
                  Authentication Methods
                </h2>
                <p className="text-xs text-[#5e5e5e] mb-6">
                  Manage the login credentials linked to your customer identity
                </p>

                <div className="space-y-4">
                  {/* Email & Password */}
                  <div className="flex items-center justify-between p-4 bg-[#fbfbfb] border border-[#eeeeee] rounded-2xl">
                    <div className="flex items-center gap-3">
                      <KeyRound className="w-5 h-5 text-black" />
                      <div>
                        <p className="text-xs font-bold text-black uppercase">Email + Password</p>
                        <p className="text-[11px] text-[#5e5e5e]">{user.email}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#e8f5ee] text-[#167a45] rounded-full text-[10px] font-bold uppercase">
                      {user.hasPassword ? 'Configured' : 'Google Direct'}
                    </span>
                  </div>

                  {/* Google OAuth Provider */}
                  <div className="flex items-center justify-between p-4 bg-[#fbfbfb] border border-[#eeeeee] rounded-2xl">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs font-bold text-black uppercase">Google Account</p>
                        <p className="text-[11px] text-[#5e5e5e]">
                          {user.connectedProviders?.includes('GOOGLE')
                            ? 'Connected & Verified'
                            : 'Not Connected'}
                        </p>
                      </div>
                    </div>

                    {user.connectedProviders?.includes('GOOGLE') ? (
                      <button
                        onClick={handleUnlinkGoogle}
                        className="text-xs font-semibold text-[#b91c1c] hover:underline"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <a
                        href="http://localhost:8080/oauth2/authorization/google"
                        className="px-3.5 py-1.5 bg-black hover:bg-[#222222] text-white text-xs font-bold uppercase rounded-full transition-all"
                      >
                        Connect Google
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8">
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-black mb-1">
                  Change Password
                </h2>
                <p className="text-xs text-[#5e5e5e] mb-6">
                  Set a new secure password for email authentication
                </p>

                {passwordMsg && (
                  <div
                    className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                      passwordMsg.type === 'success'
                        ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]'
                        : 'bg-[#fff2f2] border border-[#fecaca] text-[#b91c1c]'
                    }`}
                  >
                    {passwordMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-[11px] font-bold text-black uppercase mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-black uppercase mb-1">
                      New Password (Min 6 chars)
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-black uppercase mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-xs text-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPass}
                    className="px-6 py-2.5 bg-black hover:bg-[#222222] text-white text-xs font-bold uppercase rounded-full transition-all disabled:opacity-50"
                  >
                    {changingPass ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Security Activity Logs */}
              <div className="bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8">
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-black mb-1">
                  Security Activity Log
                </h2>
                <p className="text-xs text-[#5e5e5e] mb-4">
                  Recent sign-in events and account credential modifications
                </p>

                {securityLogs.length === 0 ? (
                  <p className="text-xs text-[#8a8a8a]">No security incidents recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {securityLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-[#fbfbfb] rounded-xl border border-[#f0f0f0] text-xs"
                      >
                        <div>
                          <span className="font-bold text-black uppercase block">{log.action}</span>
                          <span className="text-[11px] text-[#8a8a8a]">{log.details || 'IP authenticated'}</span>
                        </div>
                        <span className="text-[11px] text-[#8a8a8a] font-mono">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-tight text-black">
                    Your Product Reviews
                  </h2>
                  <p className="text-xs text-[#5e5e5e]">Verified reviews submitted on your purchased garments</p>
                </div>
                <span className="text-xs font-bold uppercase text-[#8a8a8a]">
                  {reviews.length} Submitted
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="p-12 text-center bg-[#fcfcfc] border border-[#e5e5e5] rounded-3xl">
                  <Star className="w-12 h-12 text-[#8a8a8a] mx-auto mb-3" />
                  <h3 className="font-bold text-base text-black mb-1">No reviews submitted yet</h3>
                  <p className="text-xs text-[#5e5e5e] mb-4">
                    Once you receive a delivered order, you can rate and review pieces to help other shoppers.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white border border-[#e5e5e5] rounded-2xl p-5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating ? 'fill-black text-black' : 'text-[#e5e5e5]'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="px-2 py-0.5 bg-[#f4f4f4] rounded-full text-[10px] font-bold uppercase text-[#5e5e5e]">
                          {rev.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-black">{rev.title}</h4>
                      <p className="text-xs text-[#5e5e5e] leading-relaxed">{rev.comment}</p>
                      <div className="pt-2 text-[10px] text-[#8a8a8a]">
                        Reviewed on {new Date(rev.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-tight text-black">
                    Notifications
                  </h2>
                  <p className="text-xs text-[#5e5e5e]">Real-time order dispatches, returns, and security updates</p>
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="text-xs font-bold text-black uppercase hover:underline"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-12 text-center bg-[#fcfcfc] border border-[#e5e5e5] rounded-3xl">
                  <CheckCircle2 className="w-12 h-12 text-[#8a8a8a] mx-auto mb-3" />
                  <h3 className="font-bold text-base text-black mb-1">You're all caught up</h3>
                  <p className="text-xs text-[#5e5e5e]">No pending notifications or system messages.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkNotificationRead(notif.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                        notif.isRead
                          ? 'bg-white border-[#e5e5e5] opacity-75'
                          : 'bg-[#fcfcfc] border-black shadow-xs'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-black">{notif.title}</h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[#5e5e5e]">{notif.message}</p>
                        <span className="text-[10px] text-[#8a8a8a] block">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-tight text-black mb-1">
                    Communication Preferences
                  </h2>
                  <p className="text-xs text-[#5e5e5e]">Control the emails and updates you receive</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Order Confirmation & Shipping Updates', defaultChecked: true, required: true },
                    { label: 'Exclusive Collection Drops & Early Access', defaultChecked: true },
                    { label: 'Curated Recommendations & Style Journal', defaultChecked: false },
                    { label: 'Weekly Storefront Newsletter', defaultChecked: false },
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#f4f4f4] text-xs">
                      <div>
                        <p className="font-semibold text-black">{pref.label}</p>
                        {pref.required && (
                          <span className="text-[10px] text-[#8a8a8a]">Transactional (Always active)</span>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        disabled={pref.required}
                        defaultChecked={pref.defaultChecked}
                        className="rounded border-[#e5e5e5] text-black focus:ring-black cursor-pointer disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Deletion / Retention */}
              <div className="bg-[#fff9f9] border border-[#fecaca] rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#b91c1c]">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <h3 className="text-base font-extrabold uppercase tracking-tight">Danger Zone</h3>
                </div>
                <p className="text-xs text-[#7f1d1d] leading-relaxed">
                  Deactivating your account will anonymize your profile, cancel email subscriptions, and unlink
                  authentication providers. In accordance with fiscal compliance, completed financial order records
                  will be safely retained in read-only audit status.
                </p>
                <button
                  onClick={handleAccountDeletion}
                  className="px-5 py-2.5 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold uppercase rounded-full transition-all"
                >
                  Deactivate Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ORDER DETAILS TIMELINE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-[#f4f4f4] flex items-center justify-center"
            >
              ✕
            </button>

            <div className="pb-4 mb-6 border-b border-[#f4f4f4]">
              <span className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-wider block">
                Order Tracking & Invoicing
              </span>
              <h3 className="text-2xl font-extrabold uppercase text-black">
                #{selectedOrder.id}
              </h3>
              <p className="text-xs text-[#5e5e5e] mt-0.5">
                Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Order Timeline Visualizer */}
            <div className="mb-6 p-4 bg-[#fbfbfb] rounded-2xl border border-[#eeeeee]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a8a] block mb-3">
                Delivery Timeline
              </span>
              <div className="grid grid-cols-5 gap-1 text-center">
                {['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].map((step, idx) => {
                  const statuses = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];
                  const currentIdx = statuses.indexOf(selectedOrder.status);
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;
                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                          isDone ? 'bg-black text-white' : 'bg-[#e5e5e5] text-[#8a8a8a]'
                        } ${isCurrent ? 'ring-2 ring-black ring-offset-2' : ''}`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-tight text-black truncate w-full">
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 p-4 bg-[#fbfbfb] rounded-2xl border border-[#eeeeee]">
              <div>
                <span className="font-bold text-[#8a8a8a] uppercase text-[10px] block mb-1">
                  Shipping Destination
                </span>
                <p className="font-semibold text-black">{selectedOrder.customerName}</p>
                <p className="text-[#5e5e5e]">
                  {typeof selectedOrder.shippingAddress === 'string'
                    ? selectedOrder.shippingAddress
                    : `${selectedOrder.shippingAddress?.address || ''}`}
                </p>
                <p className="text-[#5e5e5e]">
                  {typeof selectedOrder.shippingAddress === 'string'
                    ? `${selectedOrder.city || ''}, ${selectedOrder.state || ''} ${selectedOrder.postalCode ? '- ' + selectedOrder.postalCode : ''}`
                    : `${selectedOrder.shippingAddress?.city || selectedOrder.city || ''}, ${selectedOrder.shippingAddress?.state || selectedOrder.state || ''} - ${selectedOrder.shippingAddress?.postalCode || selectedOrder.postalCode || ''}`}
                </p>
              </div>
              <div>
                <span className="font-bold text-[#8a8a8a] uppercase text-[10px] block mb-1">
                  Carrier Tracking
                </span>
                <p className="font-semibold text-black">Express Air (Delhivery / BlueDart)</p>
                <p className="font-mono text-black font-bold">
                  {selectedOrder.trackingNumber || 'TRK-IN-PROCESSING'}
                </p>
                <p className="text-[#5e5e5e] mt-1">Payment Method: {selectedOrder.paymentMethod}</p>
              </div>
            </div>

            {/* Return & Refund Tracker Card */}
            {selectedOrder.returnStatus && selectedOrder.returnStatus !== 'NONE' && (
              <div className={`mb-6 p-4 rounded-2xl border space-y-2.5 ${
                selectedOrder.returnStatus === 'AWAITING_APPROVAL'
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-[#fffbf5] border-[#fed7aa]'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    selectedOrder.returnStatus === 'AWAITING_APPROVAL' ? 'text-amber-900 font-extrabold' : 'text-[#c2410c]'
                  }`}>
                    Return & Refund Tracker
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedOrder.returnStatus === 'AWAITING_APPROVAL'
                      ? 'bg-amber-200 text-amber-900 font-extrabold'
                      : selectedOrder.returnStatus === 'REQUESTED'
                      ? 'bg-[#ffedd5] text-[#9a3412]'
                      : selectedOrder.returnStatus === 'APPROVED'
                      ? 'bg-[#dbeafe] text-[#1e40af]'
                      : selectedOrder.returnStatus === 'REFUNDED'
                      ? 'bg-[#dcfce7] text-[#166534]'
                      : 'bg-[#fee2e2] text-[#991b1b]'
                  }`}>
                    {selectedOrder.returnStatus === 'AWAITING_APPROVAL' ? 'Under Atelier Review' : selectedOrder.returnStatus}
                  </span>
                </div>

                {/* Refund & Logistics Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-xl border border-black/5">
                  {selectedOrder.refundAmount && (
                    <div>
                      <span className="text-[#8a8a8a] text-[10px] uppercase block">Refund Amount:</span>
                      <span className="font-bold text-black">₹{Number(selectedOrder.refundAmount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {selectedOrder.refundUpiId && (
                    <div>
                      <span className="text-[#8a8a8a] text-[10px] uppercase block">Payout UPI:</span>
                      <span className="font-mono text-black">{selectedOrder.refundUpiId}</span>
                    </div>
                  )}
                  {selectedOrder.returnTrackingNumber && (
                    <div>
                      <span className="text-[#8a8a8a] text-[10px] uppercase block">Return Tracking:</span>
                      <span className="font-mono text-black">{selectedOrder.returnTrackingNumber}</span>
                    </div>
                  )}
                  {selectedOrder.refundReference && (
                    <div>
                      <span className="text-[#8a8a8a] text-[10px] uppercase block">Refund Reference:</span>
                      <span className="font-mono text-black">{selectedOrder.refundReference}</span>
                    </div>
                  )}
                </div>

                {selectedOrder.returnReason && (
                  <p className="text-xs text-black font-semibold">
                    Return Reason: <span className="font-normal text-[#5e5e5e]">{selectedOrder.returnReason}</span>
                  </p>
                )}
                {selectedOrder.returnComment && (
                  <p className="text-xs text-black font-semibold">
                    Customer Note: <span className="font-normal text-[#5e5e5e]">{selectedOrder.returnComment}</span>
                  </p>
                )}
                <p className="text-[11px] text-[#5e5e5e] pt-1.5 border-t border-black/5">
                  {selectedOrder.returnStatus === 'AWAITING_APPROVAL' && '⏳ Your high-value return request (> ₹5,000) has been received and routed to our supervisor team for authorization. You will be notified within 24 hours.'}
                  {selectedOrder.returnStatus === 'REQUESTED' && 'Your return request has been submitted and is currently being reviewed by our atelier logistics team. Pickup will be assigned shortly.'}
                  {selectedOrder.returnStatus === 'APPROVED' && '✅ Return request approved! A carrier partner (Delhivery / BlueDart) will pick up the package within 48 hours. Keep items in original packaging.'}
                  {selectedOrder.returnStatus === 'RETURNED' && 'Piece received at our fulfillment center and verified by quality control.'}
                  {selectedOrder.returnStatus === 'REFUNDED' && 'Refund has been successfully processed to your specified payment destination.'}
                  {selectedOrder.returnStatus === 'REJECTED' && 'This return request could not be accepted under our return policy guidelines.'}
                </p>
              </div>
            )}

            {/* Item Breakdown */}
            <div className="space-y-3 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a8a] block">
                Purchased Pieces
              </span>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-[#f4f4f4]">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || item.imageUrl || (item.productId ? `/images/${item.productId}.jpg` : '/images/15970.jpg')}
                      alt={item.productName}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (item.productId && !target.src.includes(`/images/${item.productId}.jpg`)) {
                          target.src = `/images/${item.productId}.jpg`;
                        } else if (!target.src.includes('/images/15970.jpg')) {
                          target.src = '/images/15970.jpg';
                        }
                      }}
                      className="w-12 h-14 object-cover rounded-lg bg-[#f4f4f4]"
                    />
                    <div>
                      <p className="font-semibold text-black">{item.productName}</p>
                      <p className="text-[11px] text-[#8a8a8a]">
                        Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-black">₹{item.finalPrice.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            {/* Order Totals Summary */}
            <div className="pt-3 border-t border-[#f4f4f4] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#5e5e5e]">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-[#167a45]">
                  <span>Promo Discount ({selectedOrder.couponCode || 'PROMO'})</span>
                  <span>-₹{selectedOrder.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-[#5e5e5e]">
                <span>Shipping</span>
                <span>{selectedOrder.shipping === 0 ? 'FREE' : `₹${selectedOrder.shipping}`}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-black pt-2 border-t border-[#f4f4f4]">
                <span>Grand Total</span>
                <span>₹{selectedOrder.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADDRESS ADD/EDIT MODAL */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setAddressModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-[#f4f4f4] flex items-center justify-center"
            >
              ✕
            </button>

            <h3 className="text-xl font-extrabold uppercase tracking-tight text-black mb-1">
              {editingAddressId ? 'Edit Address' : 'New Delivery Address'}
            </h3>
            <p className="text-xs text-[#5e5e5e] mb-6">
              Enter full recipient information for accurate door delivery.
            </p>

            <form onSubmit={handleSaveAddress} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-black uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">Street Address Line 1 *</label>
                <input
                  type="text"
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  placeholder="Flat / House / Suite / Building"
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">Street Address Line 2</label>
                <input
                  type="text"
                  value={addressForm.addressLine2 || ''}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  placeholder="Area / Landmark / Sector"
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-black uppercase mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black uppercase mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black uppercase mb-1">Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <span className="text-[11px] font-bold text-black uppercase">Address Type:</span>
                {(['HOME', 'WORK', 'OTHER'] as const).map((type) => (
                  <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="addrType"
                      checked={addressForm.addressType === type}
                      onChange={() => setAddressForm({ ...addressForm, addressType: type })}
                      className="text-black focus:ring-black"
                    />
                    <span className="text-xs font-semibold">{type}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="defaultShip"
                  checked={addressForm.isDefaultShipping}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefaultShipping: e.target.checked })}
                  className="rounded border-[#e5e5e5] text-black focus:ring-black"
                />
                <label htmlFor="defaultShip" className="text-xs text-[#5e5e5e] cursor-pointer">
                  Set as default shipping address
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-5 py-2.5 bg-[#f4f4f4] hover:bg-[#e5e5e5] rounded-full text-xs font-semibold text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black hover:bg-[#222222] text-white text-xs font-bold uppercase rounded-full"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ORDER RETURN / EXCHANGE WORKFLOW */}
      {orderReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setOrderReturnModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-[#f4f4f4] flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2 text-[#b91c1c]">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
                Request Return / Exchange
              </h3>
            </div>
            <p className="text-xs text-[#5e5e5e] mb-6">
              Order #{orderReturnModal.id} • 7-day hassle-free return window policy
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Primary Reason for Return *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                >
                  <option value="Size did not fit">Size did not fit (Need size exchange)</option>
                  <option value="Fabric / Quality mismatch">Fabric / Quality not as expected</option>
                  <option value="Received incorrect product">Received incorrect piece</option>
                  <option value="Damaged in transit">Damaged or defective</option>
                  <option value="Changed mind">Changed mind</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Additional Feedback or Exchange Size Preference
                </label>
                <textarea
                  rows={3}
                  value={returnComment}
                  onChange={(e) => setReturnComment(e.target.value)}
                  placeholder="Provide any extra details for our logistics team..."
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderReturnModal(null)}
                  className="px-4 py-2 bg-[#f4f4f4] hover:bg-[#e5e5e5] rounded-full text-xs font-semibold text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-5 py-2 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold uppercase rounded-full transition-all disabled:opacity-50"
                >
                  {submittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: WRITE REVIEW MODAL */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-[#e5e5e5] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-[#f4f4f4] flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2 text-black">
              <Star className="w-5 h-5 fill-black" />
              <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
                Review Your Garment
              </h3>
            </div>
            <p className="text-xs text-[#5e5e5e] mb-6">
              {reviewProductName} • Verified Purchase Review
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Overall Rating
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= reviewRating ? 'fill-black text-black' : 'text-[#d4d4d4]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Review Headline *
                </label>
                <input
                  type="text"
                  required
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Exceptional tailoring and fabric weight"
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Review Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Describe the fit, drape, texture, and everyday movement of the piece..."
                  className="w-full px-3.5 py-2.5 bg-[#f4f4f4] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 bg-[#f4f4f4] hover:bg-[#e5e5e5] rounded-full text-xs font-semibold text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-black hover:bg-[#222222] text-white text-xs font-bold uppercase rounded-full transition-all disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
