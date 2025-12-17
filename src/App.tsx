import { HelmetProvider } from 'react-helmet-async';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AutoBackendTest } from './components/AutoBackendTest';
import { BackendTestPanel } from './components/BackendTestPanel';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { ScrollToTop } from './components/ScrollToTop';
import { ConfirmProvider } from './context/ConfirmContext';
import { AdminLayout } from './layouts/AdminLayout';
import ArticleDetailPage from './pages/ArticleDetailPage';
import ArticlesPage from './pages/ArticlesPage';
import CalculatorPage from './pages/CalculatorPage';
import GalleryPage from './pages/GalleryPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProductDetail from './pages/ProductDetail';
import ProductListing from './pages/ProductListing';
import ReferralPage from './pages/ReferralPage';
import RegisterPage from './pages/RegisterPage';
import AdminArticles from './pages/admin/AdminArticles';
import AdminCalculatorComponents from './pages/admin/AdminCalculatorComponents';
import AdminCalculatorLeads from './pages/admin/AdminCalculatorLeads';
import AdminCategories from './pages/admin/AdminCategories';
import AdminContacts from './pages/admin/AdminContacts';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminFAQ from './pages/admin/AdminFAQ';
import AdminGallery from './pages/admin/AdminGallery';
import AdminLogin from './pages/admin/AdminLogin';
import AdminProducts from './pages/admin/AdminProducts';
import AdminReferrals from './pages/admin/AdminReferrals';
import AdminSettings from './pages/admin/AdminSettings';

import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <HelmetProvider>
          <ConfirmProvider>
            <Router>
              <ScrollToTop />
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
                  <Route path="/articles" element={<><Navbar /><ArticlesPage /><Footer /></>} />
                  <Route path="/articles/:slug" element={<><Navbar /><ArticleDetailPage /><Footer /></>} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Admin Login */}
                  <Route path="/admin/login" element={<AdminLogin />} />

                  {/* Protected Admin Routes */}
                  <Route element={<ProtectedAdminRoute />}>
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="calculator-leads" element={<AdminCalculatorLeads />} />
                      <Route path="calculator-components" element={<AdminCalculatorComponents />} />
                      <Route path="documents" element={<AdminDocuments />} />
                      <Route path="articles" element={<AdminArticles />} />
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
    </AuthProvider>
  );
}