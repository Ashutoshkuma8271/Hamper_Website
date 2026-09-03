import { useEffect, useState, useCallback, type FormEvent } from 'react';
import {
  Search,
  Heart,
  UserRound,
  ShoppingBag,
  Moon,
  Sun,
  Sparkles,
  ChevronRight,
  Gift,
  Package,
  Store,
  ShieldCheck,
  LogOut,
  X,
  Compass,
  Crown,
} from 'lucide-react';
import { useCart } from '@/cart';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useWishlist } from '@/hooks/useWishlist';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '@/components/BrandLogo';

interface NavLinkItem {
  label: string;
  href: string;
  badge?: string;
  icon?: typeof Gift;
}

const mainNavLinks: NavLinkItem[] = [
  { label: 'Home', href: '/', icon: Sparkles },
  { label: 'All Hampers', href: '/all-hampers', icon: Gift },
  { label: 'Build Your Own', href: '/build-your-own', icon: Package },
  { label: 'Corporate', href: '/corporate', icon: Crown },
  { label: 'Vendor Zone', href: '/vendor', icon: Store },
  { label: 'About', href: '/about', icon: Compass },
];

export default function Navbar() {
  const { count, open } = useCart();
  const { wishlistCount } = useWishlist();
  const { session, profile, isAdmin, isVendor, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 15);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Lock body scroll and handle escape key when mobile menu is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/all-hampers?search=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
    }
  };

  const isStoreAdmin = profile?.role === 'admin' || isAdmin;
  const logoLink = isVendor ? '/vendor' : isStoreAdmin ? '/admin' : '/';

  const roleLinks: NavLinkItem[] = isVendor
    ? [
        { label: 'Vendor Studio', href: '/vendor', icon: Store },
        { label: 'Live Storefront', href: '/', icon: Gift },
        { label: 'All Hampers', href: '/all-hampers', icon: Package },
      ]
    : isStoreAdmin
    ? [
        { label: 'Admin Dashboard', href: '/admin', icon: ShieldCheck },
        { label: 'Live Storefront', href: '/', icon: Gift },
        { label: 'All Hampers', href: '/all-hampers', icon: Package },
      ]
    : mainNavLinks;

  const showWishlistBadge = wishlistCount > 0;
  const showCartBadge = count > 0;
  const accountLink = isVendor ? '/vendor' : isAdmin ? '/admin' : '/profile';
  const userInitial = (profile?.full_name || profile?.business_name || session?.user?.email || 'A').charAt(0).toUpperCase();

  return (
    <header
      role="banner"
      className={`navbar fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#FAF5E8]/98 dark:bg-[#140508]/98 backdrop-blur-md border-b border-[#E5C57B]/50 dark:border-[#33020A] shadow-[0_4px_24px_rgba(68,4,15,0.08)] py-2 sm:py-2.5'
          : 'bg-[#FAF5E8]/95 dark:bg-[#140508]/95 backdrop-blur-sm border-b border-[#E5C57B]/30 dark:border-[#33020A]/60 py-2.5 sm:py-3.5'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2.5 sm:gap-4 lg:gap-8 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          to={logoLink}
          onClick={closeMenu}
          className="shrink-0 flex items-center transition-transform hover:scale-[1.01] active:scale-95 focus:outline-none"
          aria-label="A_S Hamper luxury artisan gifts home"
        >
          <BrandLogo variant="horizontal" size="sm" />
        </Link>

        {/* Desktop Navigation Links - Fraunces Display Font with Subtle Gold Active Indicator */}
        <nav
          role="navigation"
          aria-label="Main Navigation"
          className="navbar hidden lg:flex items-center gap-1 xl:gap-2.5"
        >
          {roleLinks.map((l) => {
            const isActive = location.pathname === l.href;
            return (
              <Link
                key={l.href}
                to={l.href}
                className={`relative px-3.5 py-2 text-[15px] xl:text-[16px] font-display font-medium tracking-[0.015em] transition-all duration-200 whitespace-nowrap group rounded-full ${
                  isActive
                    ? 'text-[#57222C] font-semibold dark:text-[#FBDE9C] bg-[#FBDE9C]/30 dark:bg-white/5 shadow-xs'
                    : 'text-[#44040F]/85 hover:text-[#57222C] hover:bg-[#FAF5E8] dark:text-[#FAF5E8]/85 dark:hover:text-[#FBDE9C] dark:hover:bg-white/5'
                }`}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {l.label}
                  {l.badge && (
                    <span className="ml-1 inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-sans font-bold bg-[#E5C57B] text-[#44040F] uppercase tracking-wider">
                      {l.badge}
                    </span>
                  )}
                </span>

                {/* Subtle Gold Active Link Indicator */}
                {isActive && (
                  <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[#C99738] to-transparent rounded-full shadow-[0_1px_4px_rgba(201,151,56,0.5)]" />
                )}

                {/* Hover subtle gold accent line */}
                {!isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-[#C99738]/60 rounded-full transition-all duration-300 group-hover:w-3/5" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions Toolbar with Touch-Friendly Sizing (Min 44px) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center gap-2 h-10 lg:h-10.5 w-36 lg:w-48 xl:w-56 rounded-full border border-[#E5C57B]/80 bg-white/90 px-3.5 focus-within:border-[#7F011F] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7F011F]/15 transition-all dark:bg-[#1F090E] dark:border-[#461C25] dark:focus-within:border-[#FBDE9C] shadow-xs"
          >
            <Search className="h-4 w-4 text-[#44040F]/60 dark:text-[#FBDE9C]/70 shrink-0" strokeWidth={2} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hampers..."
              className="w-full bg-transparent text-xs sm:text-[13px] text-[#44040F] outline-none placeholder:text-[#44040F]/45 dark:text-[#FAF5E8] dark:placeholder:text-[#FAF5E8]/40"
              aria-label="Search hampers"
            />
          </form>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] h-11 w-11 rounded-full text-[#44040F] bg-white/70 dark:bg-white/5 border border-[#E5C57B]/80 hover:border-[#C99738] hover:bg-[#FBDE9C]/30 active:scale-95 transition-all dark:text-[#FBDE9C] dark:border-[#461C25] shrink-0 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#C99738]/40"
            aria-label="Toggle dark/light theme"
            title={theme === 'light' ? 'Switch to Dark luxury mode' : 'Switch to Light mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-4.5 w-4.5 text-[#44040F]" strokeWidth={2} />
            ) : (
              <Sun className="h-4.5 w-4.5 text-[#FBDE9C]" strokeWidth={2} />
            )}
          </button>

          {/* Wishlist Link */}
          <Link
            to="/wishlist"
            className="relative flex items-center justify-center min-h-[44px] min-w-[44px] h-11 w-11 rounded-full text-[#44040F] bg-white/70 dark:bg-white/5 border border-[#E5C57B]/80 hover:border-[#7F011F] hover:bg-[#FBDE9C]/30 active:scale-95 transition-all dark:text-[#FBDE9C] dark:border-[#461C25] shrink-0 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#C99738]/40"
            aria-label="View Wishlist"
            title="Wishlist"
          >
            <Heart
              className={showWishlistBadge ? 'h-5 w-5 text-[#7F011F] fill-[#7F011F] dark:text-[#FBDE9C] dark:fill-[#FBDE9C]' : 'h-5 w-5 text-[#44040F] dark:text-[#FBDE9C]'}
              strokeWidth={2}
            />
            {showWishlistBadge && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-[#7F011F] text-[10px] font-sans font-black text-[#FBDE9C] border-2 border-[#FAF5E8] dark:border-[#140508] shadow-sm animate-pulse">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* User Account / Profile */}
          {session ? (
            <Link
              to={accountLink}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-[#57222C] text-[#FBDE9C] text-sm font-display font-bold ring-2 ring-[#FBDE9C] hover:ring-[#C99738] active:scale-95 transition-all shadow-md shrink-0 overflow-hidden"
              aria-label="Account profile"
              title={
                profile?.role === 'vendor'
                  ? `Vendor Studio (${profile?.business_name || session.user.email})`
                  : profile?.full_name || 'My Account'
              }
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full rounded-full object-cover" />
              ) : (
                userInitial
              )}
            </Link>
          ) : (
            <Link
              to="/profile"
              className="flex items-center justify-center min-h-[44px] min-w-[44px] h-11 w-11 rounded-full text-[#44040F] bg-white/70 dark:bg-white/5 border border-[#E5C57B]/80 hover:border-[#C99738] hover:bg-[#FBDE9C]/30 active:scale-95 transition-all dark:text-[#FBDE9C] dark:border-[#461C25] shrink-0 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#C99738]/40"
              aria-label="Sign in to your account"
              title="Sign In / Profile"
            >
              <UserRound className="h-5 w-5" strokeWidth={2} />
            </Link>
          )}

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={open}
            className="relative flex items-center justify-center min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-[#57222C] dark:bg-[#7F011F] text-[#FBDE9C] hover:bg-[#44040F] active:scale-95 transition-all shadow-[0_3px_14px_rgba(68,4,15,0.28)] border border-[#E5C57B]/70 shrink-0 focus:outline-none focus:ring-2 focus:ring-[#FBDE9C]/60"
            aria-label="Open cart drawer"
            title="Shopping Cart"
          >
            <ShoppingBag className="h-5 w-5 text-[#FBDE9C]" strokeWidth={2} />
            {showCartBadge && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-[#FBDE9C] text-[10.5px] font-sans font-black text-[#57222C] border-2 border-[#57222C] shadow-md">
                {count}
              </span>
            )}
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={toggleMenu}
            className="navbar lg:hidden relative flex items-center justify-center min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-white/80 dark:bg-white/5 border border-[#E5C57B]/90 text-[#57222C] hover:bg-[#FBDE9C]/30 transition-all duration-300 dark:text-[#FBDE9C] dark:border-[#461C25] shrink-0 focus:outline-none focus:ring-2 focus:ring-[#57222C]/30 shadow-xs"
            aria-label={menuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
            aria-expanded={menuOpen}
            aria-controls="luxury-offcanvas-drawer"
          >
            <div className="relative w-5 h-4 flex flex-col justify-between py-0.5">
              <span
                className={`h-0.5 w-full bg-[#57222C] dark:bg-[#FBDE9C] rounded-full transition-all duration-300 ease-out origin-top-left ${
                  menuOpen ? 'rotate-45 translate-x-1 -translate-y-0.5' : ''
                }`}
              />
              <span
                className={`h-0.5 w-full bg-[#57222C] dark:bg-[#FBDE9C] rounded-full transition-all duration-200 ease-out ${
                  menuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                }`}
              />
              <span
                className={`h-0.5 w-full bg-[#57222C] dark:bg-[#FBDE9C] rounded-full transition-all duration-300 ease-out origin-bottom-left ${
                  menuOpen ? '-rotate-45 translate-x-1 translate-y-0.5' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Clean Wine-Red Off-Canvas Mobile Drawer */}
      {menuOpen && (
        <div
          id="luxury-offcanvas-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Site Navigation Drawer"
          className="fixed inset-0 z-50 lg:hidden flex justify-end animate-fade-in"
        >
          {/* Frosted Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-[#0E0104]/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Off-Canvas Slide-in Panel */}
          <aside
            className="relative z-10 flex flex-col w-[85vw] max-w-sm h-full bg-gradient-to-b from-[#2B020A] via-[#1C0207] to-[#120004] text-[#FAF5E8] shadow-[0_0_50px_rgba(0,0,0,0.8)] border-l border-[#C99738]/40 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5C57B]/20 bg-[#220106]/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-[#E5C57B]/15 border border-[#E5C57B]/40 grid place-items-center text-[#FBDE9C]">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="font-display text-lg font-semibold tracking-wide text-[#FBDE9C]">
                  A_S Hamper
                </span>
              </div>

              <button
                type="button"
                onClick={closeMenu}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] h-10 w-10 rounded-full text-[#FAF5E8]/80 hover:text-white bg-white/10 hover:bg-white/20 border border-[#E5C57B]/30 transition-all active:scale-95"
                aria-label="Close navigation drawer"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Mobile Search Input */}
              <form onSubmit={handleSearchSubmit} className="relative flex items-center h-11 w-full rounded-2xl border border-[#E5C57B]/30 bg-white/10 px-4 focus-within:border-[#FBDE9C] focus-within:ring-2 focus-within:ring-[#FBDE9C]/20 transition-all shadow-inner">
                <Search className="h-4 w-4 text-[#FBDE9C]/80 shrink-0" strokeWidth={2} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections..."
                  className="w-full bg-transparent pl-2.5 text-sm text-[#FAF5E8] outline-none placeholder:text-[#FAF5E8]/40 font-sans"
                />
              </form>

              {/* Navigation Links with Fraunces Typography */}
              <nav className="navbar space-y-1.5 pt-1">
                {roleLinks.map((l) => {
                  const isActive = location.pathname === l.href;
                  const Icon = l.icon || Gift;
                  return (
                    <Link
                      key={l.href}
                      to={l.href}
                      onClick={closeMenu}
                      className={`group relative flex items-center justify-between rounded-xl p-3 transition-all duration-200 border ${
                        isActive
                          ? 'bg-gradient-to-r from-[#57222C] to-[#3B020D] text-[#FAF5E8] border-[#C99738]'
                          : 'bg-white/5 text-[#FAF5E8]/90 hover:text-white hover:bg-white/10 border-white/10'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#FBDE9C] rounded-r-full shadow-[0_0_8px_rgba(251,222,156,0.8)]" />
                      )}

                      <div className="flex items-center gap-3 pl-1">
                        <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-[#FBDE9C]' : 'text-[#FBDE9C]/80'}`} strokeWidth={1.9} />
                        <span className="font-display text-base font-medium tracking-wide text-[#FAF5E8] group-hover:text-[#FBDE9C] transition-colors">
                          {l.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {l.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FBDE9C] text-[#44040F] text-[9.5px] font-sans font-bold uppercase tracking-wider">
                            {l.badge}
                          </span>
                        )}
                        <ChevronRight className={`h-4 w-4 ${
                          isActive ? 'text-[#FBDE9C]' : 'text-white/40 group-hover:text-[#FBDE9C]'
                        }`} />
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* User Account Controls */}
              {session && (
                <div className="pt-2 border-t border-[#E5C57B]/20">
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-sans bg-white/10 text-[#FBDE9C] hover:bg-white/20 border border-white/15 active:scale-95 transition-all"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={2} />
                    Sign Out ({profile?.full_name || session.user.email})
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
