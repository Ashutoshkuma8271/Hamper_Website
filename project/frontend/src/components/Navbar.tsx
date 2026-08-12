import { useEffect, useState, useCallback } from 'react';
import { Search, Heart, UserRound, ShoppingBag, Menu, X, Sparkles, LogOut, Moon, Sun } from 'lucide-react';
import { useCart } from '@/cart';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useWishlist } from '@/hooks/useWishlist';
import { supabase } from '@/lib/supabase';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { label: 'Home', href: '/' },
  { label: 'All Hampers', href: '/all-hampers' },
  { label: 'Build Your Own', href: '/build-your-own' },
  { label: 'Offers', href: '/offers' },
  { label: 'Corporate', href: '/corporate' },
  { label: 'Vendor Zone', href: '/vendor' },
  { label: 'About', href: '/about' },
];

export default function Navbar() {
  const { count, open } = useCart();
  const { wishlistCount } = useWishlist();
  const { session, profile, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 24);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const isVendor = profile?.role === 'vendor';
  const isStoreAdmin = profile?.role === 'admin' || isAdmin;
  const logoLink = isVendor ? '/vendor' : isStoreAdmin ? '/admin' : '/';

  const roleLinks = isVendor
    ? [{ label: 'Vendor Studio', href: '/vendor' }]
    : isStoreAdmin
    ? [{ label: 'Admin Control Panel', href: '/admin' }]
    : links;

  return (
    <header
      role="banner"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm dark:bg-gray-900/95 dark:border-gray-700'
          : 'bg-white/95 backdrop-blur-md border-b border-gray-100 dark:bg-gray-900/95 dark:border-gray-800'
      }`}
    >
      <nav role="navigation" aria-label="Main Navigation" className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link to={logoLink} className="shrink-0 font-display text-xl font-bold tracking-tight text-wine-800 transition-colors hover:text-wine-600 dark:text-cream-50 dark:hover:text-gold-300" aria-label="A_S Hamper home">
          A_S Hamper
        </Link>

        <div className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-2">
          {roleLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                location.pathname === l.href
                  ? 'bg-wine-600 text-cream-50 shadow-sm dark:bg-wine-500'
                  : 'text-gray-700 hover:bg-wine-600/7 hover:text-wine-700 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-gold-300'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden md:flex items-center gap-2 h-10 w-48 lg:w-56 rounded-full border border-gray-200 bg-gray-50 px-3 focus-within:border-wine-500 focus-within:ring-2 focus-within:ring-wine-500/20 transition-all dark:bg-gray-800 dark:border-gray-700 dark:focus-within:border-wine-400">
            <Search className="h-4 w-4 text-gray-400 shrink-0" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
              aria-label="Search hampers"
            />
          </div>
          
          <button 
            onClick={toggleTheme}
            className="hidden sm:flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-800" 
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" strokeWidth={2} /> : <Sun className="h-5 w-5" strokeWidth={2} />}
          </button>
          
          <Link to="/wishlist" className="relative hidden sm:flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Wishlist">
            <Heart className={`h-5 w-5 ${wishlistCount > 0 ? 'text-wine-600 fill-wine-600 dark:text-gold-300 dark:fill-gold-300' : ''}`} strokeWidth={2} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-wine-600 text-[10px] font-semibold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          
          {session ? (
            <Link
              to={profile?.role === 'vendor' ? '/vendor' : isAdmin ? '/admin' : '/profile'}
              className="hidden sm:flex items-center justify-center h-10 w-10 rounded-full bg-wine-600 text-white text-sm font-semibold overflow-hidden ring-2 ring-gold-400/40 hover:ring-gold-400 transition-all"
              aria-label="Account"
              title={
                profile?.role === 'vendor'
                  ? `Vendor Studio (${profile?.business_name || session.user.email})`
                  : profile?.full_name || 'Account'
              }
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Account" className="h-full w-full object-cover" />
              ) : (
                (profile?.full_name || profile?.business_name || session.user.email || 'A').charAt(0).toUpperCase()
              )}
            </Link>
          ) : (
            <Link to="/profile" className="hidden sm:flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Sign in">
              <UserRound className="h-5 w-5" strokeWidth={2} />
            </Link>
          )}
          
          <button onClick={open} className="relative flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Open cart">
            <ShoppingBag className="h-5 w-5" strokeWidth={2} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-wine-600 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </button>
          
          <button onClick={toggleMenu} className="lg:hidden flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-md animate-fade-in dark:bg-gray-900/95 dark:border-gray-700 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                onClick={closeMenu}
                className={`rounded-xl px-3 py-3 text-base font-medium transition-colors ${
                  location.pathname === l.href
                    ? 'bg-wine-600 text-cream-50 dark:bg-wine-500'
                    : 'text-gray-700 hover:bg-wine-600/7 hover:text-wine-600 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-gold-300'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={closeMenu}
              className="py-3 text-base text-gray-700 border-b border-gray-100 hover:text-wine-600 transition-colors dark:text-gray-300 dark:border-gray-700 dark:hover:text-wine-400"
            >
              Account
            </Link>
            <button
              onClick={() => {
                toggleTheme();
              }}
              className="py-3 text-base text-gray-700 border-b border-gray-100 hover:text-wine-600 transition-colors dark:text-gray-300 dark:border-gray-700 dark:hover:text-wine-400 flex items-center gap-2"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" strokeWidth={2} /> : <Sun className="h-4 w-4" strokeWidth={2} />}
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
            {session && (
              <button
                onClick={() => {
                  if (supabase) supabase.auth.signOut();
                  closeMenu();
                }}
                className="mt-2 inline-flex items-center gap-2 py-3 text-base text-wine-600 hover:text-wine-700 transition-colors dark:text-wine-400 dark:hover:text-wine-300"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} /> Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
