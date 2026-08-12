import { CartProvider } from '@/cart';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { WishlistProvider } from '@/hooks/useWishlist';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RouteGate from '@/components/RouteGate';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import WhatsAppButton from '@/components/WhatsAppButton';
import HomePage from '@/pages/HomePage';
const AdminDashboard = lazy(() => import('@/components/AdminDashboard'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const AllHampersPage = lazy(() => import('@/pages/AllHampersPage'));
const BuildYourOwnPage = lazy(() => import('@/pages/BuildYourOwnPage'));
const OffersPage = lazy(() => import('@/pages/OffersPage'));
const CorporatePage = lazy(() => import('@/pages/CorporatePage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const VendorPage = lazy(() => import('@/pages/VendorPage'));
const CustomerDashboard = lazy(() => import('@/pages/CustomerDashboard'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('@/pages/OrderConfirmationPage'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));
const BestSellersPage = lazy(() => import('@/pages/BestSellersPage'));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'));
const HandPackedPage = lazy(() => import('@/pages/HandPackedPage'));
const SameDayDeliveryPage = lazy(() => import('@/pages/SameDayDeliveryPage'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster
              position="top-right"
              reverseOrder={false}
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#57222C',
                  color: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '12px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 15px 35px -5px rgba(87,34,44,0.35)',
                },
              }}
            />
            <Router>
            <div className="min-h-screen bg-cream-50 dark:bg-gray-900 transition-colors">
              <Navbar />
              <Suspense fallback={<main className="min-h-screen pt-24" aria-busy="true" />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/all-hampers" element={<AllHampersPage />} />
                  <Route path="/best-sellers" element={<BestSellersPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/hand-packed" element={<HandPackedPage />} />
                  <Route path="/same-day-delivery" element={<SameDayDeliveryPage />} />
                  <Route path="/build-your-own" element={<BuildYourOwnPage />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/corporate" element={<CorporatePage />} />
                  <Route path="/vendor" element={<VendorPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/customer/*" element={<RouteGate><CustomerDashboard /></RouteGate>} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/admin/*" element={<RouteGate admin><main className="min-h-screen px-4 pt-24 sm:px-7"><AdminDashboard /></main></RouteGate>} />
                </Routes>
              </Suspense>
              <Footer />
              <CartDrawer />
              <WhatsAppButton />
            </div>
          </Router>
        </WishlistProvider>
      </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
