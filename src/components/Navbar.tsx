import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { Search, Heart, UserRound, ShoppingBag, Menu, X, LogOut, Moon, Sun, Sparkles, ChevronRight, Gift, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/cart';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useWishlist } from '@/hooks/useWishlist';
import { supabase } from '@/lib/supabase';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '@/components/BrandLogo';

interface NavLinkItem {
  label: string;
  href: string;
}

const links: NavLinkItem[] = [
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
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setSearchExpanded(false);
  }, []);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/all-hampers?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchExpanded(false);
      setMenuOpen(false);
    }
  };

  const isVendor = profile?.role === 'vendor';
  const isStoreAdmin = profile?.role === 'admin' || isAdmin;
  const logoLink = isVendor ? '/vendor' : isStoreAdmin ? '/admin' : '/';

  const roleLinks: NavLinkItem[] = isVendor
    ? [{ label: 'Vendor Studio', href: '/vendor' }]
    : isStoreAdmin
    ? [{ label: 'Admin Dashboard', href: '/admin' }]
    : links;

  const showWishlistBadge = wishlistCount > 0;
  const showCartBadge = count > 0;
  const accountLink = isVendor ? '/vendor' : isAdmin ? '/admin' : '/profile';
  const userInitial = (profile?.full_name || profile?.business_name || session?.user?.email || 'A').charAt(0).toUpperCase();

  return (
    <header
      role="banner"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#FAF5E8]/98 dark:bg-[#140508]/98 backdrop-blur-md border-b border-[#E5C57B]/40 dark:border-[#33020A] shadow-[0_4px_20px_rgba(68,4,15,0.06)] py-1.5 sm:py-2'
          : 'bg-[#FAF5E8]/95 dark:bg-[#140508]/95 backdrop-blur-sm border-b border-[#E5C57B]/30 dark:border-[#33020A]/60 py-2 sm:py-2.5'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 lg:gap-6 px-3 sm:px-6 lg:px-8">
        {/* Brand Logo on Left */}
        <Link
          to={logoLink}
          onClick={closeMenu}
          className="shrink-0 flex items-center transition-transform hover:scale-[1.01] active:scale-95 focus:outline-none"
          aria-label="A_S Hamper home"
        >
          <BrandLogo variant="horizontal" size="sm" />
        </Link>

        {/* Desktop Navigation Links - Exact Pill Active and Plain Text Inactive */}
        <nav
          role="navigation"
          aria-label="Main Navigation"
          className="hidden lg:flex items-center gap-1 xl:gap-2"
        >
          {roleLinks.map((l) => {
            const isActive = location.pathname === l.href;
            return (
              <Link
                key={l.href}
                to={l.href}
                className={`text-[15px] transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#57222C] text-white px-4 py-1.5 rounded-full font-semibold shadow-sm dark:bg-[#7F011F] dark:text-[#FAF5E8]'
                    : 'text-[#44040F]/90 hover:text-[#57222C] hover:bg-[#57222C]/5 px-3 py-1.5 rounded-full font-medium dark:text-[#FAF5E8]/90 dark:hover:text-[#FBDE9C] dark:hover:bg-white/5'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center gap-2 h-9 lg:h-9.5 w-36 lg:w-44 xl:w-52 rounded-full border border-[#E5C57B]/70 bg-white/70 px-3.5 focus-within:border-[#7F011F] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7F011F]/15 transition-all dark:bg-[#1F090E] dark:border-[#461C25] dark:focus-within:border-[#FBDE9C]"
          >
            <Search className="h-4 w-4 text-[#44040F]/50 dark:text-[#FBDE9C]/60 shrink-0" strokeWidth={2.2} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hampers..."
              className="w-full bg-transparent text-xs text-[#44040F] outline-none placeholder:text-[#44040F]/45 dark:text-[#FAF5E8] dark:placeholder:text-[#FAF5E8]/40"
              aria-label="Search hampers"
            />
          </form>

          {/* Mobile Search Toggle (Matching Image 2 Circle Style) */}
          <button
            type="button"
            onClick={() => setSearchExpanded(!searchExpanded)}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-full text-[#44040F] bg-transparent border border-[#E5C57B]/80 hover:bg-[#FBDE9C]/30 transition-colors dark:text-[#FBDE9C] dark:border-[#461C25]"
            aria-label="Toggle search"
          >
            <Search className="h-4 w-4" strokeWidth={2.2} />
          </button>

          {/* Theme Toggle Button (Matching Image 2 Circle Style) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center h-9 w-9 rounded-full text-[#44040F] bg-transparent border border-[#E5C57B]/80 hover:bg-[#FBDE9C]/30 transition-colors dark:text-[#FBDE9C] dark:border-[#461C25]"
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" strokeWidth={2.2} />
            ) : (
              <Sun className="h-4 w-4 text-[#FBDE9C]" strokeWidth={2.2} />
            )}
          </button>

          {/* Wishlist Link (Desktop) */}
          <Link
            to="/wishlist"
            className="relative hidden sm:flex items-center justify-center h-9 w-9 rounded-full text-[#44040F] bg-transparent border border-[#E5C57B]/80 hover:bg-[#FBDE9C]/30 transition-colors dark:text-[#FBDE9C] dark:border-[#461C25]"
            aria-label="Wishlist"
          >
            <Heart
              className={showWishlistBadge ? 'h-4 w-4 text-[#7F011F] fill-[#7F011F] dark:text-[#FBDE9C] dark:fill-[#FBDE9C]' : 'h-4 w-4'}
              strokeWidth={2.2}
            />
            {showWishlistBadge && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-[#7F011F] text-[9px] font-black text-[#FBDE9C] border border-[#FBDE9C] shadow-sm animate-pulse">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* User Account / Profile */}
          {session ? (
            <Link
              to={accountLink}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-[#57222C] text-[#FBDE9C] text-xs font-black ring-2 ring-[#FBDE9C] hover:ring-[#C99738] transition-all shadow-md shrink-0"
              aria-label="Account profile"
              title={
                profile?.role === 'vendor'
                  ? `Vendor Studio (${profile?.business_name || session.user.email})`
                  : profile?.full_name || 'Account'
              }
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Account" className="h-full w-full rounded-full object-cover" />
              ) : (
                userInitial
              )}
            </Link>
          ) : (
            <Link
              to="/profile"
              className="hidden sm:flex items-center justify-center h-9 w-9 rounded-full text-[#44040F] bg-transparent border border-[#E5C57B]/80 hover:bg-[#FBDE9C]/30 transition-colors dark:text-[#FBDE9C] dark:border-[#461C25]"
              aria-label="Sign in"
            >
              <UserRound className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          )}

          {/* Cart Trigger (Matching Image 2 Solid Wine Red Circle with Gold Bag) */}
          <button
            type="button"
            onClick={open}
            className="relative flex items-center justify-center h-9 w-9 rounded-full bg-[#57222C] dark:bg-[#7F011F] text-[#FBDE9C] hover:bg-[#44040F] active:scale-95 transition-all shadow-[0_3px_12px_rgba(68,4,15,0.25)] border border-[#E5C57B]/60 shrink-0"
            aria-label="Open cart drawer"
          >
            <ShoppingBag className="h-4 w-4 text-[#FBDE9C]" strokeWidth={2.2} />
            {showCartBadge && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4.5 w-4.5 rounded-full bg-[#FBDE9C] text-[9.5px] font-black text-[#57222C] border border-[#57222C] shadow-md">
                {count}
              </span>
            )}
          </button>

          {/* Mobile Menu Hamburger Button (Matching Image 2 Circle Style with 3 Wine Red bars) */}
          <button
            type="button"
            onClick={toggleMenu}
            className="lg:hidden flex items-center justify-center h-9 w-9 rounded-full bg-transparent border border-[#E5C57B]/80 text-[#57222C] hover:bg-[#FBDE9C]/30 transition-colors dark:text-[#FBDE9C] dark:border-[#461C25] shrink-0"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" strokeWidth={2.4} /> : <Menu className="h-5 w-5" strokeWidth={2.4} />}
          </button>
        </div>
      </div>

      {/* Mobile Search Input Bar */}
      {searchExpanded && (
        <div className="md:hidden border-t border-[#E5C57B]/40 bg-[#FAF5E8] px-4 py-2.5 dark:bg-[#140508] dark:border-[#33020A] animate-fade-in shadow-inner">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 h-10 w-full rounded-full border border-[#C99738] bg-white px-3.5 focus-within:ring-2 focus-within:ring-[#44040F]/20 dark:bg-[#1F090E] dark:border-[#FBDE9C]">
            <Search className="h-4 w-4 text-[#44040F]/60 dark:text-[#FBDE9C]/70 shrink-0" strokeWidth={2.2} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search birthday, luxury, corporate hampers..."
              className="w-full bg-transparent text-xs sm:text-sm text-[#44040F] outline-none placeholder:text-[#44040F]/45 dark:text-[#FAF5E8]"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#44040F]/50 dark:text-[#FBDE9C]/60"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      )}

      {/* Mobile Navigation Full-Screen Overlay & Interactive Attraction Drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 top-[3.75rem] z-40 bg-[#140508]/65 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={closeMenu}
        >
          <div
            className="w-full max-h-[calc(100vh-3.75rem)] overflow-y-auto bg-[#FAF5E8] dark:bg-[#140508] border-b-2 border-[#C99738] shadow-2xl p-5 flex flex-col gap-4 animate-fade-down pb-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 h-11 w-full rounded-2xl border border-[#C99738]/60 bg-white/95 px-3.5 shadow-sm dark:bg-[#1F090E] dark:border-[#461C25]">
              <Search className="h-4 w-4 text-[#44040F]/60 dark:text-[#FBDE9C]/70 shrink-0" strokeWidth={2.2} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search birthday, luxury, chocolate hampers..."
                className="w-full bg-transparent text-sm text-[#44040F] outline-none placeholder:text-[#44040F]/40 dark:text-[#FAF5E8]"
              />
              <button
                type="submit"
                className="px-3 py-1 text-xs font-bold rounded-lg bg-[#57222C] text-[#FAF5E8] dark:bg-[#FBDE9C] dark:text-[#57222C]"
              >
                Go
              </button>
            </form>

            {/* Quick Filter Tag Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-semibold text-[#57222C] dark:text-[#FBDE9C]">
              {['Birthday', 'Anniversary', 'Gourmet', 'Corporate', 'Under ₹2,000'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    navigate(`/all-hampers?search=${encodeURIComponent(tag)}`);
                    closeMenu();
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-[#1F090E] border border-[#E5C57B]/60 hover:bg-[#FBDE9C]/30 transition-colors shadow-xs"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Navigation Links Grid with High Visual Appeal */}
            <div className="flex flex-col gap-1.5 pt-1">
              {roleLinks.map((l) => {
                const isActive = location.pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    to={l.href}
                    onClick={closeMenu}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-bold tracking-wide transition-all ${
                      isActive
                        ? 'bg-[#57222C] text-white shadow-md dark:bg-[#7F011F] dark:text-[#FAF5E8]'
                        : 'text-[#44040F] hover:bg-[#FBDE9C]/30 bg-white/50 dark:bg-[#1F090E]/50 dark:text-[#FAF5E8] border border-[#E5C57B]/30'
                    }`}
                    style={{ fontFamily: "'Fraunces', 'Playfair Display', Georgia, serif" }}
                  >
                    <div className="flex items-center gap-3">
                      {l.href === '/' && <Sparkles className="w-4 h-4 text-[#C99738]" />}
                      {l.href === '/all-hampers' && <Gift className="w-4 h-4 text-[#C99738]" />}
                      {l.href === '/build-your-own' && <Gift className="w-4 h-4 text-[#C99738]" />}
                      <span>{l.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 opacity-60 ${isActive ? 'text-white' : 'text-[#57222C]'}`} />
                  </Link>
                );
              })}
            </div>

            {/* Luxury Experience Highlights Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-[#57222C] to-[#3A030C] text-[#FAF5E8] p-4 shadow-lg border border-[#FBDE9C]/30 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FBDE9C]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#FBDE9C]">Artisan Perks Included</span>
              </div>
              <p className="text-xs text-[#FAF5E8]/90 leading-relaxed">
                Every hamper features custom handwritten wax-sealed cards, satin ribbon packaging & express tracked delivery.
              </p>
            </div>

            {/* Account & Wishlist Shortcuts */}
            <div className="border-t border-[#E5C57B]/40 dark:border-[#33020A] pt-3 flex flex-col gap-2 font-sans">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/wishlist"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/90 dark:bg-[#1F090E] border border-[#E5C57B]/60 text-xs font-bold text-[#44040F] dark:text-[#FBDE9C] shadow-sm"
                >
                  <Heart className="w-3.5 h-3.5 text-[#7F011F]" />
                  <span>Wishlist ({wishlistCount})</span>
                </Link>
                <Link
                  to={accountLink}
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/90 dark:bg-[#1F090E] border border-[#E5C57B]/60 text-xs font-bold text-[#44040F] dark:text-[#FBDE9C] shadow-sm"
                >
                  <UserRound className="w-3.5 h-3.5 text-[#7F011F]" />
                  <span>{session ? 'My Account' : 'Sign In'}</span>
                </Link>
              </div>

              {session && (
                <button
                  type="button"
                  onClick={() => {
                    if (supabase) supabase.auth.signOut();
                    closeMenu();
                  }}
                  className="mt-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#44040F]/10 text-[#44040F] dark:bg-white/5 dark:text-[#FBDE9C] hover:bg-[#44040F]/20 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={2.2} /> Sign out of account
                </button>
              )}
            </div>

            {/* Bottom Brand Motto */}
            <div className="text-center pt-2 pb-1 border-t border-[#E5C57B]/30 dark:border-[#33020A]/60">
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#9E711E] dark:text-[#FBDE9C]">
                Artisan Gift Hampers &bull; Hand-Packed with Love
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
