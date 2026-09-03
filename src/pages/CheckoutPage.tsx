import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Home,
  Briefcase,
  Loader2,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  User,
  Phone,
  Mail,
  AlertCircle,
  Edit2,
  Sparkles,
  Wallet,
  Check,
  Calendar,
  Gift,
  Trash2,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatPrice, useCart } from '@/cart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { openRazorpayCheckout } from '@/lib/razorpay';
import RazorpayModal from '@/components/RazorpayModal';
import { getWalletBalance, deductWalletBalance, subscribeToRealtimeWallet } from '@/lib/orderSync';
import {
  getSavedAddresses,
  saveDeliveryAddress,
  deleteDeliveryAddress,
  type DeliveryAddress,
  validatePincode,
} from '@/lib/addressStore';
import CheckoutAuthModal from '@/components/CheckoutAuthModal';
import { toast } from 'react-hot-toast';

// Indian PIN Code quick helper
const PIN_MAP: Record<string, { city: string; state: string }> = {
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '110002': { city: 'New Delhi', state: 'Delhi' },
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '400050': { city: 'Mumbai', state: 'Maharashtra' },
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '560034': { city: 'Bengaluru', state: 'Karnataka' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '160017': { city: 'Chandigarh', state: 'Chandigarh' },
  '800001': { city: 'Patna', state: 'Bihar' },
  '452001': { city: 'Indore', state: 'Madhya Pradesh' },
  '682001': { city: 'Kochi', state: 'Kerala' },
  '751001': { city: 'Bhubaneswar', state: 'Odisha' },
  '781001': { city: 'Guwahati', state: 'Assam' },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const {
    items,
    count,
    subtotal,
    originalTotal,
    discountTotal,
    customizationTotal,
    couponDiscount,
    deliveryCharge,
    finalTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    clear,
  } = useCart();

  // Scroll Unlocking Guard
  useEffect(() => {
    document.body.style.overflow = 'unset';
    document.documentElement.style.overflow = 'unset';
  }, []);

  // Customer Contact Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Address State - Strictly isolated per user
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Address Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formHouse, setFormHouse] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formType, setFormType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  // Delivery & Gift Preferences
  const [deliverySlot, setDeliverySlot] = useState<'standard' | 'express'>('standard');
  const [timeSlot, setTimeSlot] = useState('Morning (9:00 AM - 1:00 PM)');
  const [giftRecipient, setGiftRecipient] = useState('');
  const [giftSender, setGiftSender] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [showGiftOptions, setShowGiftOptions] = useState(false);

  // Promo Coupon Form State
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Payment Method State - Default to Razorpay Gateway
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Refund Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(false);

  // Mobile Order Summary Accordion
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // Checkout Auth Modal state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Load user profile & user-isolated delivery addresses
  useEffect(() => {
    if (session?.user) {
      setCustomerEmail(session.user.email || '');
      const fullName = profile?.full_name || session.user.user_metadata?.full_name || '';
      setCustomerName(fullName);
      setFormName(fullName);

      const rawMob = profile?.phone || session.user.user_metadata?.phone || '';
      const cleanDigits = rawMob.replace(/\D/g, '');
      const displayPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
      setCustomerPhone(displayPhone);
      setFormPhone(displayPhone);

      getWalletBalance(session.user.id).then(setWalletBalance);
      const unsubscribe = subscribeToRealtimeWallet(session.user.id, setWalletBalance);

      // Load user delivery addresses strictly matching session.user.id
      loadUserAddresses(session.user.id);

      return () => unsubscribe();
    } else {
      setAddresses([]);
      setSelectedAddrId('');
    }
  }, [session, profile]);

  const loadUserAddresses = async (userId?: string) => {
    const saved = await getSavedAddresses(userId);
    setAddresses(saved);
    if (saved && saved.length > 0) {
      const def = saved.find((m) => m.is_default) || saved[0];
      setSelectedAddrId(def.id);
    } else {
      setSelectedAddrId('');
      // If user has no addresses, open form automatically
      setShowAddressForm(true);
    }
  };

  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setFormPincode(clean);
    if (clean.length === 6) {
      if (PIN_MAP[clean]) {
        setFormCity(PIN_MAP[clean].city);
        setFormState(PIN_MAP[clean].state);
      }
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setFormName(customerName || '');
    setFormPhone(customerPhone || '');
    setFormHouse('');
    setFormStreet('');
    setFormLandmark('');
    setFormCity('');
    setFormState('');
    setFormPincode('');
    setFormType('Home');
    setFormIsDefault(addresses.length === 0);
    setFormError(null);
    setShowAddressForm(true);
  };

  const handleOpenEditAddress = (addr: DeliveryAddress) => {
    setEditingAddressId(addr.id);
    setFormName(addr.full_name);
    setFormPhone(addr.phone.replace(/\D/g, '').slice(-10));
    setFormHouse(addr.house_no);
    setFormStreet(addr.street);
    setFormLandmark(addr.landmark || '');
    setFormCity(addr.city);
    setFormState(addr.state);
    setFormPincode(addr.pincode);
    setFormType(addr.address_type);
    setFormIsDefault(addr.is_default);
    setFormError(null);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    await deleteDeliveryAddress(id, session?.user?.id);
    await loadUserAddresses(session?.user?.id);
    toast.success('Address removed');
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanMobile = formPhone.replace(/\D/g, '').slice(-10);

    if (!formName.trim()) {
      setFormError('Please enter recipient full name.');
      return;
    }
    if (!cleanMobile || cleanMobile.length < 10) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!validatePincode(formPincode)) {
      setFormError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    if (!formHouse.trim()) {
      setFormError('Please enter House / Flat / Building details.');
      return;
    }
    if (!formStreet.trim()) {
      setFormError('Please enter Street / Colony / Locality.');
      return;
    }
    if (!formCity.trim()) {
      setFormError('Please enter City.');
      return;
    }
    if (!formState.trim()) {
      setFormError('Please enter State.');
      return;
    }

    setSavingAddress(true);
    try {
      const saved = await saveDeliveryAddress(
        {
          id: editingAddressId || undefined,
          full_name: formName.trim(),
          phone: cleanMobile,
          house_no: formHouse.trim(),
          street: formStreet.trim(),
          landmark: formLandmark.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          pincode: formPincode.trim(),
          address_type: formType,
          is_default: formIsDefault || addresses.length === 0,
        },
        session?.user?.id
      );

      await loadUserAddresses(session?.user?.id);
      setSelectedAddrId(saved.id);
      setShowAddressForm(false);
      setEditingAddressId(null);
      toast.success(editingAddressId ? 'Address updated!' : 'Address saved!');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMessage(null);
    const res = await applyCoupon(couponInput);
    setCouponLoading(false);
    setCouponMessage({ success: res.success, text: res.message });
    if (res.success) {
      setCouponInput('');
    }
  };

  const selectedAddr = addresses.find((a) => a.id === selectedAddrId) || addresses[0];
  const maxWalletUsable = useWalletBalance ? Math.min(walletBalance, finalTotal) : 0;
  const remainingPayableTotal = Math.max(0, finalTotal - maxWalletUsable);
  const totalSaved = discountTotal + couponDiscount + maxWalletUsable;

  const createOrderRecord = async (payMethod: string, payStatus: string, razorpayPaymentId?: string) => {
    const finalCustomerName =
      selectedAddr?.full_name ||
      customerName ||
      profile?.full_name ||
      session?.user?.user_metadata?.full_name ||
      'Customer';
    const finalCustomerPhone = (
      selectedAddr?.phone ||
      customerPhone ||
      profile?.phone ||
      session?.user?.user_metadata?.phone ||
      ''
    )
      .replace(/\D/g, '')
      .slice(-10);
    const finalCustomerEmail = session?.user?.email || customerEmail || '';
    const orderNum = `GH${Math.floor(100000 + Math.random() * 900000)}`;

    if (maxWalletUsable > 0 && session?.user?.id) {
      await deductWalletBalance(session.user.id, orderNum, maxWalletUsable);
    }

    const fullShippingAddress = selectedAddr
      ? `${selectedAddr.house_no}, ${selectedAddr.street}${
          selectedAddr.landmark ? `, Near ${selectedAddr.landmark}` : ''
        }, ${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}`
      : 'Address Pending';

    const orderData = {
      order_number: orderNum,
      customer_id: session?.user?.id || null,
      customer_name: finalCustomerName,
      customer_email: finalCustomerEmail,
      customer_phone: finalCustomerPhone,
      address: fullShippingAddress,
      delivery_slot: `${deliverySlot.toUpperCase()} · ${timeSlot}`,
      gift_card_note: giftMessage
        ? `To: ${giftRecipient || 'Someone Special'} | Message: ${giftMessage} | From: ${
            giftSender || finalCustomerName
          }`
        : null,
      items: items.map((i) => ({
        product_id: i.product.id,
        product_slug: i.product.slug,
        name: i.product.name,
        image: i.product.image,
        vendor_id: i.product.vendor_id || null,
        vendor_name: i.product.vendor_name || 'A_S Artisan Gifting',
        price: i.product.price,
        quantity: i.qty,
        subtotal: i.product.price * i.qty,
        customization: i.product.customization || null,
      })),
      total: remainingPayableTotal,
      subtotal: subtotal,
      wallet_discount: maxWalletUsable,
      discount: discountTotal + couponDiscount + maxWalletUsable,
      delivery_charge: deliveryCharge,
      customization_charge: customizationTotal,
      payment_status: remainingPayableTotal === 0 ? 'paid' : payStatus,
      payment_method: maxWalletUsable > 0 && remainingPayableTotal === 0 ? 'WALLET' : payMethod,
      payment_id: razorpayPaymentId || null,
      status: 'new',
    };

    if (supabase) {
      try {
        await supabase.from('orders').insert([orderData]);
      } catch (e) {
        console.error('Supabase order insert error:', e);
      }
    }

    const localOrder = {
      ...orderData,
      id: `ord-${Date.now()}`,
      created_at: new Date().toISOString(),
      estimated_delivery: deliverySlot === 'express' ? '1-2 Business Days' : '3-4 Business Days',
    };

    try {
      localStorage.setItem(`as_hamper_order_${orderNum}`, JSON.stringify(localOrder));
      const existing = localStorage.getItem('a_s_hamper_orders');
      const parsed = existing ? JSON.parse(existing) : [];
      localStorage.setItem('a_s_hamper_orders', JSON.stringify([localOrder, ...parsed]));
    } catch (e) {
      console.error('Local order save error:', e);
    }

    clear();
    navigate(`/order-confirmation/${orderNum}`);
  };

  const handlePlaceOrder = async () => {
    setOrderError(null);

    if (!selectedAddr) {
      setOrderError('Please add and select a valid delivery address to proceed.');
      return;
    }

    setPlacingOrder(true);

    if (paymentMethod === 'cod') {
      await createOrderRecord('Cash on Delivery (COD)', 'pending');
      setPlacingOrder(false);
      return;
    }

    if (paymentMethod === 'razorpay') {
      const orderNum = `GH${Math.floor(100000 + Math.random() * 900000)}`;
      const finalCustomerName =
        selectedAddr?.full_name ||
        customerName ||
        profile?.full_name ||
        session?.user?.user_metadata?.full_name ||
        'Customer';
      const finalCustomerPhone = (
        selectedAddr?.phone ||
        customerPhone ||
        profile?.phone ||
        session?.user?.user_metadata?.phone ||
        ''
      )
        .replace(/\D/g, '')
        .slice(-10);
      const finalCustomerEmail = session?.user?.email || customerEmail || '';

      await openRazorpayCheckout({
        amount: remainingPayableTotal,
        orderNumber: orderNum,
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
        customerPhone: finalCustomerPhone,
        onSuccess: async (response) => {
          await createOrderRecord('Razorpay Online', 'paid', response.razorpay_payment_id);
          setPlacingOrder(false);
        },
        onFailure: (reason) => {
          if (reason === 'RAZORPAY_FALLBACK') {
            setShowRazorpayModal(true);
          } else {
            setOrderError(reason || 'Payment cancelled or incomplete. Please try again.');
            setPlacingOrder(false);
          }
        },
      });
      return;
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] dark:bg-stone-950 pt-28 pb-20 px-4 text-center font-sans">
        <div className="mx-auto max-w-md rounded-[2rem] bg-white dark:bg-stone-900 p-8 border border-cream-200 dark:border-stone-800 shadow-xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-wine-50 dark:bg-stone-800 text-wine-700 dark:text-gold-400">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-wine-900 dark:text-cream-100">
            Your Cart is Empty
          </h1>
          <p className="mt-2 text-xs text-ink-700/60 dark:text-gray-400 leading-relaxed">
            Explore our curated artisan luxury hampers and add items to your cart before proceeding to checkout.
          </p>
          <Link
            to="/all-hampers"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-wine-700 hover:bg-wine-800 text-cream-50 px-6 py-3 text-xs font-bold shadow-md transition-all"
          >
            Browse Luxury Hampers <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#120D10] pt-24 pb-24 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      <div className="mx-auto max-w-7xl">
        
        {/* Shopify-Style Clean Top Header Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-cream-200/80 dark:border-stone-800 pb-5">
          <div className="flex items-center gap-4">
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-wine-700 hover:text-wine-900 dark:text-gold-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Cart
            </Link>
            <span className="hidden sm:inline-block text-cream-300 dark:text-stone-700">|</span>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg sm:text-xl font-bold text-wine-900 dark:text-white">
                Express Checkout
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-ink-700/70 dark:text-stone-300">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-500/15 text-sage-700 dark:text-sage-300 px-3 py-1 font-bold border border-sage-500/25">
              <Lock className="h-3.5 w-3.5" /> 256-Bit SSL Encrypted
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-gold-400/20 text-wine-900 dark:text-gold-300 px-3 py-1 font-bold">
              <ShieldCheck className="h-3.5 w-3.5" /> 100% Authentic Guarantee
            </span>
          </div>
        </div>

        {/* Mobile Collapsible Order Summary Bar */}
        <div className="lg:hidden mb-6 rounded-2xl bg-white dark:bg-stone-900 border border-cream-200 dark:border-stone-800 p-4 shadow-sm">
          <button
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="w-full flex items-center justify-between text-xs font-bold text-wine-900 dark:text-cream-100"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gold-600" />
              {showMobileSummary ? 'Hide' : 'Show'} Order Summary ({count} items)
              {showMobileSummary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
            <span className="text-sm font-extrabold text-wine-800 dark:text-gold-300">
              {formatPrice(remainingPayableTotal)}
            </span>
          </button>

          {showMobileSummary && (
            <div className="mt-4 pt-4 border-t border-cream-200 dark:border-stone-800 space-y-3">
              {items.map((it) => (
                <div key={it.product.slug} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img src={it.product.image} alt={it.product.name} className="h-10 w-10 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold text-wine-900 dark:text-white line-clamp-1">{it.product.name}</p>
                      <p className="text-[10px] text-ink-700/60 dark:text-gray-400">Qty: {it.qty}</p>
                    </div>
                  </div>
                  <span className="font-bold text-wine-900 dark:text-gold-300">{formatPrice(it.product.price * it.qty)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          
          {/* ================= LEFT COLUMN: EXPRESS CHECKOUT STEPS ================= */}
          <div className="lg:col-span-7 space-y-6">

            {/* STEP 1: CUSTOMER CONTACT INFO */}
            <section className="rounded-[1.75rem] bg-white dark:bg-stone-900 border border-cream-200/90 dark:border-stone-800 p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-cream-100 dark:border-stone-800 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center h-6 w-6 rounded-full bg-wine-700 text-cream-50 text-[11px] font-bold">
                    1
                  </span>
                  <h2 className="font-display text-base font-bold text-wine-900 dark:text-white">
                    Contact Information
                  </h2>
                </div>
                {session ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sage-500/15 px-3 py-0.5 text-[11px] font-bold text-sage-700 dark:text-sage-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Signed In
                  </span>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-xs font-bold text-wine-700 hover:text-wine-800 dark:text-gold-300 underline"
                  >
                    Log In for 1-Click Saved Addresses
                  </button>
                )}
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-700/70 dark:text-stone-400 mb-1">
                    Email for Order Updates &amp; Invoice
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-ink-700/40 dark:text-stone-500" />
                    <input
                      type="email"
                      readOnly={!!session}
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full rounded-xl border border-cream-200 bg-cream-50/50 pl-10 pr-3 py-2.5 text-xs font-semibold text-wine-900 outline-none focus:border-wine-600 dark:border-stone-700 dark:bg-stone-800/80 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-700/70 dark:text-stone-400 mb-1">
                    Mobile Phone for Delivery SMS
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl border border-cream-200 bg-cream-100/70 px-3 py-2.5 text-xs font-bold text-wine-900 dark:border-stone-700 dark:bg-stone-800 dark:text-white">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl border border-cream-200 bg-cream-50/50 px-3.5 py-2.5 text-xs font-semibold text-wine-900 outline-none focus:border-wine-600 dark:border-stone-700 dark:bg-stone-800/80 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* STEP 2: DELIVERY ADDRESS SELECTION & MANAGEMENT */}
            <section className="rounded-[1.75rem] bg-white dark:bg-stone-900 border border-cream-200/90 dark:border-stone-800 p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-cream-100 dark:border-stone-800 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center h-6 w-6 rounded-full bg-wine-700 text-cream-50 text-[11px] font-bold">
                    2
                  </span>
                  <h2 className="font-display text-base font-bold text-wine-900 dark:text-white">
                    Delivery Address
                  </h2>
                </div>

                {!showAddressForm && (
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-wine-700 hover:text-wine-800 dark:text-gold-300 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add New Address
                  </button>
                )}
              </div>

              {/* Saved Addresses Cards Grid */}
              {!showAddressForm && addresses.length > 0 && (
                <div className="mt-4 grid sm:grid-cols-2 gap-3.5">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddrId === addr.id;
                    const cleanPhone = addr.phone.replace(/\D/g, '').slice(-10);

                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddrId(addr.id)}
                        className={`relative cursor-pointer rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-wine-600 bg-wine-700/5 ring-2 ring-wine-600/30 dark:border-gold-400 dark:bg-wine-950/40'
                            : 'border-cream-200/90 bg-cream-50/40 hover:border-wine-600/40 dark:border-stone-800 dark:bg-stone-800/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-cream-200/80 dark:bg-stone-800 px-2.5 py-0.5 text-[10px] font-bold text-wine-900 dark:text-gold-300">
                              {addr.address_type === 'Home' ? (
                                <Home className="h-3 w-3" />
                              ) : (
                                <Briefcase className="h-3 w-3" />
                              )}
                              {addr.address_type}
                            </span>
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-wine-700 dark:text-gold-300">
                                <Check className="h-3.5 w-3.5" /> Deliver Here
                              </span>
                            ) : null}
                          </div>

                          <h4 className="font-display text-sm font-bold text-wine-900 dark:text-white">
                            {addr.full_name}
                          </h4>
                          <p className="text-xs text-ink-700/70 dark:text-stone-300 mt-0.5 font-medium">
                            +91 {cleanPhone}
                          </p>
                          <p className="mt-2 text-xs text-ink-700/80 dark:text-stone-400 leading-relaxed">
                            {addr.house_no}, {addr.street}
                            {addr.landmark ? `, Near ${addr.landmark}` : ''}
                            <br />
                            {addr.city}, {addr.state} -{' '}
                            <strong className="text-wine-900 dark:text-gold-300">{addr.pincode}</strong>
                          </p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-cream-200/60 dark:border-stone-800 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditAddress(addr);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-wine-700 dark:text-gold-300 hover:underline"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                          {addresses.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(addr.id);
                              }}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 p-1"
                              title="Delete address"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No Addresses Empty State */}
              {!showAddressForm && addresses.length === 0 && (
                <div className="mt-4 text-center py-8 rounded-2xl bg-cream-50/60 dark:bg-stone-800/40 border border-dashed border-cream-300 dark:border-stone-700">
                  <MapPin className="mx-auto h-8 w-8 text-wine-600 dark:text-gold-400" />
                  <p className="mt-2 font-display text-sm font-bold text-wine-900 dark:text-white">
                    No Saved Delivery Address
                  </p>
                  <p className="text-xs text-ink-700/60 dark:text-stone-400 mt-0.5">
                    Please provide your delivery destination to complete checkout.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-wine-700 hover:bg-wine-800 text-cream-50 px-5 py-2.5 text-xs font-bold shadow transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add Delivery Address
                  </button>
                </div>
              )}

              {/* Inline Address Creation / Edit Form */}
              {showAddressForm && (
                <form onSubmit={handleSaveAddress} className="mt-4 space-y-4 rounded-2xl bg-cream-50/70 dark:bg-stone-800/50 p-5 border border-cream-200 dark:border-stone-700">
                  <div className="flex items-center justify-between border-b border-cream-200 dark:border-stone-700 pb-2">
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-wine-900 dark:text-gold-300">
                      {editingAddressId ? 'Edit Delivery Address' : 'New Delivery Address'}
                    </h3>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="text-xs font-semibold text-ink-700/60 dark:text-stone-400 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {formError && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                      {formError}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-ink-700/70 dark:text-stone-300 mb-1">
                        Recipient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2 text-xs text-wine-900 outline-none focus:border-wine-600 dark:border-stone-600 dark:bg-stone-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-ink-700/70 dark:text-stone-300 mb-1">
                        10-Digit Mobile Number *
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-xl border border-cream-300 bg-cream-100 px-2.5 py-2 text-xs font-bold text-wine-900 dark:border-stone-600 dark:bg-stone-700 dark:text-white">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 9876543210"
                          className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2 text-xs text-wine-900 outline-none focus:border-wine-600 dark:border-stone-600 dark:bg-stone-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-ink-700/70 dark:text-stone-300 mb-1">
                        6-Digit PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={formPincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        placeholder="e.g. 110001"
                        className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2 text-xs text-wine-900 outline-none focus:border-wine-600 dark:border-stone-600 dark:bg-stone-800 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-ink-700/70 dark:text-stone-300 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="e.g. New Delhi"
                        className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2 text-xs text-wine-900 outline-none focus:border-wine-600 dark:border-stone-600 dark:bg-stone-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-ink-700/70 dark:text-stone-300 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={formState}
                        onChange={(e) => setFormState(e.target.value)}
                        placeholder="e.g. Delhi"
                        className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2 text-xs text-wine-900 outline-none focus:border-wine-600 dark:border-stone-600 dark:bg-stone-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink-700/70 dark:text-stone-300 mb-1">
                      Flat / House No. / Building / Floor *
                    </label>
                    <input
                      type="text"
                      required
                      value={formHouse}
                      onChange={(e) => setFormHouse(e.target.value)}
                      placeholder="e.g. Apt 402, Royal Palms Residency"
                      className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2 text-xs text-wine-900 outline-none focus:border-wine-600 dark:border-stone-600 dark:bg-stone-800 dark:text-white"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-ink-700/70 dark:text-stone-300 mb-1">
                        Street Address / Area / Locality *
                      </label>
                      <input
                        type="text"
                        required
                        value={formStreet}
                        onChange={(e) => setFormStreet(e.target.value)}
                        placeholder="e.g. 14th Main, Indiranagar"
                        className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2 text-xs text-wine-900 outline-none focus:border-wine-600 dark:border-stone-600 dark:bg-stone-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-ink-700/70 dark:text-stone-300 mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={formLandmark}
                        onChange={(e) => setFormLandmark(e.target.value)}
                        placeholder="e.g. Near Metro Station / Behind Temple"
                        className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2 text-xs text-wine-900 outline-none focus:border-wine-600 dark:border-stone-600 dark:bg-stone-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Address Type Pills */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs font-bold text-ink-700/80 dark:text-stone-300">Type:</span>
                    {(['Home', 'Work', 'Other'] as const).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setFormType(t)}
                        className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                          formType === t
                            ? 'bg-wine-700 text-white shadow-sm'
                            : 'bg-white dark:bg-stone-700 text-ink-700 dark:text-stone-300 border border-cream-300 dark:border-stone-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="rounded-full bg-wine-700 hover:bg-wine-800 text-white px-6 py-2.5 text-xs font-bold shadow transition-all disabled:opacity-50"
                    >
                      {savingAddress ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save & Use Address'}
                    </button>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="rounded-full border border-cream-300 dark:border-stone-600 px-5 py-2.5 text-xs font-bold text-ink-700 dark:text-stone-300 hover:bg-cream-100 dark:hover:bg-stone-800"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>

            {/* STEP 3: DELIVERY SCHEDULE & PERSONALIZED GIFT MESSAGE */}
            <section className="rounded-[1.75rem] bg-white dark:bg-stone-900 border border-cream-200/90 dark:border-stone-800 p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-cream-100 dark:border-stone-800 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center h-6 w-6 rounded-full bg-wine-700 text-cream-50 text-[11px] font-bold">
                    3
                  </span>
                  <h2 className="font-display text-base font-bold text-wine-900 dark:text-white">
                    Delivery Preferences &amp; Gift Card Note
                  </h2>
                </div>
              </div>

              {/* Delivery Speed Options */}
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setDeliverySlot('standard')}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all flex items-start gap-3 ${
                    deliverySlot === 'standard'
                      ? 'border-wine-600 bg-wine-700/5 ring-1 ring-wine-600/30 dark:border-gold-400 dark:bg-wine-950/30'
                      : 'border-cream-200 bg-cream-50/40 dark:border-stone-800 dark:bg-stone-800/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery_slot"
                    checked={deliverySlot === 'standard'}
                    onChange={() => setDeliverySlot('standard')}
                    className="mt-1 accent-wine-600"
                  />
                  <div>
                    <span className="font-display text-xs font-bold text-wine-900 dark:text-white block">
                      Standard Express (3-4 Business Days)
                    </span>
                    <span className="text-[11px] text-sage-700 dark:text-sage-400 font-bold block mt-0.5">
                      {deliveryCharge === 0 ? 'FREE Shipping' : '₹99 Standard Delivery'}
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setDeliverySlot('express')}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all flex items-start gap-3 ${
                    deliverySlot === 'express'
                      ? 'border-wine-600 bg-wine-700/5 ring-1 ring-wine-600/30 dark:border-gold-400 dark:bg-wine-950/30'
                      : 'border-cream-200 bg-cream-50/40 dark:border-stone-800 dark:bg-stone-800/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery_slot"
                    checked={deliverySlot === 'express'}
                    onChange={() => setDeliverySlot('express')}
                    className="mt-1 accent-wine-600"
                  />
                  <div>
                    <span className="font-display text-xs font-bold text-wine-900 dark:text-white block flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-gold-500" /> Luxe Priority Dispatch
                    </span>
                    <span className="text-[11px] text-gold-700 dark:text-gold-300 font-bold block mt-0.5">
                      Delivered in 1-2 Business Days
                    </span>
                  </div>
                </label>
              </div>

              {/* Complimentary Handwritten Gift Card Note Accordion */}
              <div className="mt-5 rounded-2xl border border-cream-200/90 dark:border-stone-800 bg-cream-50/60 dark:bg-stone-800/40 p-4">
                <button
                  type="button"
                  onClick={() => setShowGiftOptions(!showGiftOptions)}
                  className="w-full flex items-center justify-between text-xs font-bold text-wine-900 dark:text-white"
                >
                  <span className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-gold-600" />
                    Complimentary Handwritten Gift Message Card
                    <span className="rounded-full bg-gold-400/20 text-wine-900 dark:text-gold-300 px-2 py-0.5 text-[10px] font-bold">
                      Free
                    </span>
                  </span>
                  <span className="text-xs text-wine-700 dark:text-gold-300 underline">
                    {showGiftOptions ? 'Hide Note' : '+ Add Note'}
                  </span>
                </button>

                {showGiftOptions && (
                  <div className="mt-3.5 space-y-3 pt-3 border-t border-cream-200 dark:border-stone-700">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-ink-700/70 dark:text-stone-400 mb-1">
                          To (Recipient Name)
                        </label>
                        <input
                          type="text"
                          value={giftRecipient}
                          onChange={(e) => setGiftRecipient(e.target.value)}
                          placeholder="e.g. Dear Ananya"
                          className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-xs text-wine-900 outline-none dark:border-stone-600 dark:bg-stone-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-ink-700/70 dark:text-stone-400 mb-1">
                          From (Sender Name)
                        </label>
                        <input
                          type="text"
                          value={giftSender}
                          onChange={(e) => setGiftSender(e.target.value)}
                          placeholder="e.g. With love, Rohan"
                          className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-xs text-wine-900 outline-none dark:border-stone-600 dark:bg-stone-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-ink-700/70 dark:text-stone-400 mb-1">
                        Personal Gift Message (Handwritten on Embossed Stationery)
                      </label>
                      <textarea
                        rows={2}
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Wishing you warmth, joy, and celebration on this special day! May every moment sparkle with happiness."
                        className="w-full rounded-xl border border-cream-300 bg-white p-3 text-xs text-wine-900 outline-none dark:border-stone-600 dark:bg-stone-800 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* STEP 4: PAYMENT METHOD SELECTION */}
            <section className="rounded-[1.75rem] bg-white dark:bg-stone-900 border border-cream-200/90 dark:border-stone-800 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-cream-100 dark:border-stone-800 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center h-6 w-6 rounded-full bg-wine-700 text-cream-50 text-[11px] font-bold">
                    4
                  </span>
                  <h2 className="font-display text-base font-bold text-wine-900 dark:text-white">
                    Select Payment Method
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-sage-600 dark:text-sage-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> RBI Verified Gateway
                </span>
              </div>

              {/* Option 1: Razorpay (Cards, UPI, Netbanking, Wallets) */}
              <label
                className={`block cursor-pointer rounded-2xl border p-4.5 transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-wine-600 bg-wine-700/5 ring-2 ring-wine-600/30 dark:border-gold-400 dark:bg-wine-950/40'
                    : 'border-cream-200 bg-cream-50/40 hover:border-wine-600/30 dark:border-stone-800 dark:bg-stone-800/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 accent-wine-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs sm:text-sm font-bold text-wine-900 dark:text-white flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-wine-700 dark:text-gold-300" />
                        Razorpay Secure Gateway (Instant UPI, Cards &amp; NetBanking)
                      </span>
                      <span className="rounded-full bg-gold-400/20 text-wine-900 dark:text-gold-300 text-[10px] font-extrabold px-2.5 py-0.5">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-700/70 dark:text-stone-400 mt-1 leading-relaxed">
                      Instant 1-click payment with Google Pay, PhonePe, Paytm, BHIM UPI, Visa, Mastercard, RuPay, and all major Indian banks.
                    </p>
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[10px] font-bold text-wine-800 dark:text-gold-300">
                      <span className="bg-cream-100 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-cream-200 dark:border-stone-700">
                        ⚡ Google Pay / PhonePe / Paytm
                      </span>
                      <span className="bg-cream-100 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-cream-200 dark:border-stone-700">
                        💳 Credit &amp; Debit Cards
                      </span>
                      <span className="bg-cream-100 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-cream-200 dark:border-stone-700">
                        🏦 Net Banking
                      </span>
                    </div>
                  </div>
                </div>
              </label>

              {/* Option 2: Cash on Delivery (COD) */}
              <label
                className={`block cursor-pointer rounded-2xl border p-4.5 transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-wine-600 bg-wine-700/5 ring-2 ring-wine-600/30 dark:border-gold-400 dark:bg-wine-950/40'
                    : 'border-cream-200 bg-cream-50/40 hover:border-wine-600/30 dark:border-stone-800 dark:bg-stone-800/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 accent-wine-600"
                  />
                  <div className="flex-1">
                    <span className="font-display text-xs sm:text-sm font-bold text-wine-900 dark:text-white">
                      Cash on Delivery (COD)
                    </span>
                    <p className="text-[11px] text-ink-700/70 dark:text-stone-400 mt-1">
                      Pay in cash directly to our verified courier partner at your doorstep upon receiving the hamper.
                    </p>
                  </div>
                </div>
              </label>
            </section>
          </div>

          {/* ================= RIGHT COLUMN: SHOPIFY-STYLE STICKY ORDER SUMMARY ================= */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-[2rem] bg-white dark:bg-stone-900 border border-cream-200/90 dark:border-stone-800 p-6 sm:p-7 shadow-[0_20px_50px_-20px_rgba(87,34,44,0.12)]">
                <h3 className="border-b border-cream-100 dark:border-stone-800 pb-3 font-display text-lg font-bold text-wine-900 dark:text-white flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs font-semibold text-ink-700/60 dark:text-stone-400">
                    {count} {count === 1 ? 'item' : 'items'}
                  </span>
                </h3>

                {/* Itemized Hampers List */}
                <div className="mt-4 max-h-60 overflow-y-auto space-y-3 pr-1">
                  {items.map((it) => (
                    <div
                      key={it.product.slug}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-cream-50/60 dark:bg-stone-800/50 p-3 border border-cream-100 dark:border-stone-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={it.product.image}
                            alt={it.product.name}
                            className="h-13 w-13 rounded-xl object-cover border border-cream-200 dark:border-stone-700"
                          />
                          <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-wine-700 text-[10px] font-bold text-cream-50 shadow">
                            {it.qty}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-wine-900 dark:text-white line-clamp-1">
                            {it.product.name}
                          </h4>
                          <p className="text-[10px] text-ink-700/60 dark:text-stone-400 mt-0.5">
                            Shop: {it.product.vendor_name || 'A_S Artisan Studio'}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-wine-900 dark:text-gold-300 shrink-0">
                        {formatPrice(it.product.price * it.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Promo Code Input Form */}
                <div className="mt-4 pt-4 border-t border-cream-100 dark:border-stone-800">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl bg-sage-500/10 p-3 border border-sage-500/25">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-4 w-4 text-sage-600" />
                        <div>
                          <p className="font-bold text-sage-800 dark:text-sage-300">
                            Coupon {appliedCoupon.code}
                          </p>
                          <p className="text-[10px] text-sage-700 dark:text-sage-400">
                            Saved {formatPrice(couponDiscount)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs font-bold text-red-600 hover:text-red-700 underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gold-600" />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="Coupon (e.g. WELCOME10)"
                          className="w-full rounded-full border border-cream-300 bg-cream-50 pl-8 pr-3 py-2 text-xs font-semibold uppercase text-ink-900 outline-none focus:border-wine-600 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={couponLoading || !couponInput.trim()}
                        className="rounded-full bg-wine-700 hover:bg-wine-800 text-cream-50 px-4 py-2 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                      >
                        {couponLoading ? 'Checking...' : 'Apply'}
                      </button>
                    </form>
                  )}
                  {couponMessage && !appliedCoupon && (
                    <p
                      className={`mt-1.5 text-[11px] font-semibold ${
                        couponMessage.success ? 'text-sage-600' : 'text-red-600'
                      }`}
                    >
                      {couponMessage.text}
                    </p>
                  )}
                </div>

                {/* Wallet Balance Deduction Option */}
                {walletBalance > 0 && (
                  <div className="mt-4 rounded-2xl bg-gold-400/10 border border-gold-400/30 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-gold-500 text-wine-950 flex items-center justify-center shrink-0">
                        <Wallet className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-wine-900 dark:text-cream-100">
                          Wallet Credits ({formatPrice(walletBalance)})
                        </p>
                        <p className="text-[10px] text-ink-700/60 dark:text-stone-400">
                          Apply available store credit
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useWalletBalance}
                        onChange={(e) => setUseWalletBalance(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-wine-700"></div>
                    </label>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="mt-4 pt-3 border-t border-cream-100 dark:border-stone-800 space-y-2.5 text-xs">
                  <div className="flex justify-between text-ink-700/70 dark:text-stone-300">
                    <span>Item Total</span>
                    <span className="font-semibold text-wine-900 dark:text-white">
                      {formatPrice(originalTotal || subtotal)}
                    </span>
                  </div>

                  {discountTotal > 0 && (
                    <div className="flex justify-between text-sage-700 dark:text-sage-400 font-semibold">
                      <span>Catalog Discount</span>
                      <span>- {formatPrice(discountTotal)}</span>
                    </div>
                  )}

                  {customizationTotal > 0 && (
                    <div className="flex justify-between text-ink-700/70 dark:text-stone-300">
                      <span>Packaging &amp; Custom Ribbon</span>
                      <span className="font-semibold">+ {formatPrice(customizationTotal)}</span>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sage-700 dark:text-sage-400 font-semibold">
                      <span>Coupon ({appliedCoupon?.code})</span>
                      <span>- {formatPrice(couponDiscount)}</span>
                    </div>
                  )}

                  {useWalletBalance && maxWalletUsable > 0 && (
                    <div className="flex justify-between text-gold-700 dark:text-gold-300 font-semibold">
                      <span>Wallet Credits Applied</span>
                      <span>- {formatPrice(maxWalletUsable)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-ink-700/70 dark:text-stone-300">
                    <span>Delivery Fee</span>
                    {deliveryCharge === 0 ? (
                      <span className="font-bold text-sage-600 uppercase tracking-wider">FREE</span>
                    ) : (
                      <span className="font-semibold">{formatPrice(deliveryCharge)}</span>
                    )}
                  </div>

                  <div className="border-t border-dashed border-cream-300 dark:border-stone-700 pt-3 flex items-baseline justify-between font-display font-bold text-wine-900 dark:text-white">
                    <span className="text-sm">Grand Total</span>
                    <span className="text-xl text-wine-800 dark:text-gold-300">
                      {formatPrice(remainingPayableTotal)}
                    </span>
                  </div>
                </div>

                {/* Total Savings Highlight */}
                {totalSaved > 0 && (
                  <div className="mt-3.5 rounded-xl bg-sage-500/10 p-2.5 text-center text-xs font-bold text-sage-700 dark:text-sage-300 border border-sage-500/20">
                    🎉 You are saving {formatPrice(totalSaved)} on this order!
                  </div>
                )}

                {/* Error Banner */}
                {orderError && (
                  <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* Main Shopify-Style Full Width CTA Button */}
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-wine-700 via-wine-800 to-wine-900 hover:from-wine-800 hover:to-wine-950 py-4 text-xs sm:text-sm font-bold tracking-wide text-cream-50 shadow-xl shadow-wine-900/30 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing Secure Payment...
                    </>
                  ) : paymentMethod === 'razorpay' ? (
                    <>
                      <Lock className="h-4 w-4 text-gold-300" />
                      PAY {formatPrice(remainingPayableTotal)} VIA RAZORPAY
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      CONFIRM CASH ON DELIVERY ORDER
                    </>
                  )}
                </button>

                {/* Security Trust Badges */}
                <div className="mt-5 pt-4 border-t border-cream-100 dark:border-stone-800 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-ink-700/60 dark:text-stone-400">
                  <div className="flex flex-col items-center gap-1">
                    <Lock className="h-4 w-4 text-sage-600" />
                    <span>SSL Secure</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Truck className="h-4 w-4 text-gold-600" />
                    <span>Safe Delivery</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-wine-700 dark:text-gold-300" />
                    <span>Studio Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Razorpay Fallback Gateway Modal */}
      {showRazorpayModal && (
        <RazorpayModal
          isOpen={showRazorpayModal}
          onClose={() => setShowRazorpayModal(false)}
          amount={remainingPayableTotal}
          orderNumber={`GH${Math.floor(100000 + Math.random() * 900000)}`}
          customerName={selectedAddr?.full_name || customerName || 'Valued Customer'}
          customerEmail={customerEmail || 'guest@ashamper.com'}
          customerPhone={customerPhone || '9876543210'}
          onPaymentSuccess={async (paymentId: string) => {
            setShowRazorpayModal(false);
            await createOrderRecord('Razorpay Gateway', 'paid', paymentId);
          }}
        />
      )}

      {/* Checkout Authentication Modal */}
      <CheckoutAuthModal
        isOpen={showAuthModal && !session}
        onClose={() => setShowAuthModal(false)}
        onContinueAsGuest={() => setShowAuthModal(false)}
      />
    </main>
  );
}
