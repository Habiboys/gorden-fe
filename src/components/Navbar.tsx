import logoWhite from 'figma:asset/729ffa7b27b7c7977cedc406f32ba754f846d200.png';
import logo from 'figma:asset/b13089223dffdf43231fd2882ccaadb8c454e1f0.png';
import { LayoutDashboard, LogOut, Menu, ShoppingCart, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useConfirm } from '../context/ConfirmContext';
import { useSettings } from '../context/SettingsContext';
import { Button } from './ui/button';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { openCart, getItemCount } = useCart();
  const { confirm } = useConfirm();

  const cartItemCount = getItemCount();

  // Check if current page should always have solid navbar
  const isAlwaysSolid = location.pathname !== '/';

  const menuItems = [
    { name: 'Beranda', path: '/' },
    { name: 'Produk', path: '/products' },
    { name: 'Program Referal', path: '/referral' },
    { name: 'Kalkulator', path: '/calculator' },
    { name: 'Galeri', path: '/gallery' },
    { name: 'Artikel', path: '/articles' },
    { name: 'Kontak', path: '/contact' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsProfileOpen(false);
    if (isProfileOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileOpen]);

  // Determine if navbar should appear solid
  const isSolidNav = isAlwaysSolid || isScrolled;

  // Get logo source - use settings logo if available, else use default
  const showDefaultLogo = !settings.siteLogo;

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Logout',
      description: 'Yakin ingin keluar dari akun?',
      confirmText: 'Ya, Keluar',
      cancelText: 'Batal',
      variant: 'destructive'
    });

    if (confirmed) {
      logout();
      setIsProfileOpen(false);
      navigate('/');
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isSolidNav
      ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
      : 'bg-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              {showDefaultLogo ? (
                <img
                  src={isSolidNav ? logo : logoWhite}
                  alt={settings.siteName}
                  className="h-12 w-auto"
                />
              ) : (
                <img
                  src={settings.siteLogo}
                  alt={settings.siteName}
                  className="h-12 w-auto object-contain"
                />
              )}
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-12">
            {menuItems.map((item) => {
              const isActive = item.path.startsWith('#') ? false : location.pathname === item.path;
              const isHash = item.path.startsWith('#');

              return isHash ? (
                <a
                  key={item.name}
                  href={item.path}
                  className={`text-sm tracking-wide transition-colors relative group py-2 ${isSolidNav
                    ? 'text-gray-600 hover:text-[#EB216A]'
                    : 'text-white/90 hover:text-white'
                    }`}
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-300 ${isSolidNav ? 'bg-[#EB216A]' : 'bg-white'
                    }`} />
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-sm tracking-wide transition-colors relative group py-2 ${isSolidNav
                    ? isActive
                      ? 'text-[#EB216A]'
                      : 'text-gray-600 hover:text-[#EB216A]'
                    : 'text-white/90 hover:text-white'
                    }`}
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-0 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    } h-px ${isSolidNav ? 'bg-[#EB216A]' : 'bg-white'}`} />
                </Link>
              );
            })}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2">
            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={openCart}
              className={`hover:bg-transparent relative group transition-colors ${isSolidNav
                ? 'text-gray-900 hover:text-[#EB216A]'
                : 'text-white hover:text-white'
                }`}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EB216A] rounded-full text-white text-xs flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Button>

            <div className={`w-px h-6 mx-2 hidden lg:block transition-colors ${isSolidNav ? 'bg-gray-200' : 'bg-white/20'
              }`} />

            {/* Auth Section */}
            {isAuthenticated ? (
              /* Profile Dropdown when logged in */
              <div className="relative hidden lg:block">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileOpen(!isProfileOpen);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isSolidNav
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm max-w-[120px] truncate">{user?.name || 'User'}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    {isAdmin ? (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profil Saya
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Login/Register buttons hidden as per request */
              null
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className={`lg:hidden transition-colors ${isSolidNav ? 'text-gray-900' : 'text-white'
                }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`lg:hidden py-6 border-t transition-colors ${isSolidNav ? 'border-gray-100 bg-white' : 'border-white/10 bg-black/20 backdrop-blur-xl'
            }`}>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = item.path.startsWith('#') ? false : location.pathname === item.path;
                const isHash = item.path.startsWith('#');

                return isHash ? (
                  <a
                    key={item.name}
                    href={item.path}
                    className={`block py-3 transition-colors border-l-2 border-transparent pl-4 ${isSolidNav
                      ? 'text-gray-600 hover:text-[#EB216A] hover:border-[#EB216A]'
                      : 'text-white/90 hover:text-white hover:border-white'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block py-3 transition-colors border-l-2 pl-4 ${isActive ? 'border-[#EB216A]' : 'border-transparent'
                      } ${isSolidNav
                        ? isActive
                          ? 'text-[#EB216A]'
                          : 'text-gray-600 hover:text-[#EB216A] hover:border-[#EB216A]'
                        : 'text-white/90 hover:text-white hover:border-white'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <div className="pt-4 pl-4 space-y-2">
                {isAuthenticated ? (
                  <>
                    {isAdmin ? (
                      <Link to="/admin" className="block">
                        <Button
                          variant="outline"
                          className={`w-full rounded-full transition-colors ${isSolidNav
                            ? 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50'
                            : 'bg-transparent border-white/40 text-white hover:bg-white/10'
                            }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/profile" className="block">
                        <Button
                          variant="outline"
                          className={`w-full rounded-full transition-colors ${isSolidNav
                            ? 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50'
                            : 'bg-transparent border-white/40 text-white hover:bg-white/10'
                            }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Profil Saya
                        </Button>
                      </Link>
                    )}
                    <Button
                      className="w-full rounded-full bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Keluar
                    </Button>
                  </>
                ) : (
                  /* Login/Register buttons hidden in mobile menu too */
                  null
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav >
  );
}