import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { Search, Heart, UserRound, ShoppingBag, Moon, Sun, Sparkles, ChevronRight, Gift, Package, Store, ShieldCheck, ArrowRight, LogOut, Tag } from 'lucide-react';
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
  badge?: string;
  icon?: typeof Gift;
}

const mainNavLinks: NavLinkItem[] = [
  { label: 'Home', href: '/' },
  { label: 'All Hampers', href: '/all-hampers', icon: Gift },
  { label: 'Build Your Own', href: '/build-your-own', icon: Package },
  { label: 'Offers', href: '/offers', badge: 'Sale', icon: Tag },
  { label: 'Corporate', href: '/corporate' },
  { label: 'Vendor Zone', href: '/vendor', icon: Store },
  { label: 'About', href: '/about' },
];

const mobileOccasions = [
  { label: '🎂 Birthday', query: 'Birthday' },
  { label: '💍 Anniversary', query: 'Anniversary' },
  { label: '✨ Luxury Keepsake', query: 'Luxury' },
  { label: '🍫 Gourmet & Chocolates', query: 'Gourmet' },
  { label: '🏢 Corporate Gifts', query: 'Corporate' },
  { label: '💝 Under ₹2,000', query: 'Budget' },
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
  const [searchExpanded, setSearchExpanded] = useState(false);

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
    setSearchExpanded(false);
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

  const isStoreAdmin = profile?.role === 'admin' || isAdmin;
  const logoLink = isVendor ? '/vendor' : isStoreAdmin ? '/admin' : '/';

  const roleLinks: NavLinkItem[] = isVendor
    ? [
        { label: 'Vendor Studio', href: '/vendor', icon: Store },
        { label: 'Live Storefront', href: '/', icon: Gift },
        { label: 'All Hampers', href: '/all-hampers' },
      ]
    : isStoreAdmin
    ? [
        { label: 'Admin Dashboard', href: '/admin', icon: ShieldCheck },
        { label: 'Live Storefront', href: '/', icon: Gift },
        { label: 'All Hampers', href: '/all-hampers' },
      ]
    : mainNavLinks;

  const showWishlistBadge = wishlistCount > 0;
  const showCartBadge = count > 0;
  const accountLink = isVendor ? '/vendor' : isAdmin ? '/admin' : '/profile';
  const userInitial = (profile?.full_name || profile?.business_name || session?.user?.email || 'A').charAt(0).toUpperCase();

  return (
    <header
      role="banner"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 font-sans ${
        scrolled
          ? 'bg-[#FAF5E8]/98 dark:bg-[#140508]/98 backdrop-blur-md border-b border-[#E5C57B]/40 dark:border-[#33020A] shadow-[0_4px_24px_rgba(68,4,15,0.06)] py-2 sm:py-2.5'
          : 'bg-[#FAF5E8]/95 dark:bg-[#140508]/95 backdrop-blur-sm border-b border-[#E5C57B]/30 dark:border-[#33020A]/60 py-2.5 sm:py-3.5'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 lg:gap-6 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo on Left */}
        <Link
          to={logoLink}
          onClick={closeMenu}
          className="shrink-0 flex items-center transition-transform hover:scale-[1.01] active:scale-95 focus:outline-none"
          aria-label="A_S Hamper home"
        >
          <BrandLogo variant="horizontal" size="sm" />
        </Link>

        {/* Desktop Navigation Links - High-End Shopify Luxury Pill Style */}
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
                className={`text-[14.5px] xl:text-[15px] transition-all duration-200 whitespace-nowrap ${
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
            className="hidden md:flex items-center gap-2 h-9 lg:h-9.5 w-36 lg:w-44 xl:w-52 rounded-full border border-[#E5C57B]/70 bg-white/80 px-3.5 focus-within:border-[#7F011F] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7F011F]/15 transition-all dark:bg-[#1F090E] dark:border-[#461C25] dark:focus-within:border-[#FBDE9C]"
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

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full text-[#44040F] bg-transparent border border-[#E5C57B]/80 hover:bg-[#FBDE9C]/30 transition-colors dark:text-[#FBDE9C] dark:border-[#461C25] shrink-0"
            aria-label="Toggle dark/light theme"
            title={theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" strokeWidth={2.2} />
            ) : (
              <Sun className="h-4 w-4 text-[#FBDE9C]" strokeWidth={2.2} />
            )}
          </button>

          {/* Wishlist Link (Visible on Mobile & Desktop) */}
          <Link
            to="/wishlist"
            className="relative flex items-center justify-center h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full text-[#44040F] bg-transparent border border-[#E5C57B]/80 hover:bg-[#FBDE9C]/30 transition-colors dark:text-[#FBDE9C] dark:border-[#461C25] shrink-0"
            aria-label="Wishlist"
            title="Wishlist"
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

          {/* User Account / Profile (Visible on Mobile & Desktop) */}
          {session ? (
            <Link
              to={accountLink}
              className="flex items-center justify-center h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full bg-[#57222C] text-[#FBDE9C] text-xs font-black ring-1.5 ring-[#FBDE9C] hover:ring-[#C99738] transition-all shadow-sm shrink-0 overflow-hidden"
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
              className="flex items-center justify-center h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full text-[#44040F] bg-transparent border border-[#E5C57B]/80 hover:bg-[#FBDE9C]/30 transition-colors dark:text-[#FBDE9C] dark:border-[#461C25] shrink-0"
              aria-label="Sign in to your account"
              title="Sign In / Profile"
            >
              <UserRound className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          )}

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={open}
            className="relative flex items-center justify-center h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full bg-[#57222C] dark:bg-[#7F011F] text-[#FBDE9C] hover:bg-[#44040F] active:scale-95 transition-all shadow-[0_3px_12px_rgba(68,4,15,0.25)] border border-[#E5C57B]/60 shrink-0"
            aria-label="Open cart drawer"
          >
            <ShoppingBag className="h-4 w-4 text-[#FBDE9C]" strokeWidth={2.2} />
            {showCartBadge && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-[#FBDE9C] text-[9.5px] font-black text-[#57222C] border border-[#57222C] shadow-md">
                {count}
              </span>
            )}
          </button>

          {/* High-End Animated Hamburger Toggle Button (3 Morphing Bars to X) */}
          <button
            type="button"
            onClick={toggleMenu}
            className="lg:hidden relative flex items-center justify-center h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full bg-transparent border border-[#E5C57B]/80 text-[#57222C] hover:bg-[#FBDE9C]/30 transition-all duration-300 dark:text-[#FBDE9C] dark:border-[#461C25] shrink-0 focus:outline-none focus:ring-2 focus:ring-[#57222C]/30"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="luxury-mobile-drawer"
          >
            <div className="relative w-4 h-3 flex flex-col justify-between">
              {/* Top Bar */}
              <span
                className={`h-0.5 w-full bg-[#57222C] dark:bg-[#FBDE9C] rounded-full transition-all duration-300 ease-out origin-top-left ${
                  menuOpen ? 'rotate-45 translate-x-0.5 -translate-y-0.5' : ''
                }`}
              />
              {/* Middle Bar */}
              <span
                className={`h-0.5 w-full bg-[#57222C] dark:bg-[#FBDE9C] rounded-full transition-all duration-200 ease-out ${
                  menuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                }`}
              />
              {/* Bottom Bar */}
              <span
                className={`h-0.5 w-full bg-[#57222C] dark:bg-[#FBDE9C] rounded-full transition-all duration-300 ease-out origin-bottom-left ${
                  menuOpen ? '-rotate-45 translate-x-0.5 translate-y-0.5' : ''
                }`}
              />
            </div>
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

      {/* Premium Shopify-Style Mobile Navigation Drawer */}
      {menuOpen && (
        <div
          id="luxury-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
          className="fixed inset-0 top-[3.65rem] sm:top-[4.25rem] z-40 bg-[#140508]/70 backdrop-blur-md lg:hidden transition-all duration-300"
          onClick={closeMenu}
        >
          <div
            className="w-full max-h-[calc(100vh-3.65rem)] sm:max-h-[calc(100vh-4.25rem)] overflow-y-auto bg-[#FAF5E8] dark:bg-[#140508] border-b-2 border-[#C99738] shadow-2xl p-5 sm:p-7 flex flex-col gap-5 pb-16"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Mobile Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 h-12 w-full rounded-2xl border border-[#C99738]/60 bg-white/95 px-4 shadow-sm dark:bg-[#1F090E] dark:border-[#461C25] focus-within:ring-2 focus-within:ring-[#57222C]/20">
              <Search className="h-4.5 w-4.5 text-[#44040F]/60 dark:text-[#FBDE9C]/70 shrink-0" strokeWidth={2.2} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search birthday, luxury, anniversary..."
                className="w-full bg-transparent text-sm text-[#44040F] outline-none placeholder:text-[#44040F]/45 dark:text-[#FAF5E8]"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#57222C] text-[#FAF5E8] dark:bg-[#FBDE9C] dark:text-[#57222C] shadow-xs active:scale-95 transition-all"
              >
                Search
              </button>
            </form>

            {/* Curated Occasion Pills */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7F011F] dark:text-[#FBDE9C]/80">
                Popular Occasions
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold text-[#57222C] dark:text-[#FBDE9C]">
                {mobileOccasions.map((occ) => (
                  <button
                    key={occ.label}
                    type="button"
                    onClick={() => {
                      navigate(`/all-hampers?search=${encodeURIComponent(occ.query)}`);
                      closeMenu();
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-white dark:bg-[#1F090E] border border-[#E5C57B]/70 hover:border-[#57222C] hover:bg-[#FBDE9C]/25 transition-all shadow-xs"
                  >
                    {occ.label}
                  </button>
                ))}
              </div>
            </div>

            {/* High-End Main Navigation Links with Large Typography */}
            <div className="space-y-2 pt-2 border-t border-[#E5C57B]/30 dark:border-[#33020A]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7F011F] dark:text-[#FBDE9C]/80 mb-2">
                Explore Collections
              </p>
              <div className="flex flex-col gap-2">
                {roleLinks.map((l) => {
                  const isActive = location.pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      to={l.href}
                      onClick={closeMenu}
                      className={`group flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-200 ${
                        isActive
                          ? 'bg-[#57222C] text-white shadow-md dark:bg-[#7F011F] dark:text-[#FAF5E8]'
                          : 'text-[#44040F] hover:bg-[#FBDE9C]/30 bg-white/70 dark:bg-[#1F090E]/70 dark:text-[#FAF5E8] border border-[#E5C57B]/40 hover:border-[#57222C]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`grid place-items-center h-8 w-8 rounded-xl ${
                          isActive
                            ? 'bg-white/15 text-[#FBDE9C]'
                            : 'bg-[#57222C]/10 dark:bg-[#FBDE9C]/10 text-[#57222C] dark:text-[#FBDE9C]'
                        }`}>
                          {l.label === 'Home' && <Sparkles className="h-4 w-4" />}
                          {l.label === 'All Hampers' && <Gift className="h-4 w-4" />}
                          {l.label === 'Build Your Own' && <Package className="h-4 w-4" />}
                          {l.label === 'Offers' && <Tag className="h-4 w-4" />}
                          {l.label === 'Corporate' && <Store className="h-4 w-4" />}
                          {l.label === 'Vendor Zone' && <Store className="h-4 w-4" />}
                          {l.label === 'About' && <Sparkles className="h-4 w-4" />}
                          {l.label === 'Admin Dashboard' && <ShieldCheck className="h-4 w-4" />}
                          {l.label === 'Vendor Studio' && <Store className="h-4 w-4" />}
                          {l.label === 'Live Storefront' && <Gift className="h-4 w-4" />}
                        </span>
                        <span
                          className="text-lg sm:text-xl font-bold tracking-tight font-display"
                        >
                          {l.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {l.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-[#E5C57B] text-[#44040F] text-[10px] font-black uppercase">
                            {l.badge}
                          </span>
                        )}
                        <ChevronRight className={`h-4.5 w-4.5 transition-transform group-hover:translate-x-1 ${
                          isActive ? 'text-white' : 'text-[#57222C]/60 dark:text-[#FBDE9C]/60'
                        }`} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Luxury Experience Highlights Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-[#57222C] via-[#44040F] to-[#2B020A] text-[#FAF5E8] p-4.5 shadow-lg border border-[#FBDE9C]/30 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FBDE9C]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#FBDE9C]">Artisan Perks Included</span>
              </div>
              <p className="text-xs text-[#FAF5E8]/90 leading-relaxed">
                Custom handwritten wax-sealed cards, satin ribbon packaging &amp; express tracked delivery included with every order.
              </p>
            </div>

            {/* Account & Wishlist Shortcuts */}
            <div className="border-t border-[#E5C57B]/40 dark:border-[#33020A] pt-4 flex flex-col gap-2.5 font-sans">
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/wishlist"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-white/90 dark:bg-[#1F090E] border border-[#E5C57B]/70 text-xs font-bold text-[#44040F] dark:text-[#FBDE9C] shadow-sm hover:bg-[#FBDE9C]/20 transition-colors"
                >
                  <Heart className="w-4 h-4 text-[#7F011F] dark:text-[#FBDE9C]" />
                  <span>Wishlist ({wishlistCount})</span>
                </Link>
                <Link
                  to={accountLink}
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-white/90 dark:bg-[#1F090E] border border-[#E5C57B]/70 text-xs font-bold text-[#44040F] dark:text-[#FBDE9C] shadow-sm hover:bg-[#FBDE9C]/20 transition-colors"
                >
                  <UserRound className="w-4 h-4 text-[#7F011F] dark:text-[#FBDE9C]" />
                  <span>{session ? 'My Account' : 'Sign In'}</span>
                </Link>
              </div>

              {session && (
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    closeMenu();
                  }}
                  className="mt-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold bg-[#44040F]/10 text-[#44040F] dark:bg-white/5 dark:text-[#FBDE9C] hover:bg-[#44040F]/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2.2} /> Sign out of account
                </button>
              )}
            </div>

            {/* Bottom Brand Motto */}
            <div className="text-center pt-3 pb-1 border-t border-[#E5C57B]/30 dark:border-[#33020A]/60">
              <p className="text-[10.5px] uppercase font-bold tracking-[0.2em] text-[#9E711E] dark:text-[#FBDE9C]">
                Artisan Gift Hampers &bull; Hand-Packed with Love
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

