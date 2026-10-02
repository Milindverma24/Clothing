import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ShopProvider, useShop } from './context/ShopContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { AuthModal } from './components/auth/AuthModal';
import { HomePage } from './pages/Home/HomePage';
import { ShopPage } from './pages/Shop/ShopPage';
import { ProductDetailPage } from './pages/Product/ProductDetailPage';
import { CollectionsPage } from './pages/Collections/CollectionsPage';
import { WishlistPage } from './pages/Wishlist/WishlistPage';
import { CheckoutPage } from './pages/Checkout/CheckoutPage';
import { AccountPage } from './pages/Account/AccountPage';
import { SearchPage } from './pages/Search/SearchPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/Auth/ResetPasswordPage';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { ChatbotWidget } from './components/chat/ChatbotWidget';
import { AppSplashScreen } from './components/common/AppSplashScreen';
import { Check } from 'lucide-react';

const ToastNotification: React.FC = () => {
  const { toastMessage } = useShop();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <Check className="w-3.5 h-3.5 text-white" />
      <span>{toastMessage}</span>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-black font-sans antialiased">
      <AppSplashScreen />
      {!isAdmin && <Navbar />}

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage key={location.pathname} />} />
          <Route path="/shop/:gender" element={<ShopPage key={location.pathname} />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:slug" element={<CollectionsPage key={location.pathname} />} />
          <Route path="/products/:slug" element={<ProductDetailPage key={location.pathname} />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          
          {/* Customer Auth & Account Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/account/*" element={<AccountPage />} />
          <Route path="/profile" element={<AccountPage />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </div>

      <CartDrawer />
      <AuthModal />
      <ToastNotification />
      {!isAdmin && <ChatbotWidget />}

      {!isAdmin && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ShopProvider>
        <Router>
          <AppLayout />
        </Router>
      </ShopProvider>
    </AuthProvider>
  );
};

export default App;
