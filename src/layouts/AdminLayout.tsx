import {
  BookOpen,
  Box,
  Calculator,
  Camera,
  ChevronDown,
  FileText,
  FolderTree,
  Gift,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSettings } from '../context/SettingsContext';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Produk', href: '/admin/products', icon: Package },
  { name: 'Kategori', href: '/admin/categories', icon: FolderTree },
  { name: 'Kalkulator Leads', href: '/admin/calculator-leads', icon: Calculator },
  { name: 'Komponen Kalkulator', href: '/admin/calculator-components', icon: Box },
  { name: 'Dokumen', href: '/admin/documents', icon: FileText },
  { name: 'Artikel', href: '/admin/articles', icon: BookOpen },
  { name: 'Galeri', href: '/admin/gallery', icon: Camera },
  { name: 'FAQ', href: '/admin/faqs', icon: HelpCircle },
  { name: 'Kontak', href: '/admin/contacts', icon: Mail },
  { name: 'Program Referral', href: '/admin/referrals', icon: Gift },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

import { useAuth } from '../context/AuthContext';

export function AdminLayout() {
  const { logout } = useAuth();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    if (confirm('Yakin ingin logout?')) {
      logout(); // Call logout from AuthContext
      navigate('/admin/login'); // Navigate to admin login page
      toast.success('Berhasil logout. Sampai jumpa!');
      // Use setTimeout to ensure toast is shown before navigation
      setTimeout(() => {
        navigate('/'); // Navigate to the public home page after a delay
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 bg-white border-r border-gray-200 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
          <Link to="/admin" className="flex items-center gap-2">
            {settings.siteLogo ? (
              <img
                src={settings.siteLogo}
                alt={settings.siteName}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: settings.brandColor || '#EB216A' }}>
                <span className="text-white text-lg">A</span>
              </div>
            )}
            <span className="text-xl text-gray-900">Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
                  ? 'bg-[#EB216A] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 cursor-pointer">
            <div className="w-10 h-10 bg-[#EB216A]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#EB216A]">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500">admin@amagriya.com</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl text-gray-900 hidden lg:block">
            Amagriya Gorden - Admin Panel
          </h1>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}