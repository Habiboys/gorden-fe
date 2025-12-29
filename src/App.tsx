import { HelmetProvider } from 'react-helmet-async';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AutoBackendTest } from './components/AutoBackendTest';
import { BackendTestPanel } from './components/BackendTestPanel';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { ScrollToTop } from './components/ScrollToTop';
import { ConfirmProvider } from './context/ConfirmContext';
import { AdminLayout } from './layouts/AdminLayout';
import ArticleDetailPage from './pages/ArticleDetailPage';
import ArticlesPage from './pages/ArticlesPage';
import CalculatorPage from './pages/CalculatorPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ContactPage from './pages/ContactPage';
import GalleryPage from './pages/GalleryPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProductDetail from './pages/ProductDetail';
import ProductListing from './pages/ProductListing';
import ProfilePage from './pages/ProfilePage';
import ReferralPage from './pages/ReferralPage';
import RegisterPage from './pages/RegisterPage';
import VerificationPendingPage from './pages/VerificationPendingPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AdminArticleEdit from './pages/admin/AdminArticleEdit';
import AdminArticles from './pages/admin/AdminArticles';
import AdminCalculatorComponents from './pages/admin/AdminCalculatorComponents';
import AdminCalculatorLeads from './pages/admin/AdminCalculatorLeads';
import AdminCalculatorTypes from './pages/admin/AdminCalculatorTypes';
import AdminCategories from './pages/admin/AdminCategories';
import AdminContacts from './pages/admin/AdminContacts';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDocumentCreate from './pages/admin/AdminDocumentCreate';
import AdminDocumentDetail from './pages/admin/AdminDocumentDetail';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminFAQ from './pages/admin/AdminFAQ';
import AdminGallery from './pages/admin/AdminGallery';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminProducts from './pages/admin/AdminProducts';
import AdminReferrals from './pages/admin/AdminReferrals';
import AdminSettings from './pages/admin/AdminSettings';

import { CartSidebar } from './components/CartSidebar';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { WishlistProvider } from './context/WishlistContext';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <SettingsProvider>
            <HelmetProvider>
              <ConfirmProvider>
                <Router>
                  <ScrollToTop />
                  <CartSidebar />
                  <FloatingWhatsApp />
                  <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    gap={12}
                    toastOptions={{
                      unstyled: false,
                      classNames: {
                        toast: 'bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-2xl font-sans',
                        title: 'text-gray-900 font-semibold',
                        description: 'text-gray-600',
                        actionButton: 'bg-gradient-to-r from-[#EB216A] to-pink-600 text-white rounded-lg px-4 py-2 hover:opacity-90 transition-opacity',
                        cancelButton: 'bg-gray-100 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-200 transition-colors',
                        closeButton: 'bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg',
                        success: 'border-l-4 border-l-emerald-500',
                        error: 'border-l-4 border-l-red-500',
                        warning: 'border-l-4 border-l-amber-500',
                        info: 'border-l-4 border-l-blue-500',
                      },
                      duration: 4000,
                    }}
                  />
                  <div className="min-h-screen bg-white">
                    <Routes>
                      {/* Backend Test Routes - TEMPORARY FOR TESTING */}
                      <Route path="/test-backend" element={<BackendTestPanel />} />
                      <Route path="/auto-test" element={<AutoBackendTest />} />

                      <Route path="/" element={<><Navbar /><HomePage /><Footer /></>} />
                      <Route path="/products" element={<><Navbar /><ProductListing /><Footer /></>} />
                      <Route path="/product/:id" element={<><Navbar /><ProductDetail /><Footer /></>} />
                      <Route path="/referral" element={<><Navbar /><ReferralPage /><Footer /></>} />
                      <Route path="/calculator" element={<><Navbar /><CalculatorPage /><Footer /></>} />
                      <Route path="/gallery" element={<><Navbar /><GalleryPage /><Footer /></>} />
                      <Route path="/contact" element={<><Navbar /><ContactPage /><Footer /></>} />
                      <Route path="/articles" element={<><Navbar /><ArticlesPage /><Footer /></>} />
                      <Route path="/articles/:slug" element={<><Navbar /><ArticleDetailPage /><Footer /></>} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/change-password" element={<ChangePasswordPage />} />
                      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
                      <Route path="/verification-pending" element={<VerificationPendingPage />} />

                      {/* Protected Admin Routes */}
                      <Route element={<ProtectedAdminRoute />}>
                        <Route path="/admin" element={<AdminLayout />}>
                          <Route index element={<AdminDashboard />} />
                          <Route path="dashboard" element={<AdminDashboard />} />
                          <Route path="products" element={<AdminProducts />} />
                          <Route path="products/add" element={<AdminProductForm />} />
                          <Route path="products/edit/:id" element={<AdminProductForm />} />
                          <Route path="categories" element={<AdminCategories />} />
                          <Route path="settings" element={<AdminSettings />} />
                          <Route path="calculator-leads" element={<AdminCalculatorLeads />} />
                          <Route path="calculator-components" element={<AdminCalculatorComponents />} />
                          <Route path="calculator-types" element={<AdminCalculatorTypes />} />
                          <Route path="documents" element={<AdminDocuments />} />
                          <Route path="documents/new" element={<AdminDocumentCreate />} />
                          <Route path="documents/edit/:id" element={<AdminDocumentCreate />} />
                          <Route path="documents/:id" element={<AdminDocumentDetail />} />
                          <Route path="articles" element={<AdminArticles />} />
                          <Route path="articles/new" element={<AdminArticleEdit />} />
                          <Route path="articles/:id/edit" element={<AdminArticleEdit />} />
                          <Route path="gallery" element={<AdminGallery />} />
                          <Route path="faqs" element={<AdminFAQ />} />
                          <Route path="contacts" element={<AdminContacts />} />
                          <Route path="referrals" element={<AdminReferrals />} />
                        </Route>
                      </Route>
                    </Routes>
                  </div>
                </Router>
              </ConfirmProvider>
            </HelmetProvider>
          </SettingsProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}