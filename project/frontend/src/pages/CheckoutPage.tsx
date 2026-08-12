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
} from 'lucide-react';
import { formatPrice, useCart } from '@/cart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { openRazorpayCheckout } from '@/lib/razorpay';
import RazorpayModal from '@/components/RazorpayModal';
import { getWalletBalance, deductWalletBalance, subscribeToRealtimeWallet } from '@/lib/orderSync';
import CheckoutAuthModal from '@/components/CheckoutAuthModal';

type Address = {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  name: string;
  phone: string;
  pincode: string;
  flat: string;
  street: string;
  city: string;
  state: string;
  landmark?: string;
  isDefault?: boolean;
};

const DEFAULT_SAVED_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    type: 'Home',
    name: 'Ashutosh Kumar',
    phone: '9876543210',
    pincode: '462001',
    flat: 'Flat 402, Royal Palms',
    street: 'Arera Colony',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    landmark: 'Near Bittan Market',
    isDefault: true,
  },
  {
    id: 'addr-2',
    type: 'Work',
    name: 'Ashutosh Kumar',
    phone: '9876543210',
    pincode: '462011',
    flat: 'Suite 204, Tech Park',
    street: 'MP Nagar Zone 1',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    landmark: 'Opposite DB Mall',
  },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const {
    items,
    count,
    subtotal,
    discountTotal,
    customizationTotal,
    couponDiscount,
    deliveryCharge,
    finalTotal,
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

  // Address State
  const [addresses, setAddresses] = useState<Address[]>(DEFAULT_SAVED_ADDRESSES);
  const [selectedAddrId, setSelectedAddrId] = useState<string>(DEFAULT_SAVED_ADDRESSES[0].id);
  const [showAddAddrModal, setShowAddAddrModal] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);

  // Address Form State
  const [addrForm, setAddrForm] = useState<Partial<Address>>({
    type: 'Home',
    name: '',
    phone: '',
    pincode: '',
    flat: '',
    street: '',
    city: '',
    state: '',
    landmark: '',
  });

  const [addrError, setAddrError] = useState<string | null>(null);
  const [pinVerification, setPinVerification] = useState<{ valid: boolean; message: string; date: string } | null>({
    valid: true,
    message: 'Delivery available to 462001',
    date: '15 Aug - 18 Aug',
  });

  // Payment Method & Razorpay Modal state
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Refund Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(false);

  // Checkout Auth Modal state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    if (!session) {
      setShowAuthModal(true);
    }
  }, [session]);

  // Load user profile & wallet details if logged in
  useEffect(() => {
    if (session?.user) {
      setCustomerEmail(session.user.email || '');
      setCustomerName(profile?.full_name || session.user.user_metadata?.full_name || '');
      const rawMob = profile?.phone || session.user.user_metadata?.phone || '';
      const cleanDigits = rawMob.replace(/\D/g, '');
      setCustomerPhone(cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits);

      getWalletBalance(session.user.id).then(setWalletBalance);
      const unsubscribe = subscribeToRealtimeWallet(session.user.id, setWalletBalance);
      return () => unsubscribe();
    }
  }, [session, profile]);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-cream-50/60 dark:bg-gray-900 pt-24 pb-20 px-4 sm:px-6 lg:px-8 font-sans transition-colors text-center py-20">
        <ShoppingBag className="mx-auto h-16 w-16 text-wine-600 dark:text-gold-300" />
        <h1 className="mt-4 font-display text-2xl font-bold text-wine-800 dark:text-white">
          No items to checkout
        </h1>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Your cart is currently empty.
        </p>
        <Link
          to="/all-hampers"
          className="mt-6 inline-flex rounded-full bg-wine-600 px-6 py-3 text-xs font-bold text-white shadow hover:bg-wine-700"
        >
          Explore Gift Hampers
        </Link>
      </main>
    );
  }

  const selectedAddr = addresses.find((a) => a.id === selectedAddrId) || addresses[0];

  const handlePincodeCheck = (pin: string) => {
    const cleanPin = pin.trim();
    if (cleanPin.length === 6 && /^\d{6}$/.test(cleanPin)) {
      setPinVerification({
        valid: true,
        message: `✓ Delivery available to ${cleanPin}`,
        date: 'Estimated delivery by 15 Aug',
      });
    } else {
      setPinVerification(null);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddrError(null);

    const cleanMobile = (addrForm.phone || '').replace(/\D/g, '').slice(-10);

    if (!addrForm.name?.trim()) return setAddrError('Full name is required');
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      return setAddrError('Please enter a valid 10-digit Indian mobile number.');
    }
    if (!addrForm.pincode || !/^\d{6}$/.test(addrForm.pincode)) {
      return setAddrError('Enter a valid 6-digit PIN code');
    }
    if (!addrForm.flat?.trim()) return setAddrError('House/Flat/Building is required');
    if (!addrForm.street?.trim()) return setAddrError('Street/Area is required');
    if (!addrForm.city?.trim()) return setAddrError('City is required');
    if (!addrForm.state?.trim()) return setAddrError('State is required');

    if (editingAddr) {
      setAddresses((prev) =>
        prev.map((a) => (a.id === editingAddr.id ? ({ ...a, ...addrForm, phone: cleanMobile } as Address) : a))
      );
    } else {
      const newAddr: Address = {
        id: `addr-${Date.now()}`,
        type: addrForm.type as 'Home' | 'Work' | 'Other',
        name: addrForm.name!,
        phone: cleanMobile,
        pincode: addrForm.pincode!,
        flat: addrForm.flat!,
        street: addrForm.street!,
        city: addrForm.city!,
        state: addrForm.state!,
        landmark: addrForm.landmark,
      };
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddrId(newAddr.id);
    }

    setShowAddAddrModal(false);
    setEditingAddr(null);
    setAddrForm({ type: 'Home', name: '', phone: '', pincode: '', flat: '', street: '', city: '', state: '', landmark: '' });
  };

  const maxWalletUsable = useWalletBalance ? Math.min(walletBalance, finalTotal) : 0;
  const remainingPayableTotal = Math.max(0, finalTotal - maxWalletUsable);

  // Process Final Order Creation in Database & LocalStorage
  const createOrderRecord = async (payMethod: string, payStatus: string, razorpayPaymentId?: string) => {
    const finalCustomerName = selectedAddr?.name || customerName || profile?.full_name || session?.user?.user_metadata?.full_name || 'Valued Customer';
    const finalCustomerPhone = (selectedAddr?.phone || customerPhone || profile?.phone || '9876543210').replace(/\D/g, '').slice(-10);
    const finalCustomerEmail = session?.user?.email || customerEmail || 'guest@ashamper.com';
    const orderNum = `GH${Math.floor(100000 + Math.random() * 900000)}`;

    if (maxWalletUsable > 0 && session?.user?.id) {
      await deductWalletBalance(session.user.id, orderNum, maxWalletUsable);
    }

    const orderData = {
      order_number: orderNum,
      customer_id: session?.user?.id || null,
      customer_name: finalCustomerName,
      customer_email: finalCustomerEmail,
      customer_phone: finalCustomerPhone,
      address: `${selectedAddr.flat}, ${selectedAddr.street}, ${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}`,
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
      estimated_delivery: '15 Aug - 18 Aug',
    };

    try {
      localStorage.setItem(`as_hamper_order_${orderNum}`, JSON.stringify(localOrder));
      localStorage.setItem('as_hamper_latest_order', JSON.stringify(localOrder));
    } catch (e) {
      console.error('Localstorage order save error:', e);
    }

    clear();
    navigate(`/order-confirmation/${orderNum}`);
  };

  const handlePlaceOrder = async () => {
    setOrderError(null);

    const cleanMobile = customerPhone.replace(/\D/g, '').slice(-10);

    if (!customerName.trim()) {
      setOrderError('Please enter your full name.');
      return;
    }

    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      setOrderError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!selectedAddr) {
      setOrderError('Please select a valid delivery address.');
      return;
    }

    setPlacingOrder(true);

    if (remainingPayableTotal === 0) {
      await createOrderRecord('WALLET', 'paid');
      setPlacingOrder(false);
      return;
    }

    if (paymentMethod === 'razorpay') {
      const tempOrderNum = `GH${Math.floor(100000 + Math.random() * 900000)}`;

      await openRazorpayCheckout({
        amount: remainingPayableTotal,
        orderNumber: tempOrderNum,
        customerName: customerName,
        customerEmail: customerEmail || 'guest@ashamper.com',
        customerPhone: cleanMobile,
        onSuccess: async (rzpRes) => {
          await createOrderRecord('RAZORPAY', 'paid', rzpRes.razorpay_payment_id);
          setPlacingOrder(false);
        },
        onFailure: (errorMsg) => {
          setPlacingOrder(false);
          if (errorMsg === 'RAZORPAY_FALLBACK' || !errorMsg) {
            setShowRazorpayModal(true);
          } else if (errorMsg.includes('cancelled')) {
            setOrderError('Payment process was cancelled.');
          } else {
            setShowRazorpayModal(true);
          }
        },
      });
    } else {
      // Cash on Delivery
      await createOrderRecord('COD', 'pending');
      setPlacingOrder(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream-50/60 dark:bg-gray-900 pt-24 pb-28 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      <div className="mx-auto max-w-7xl">
        {/* Step Progress Indicator */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cream-200 dark:border-gray-800 pb-6">
          <div>
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-800 dark:text-gold-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Edit Cart
            </Link>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-wine-800 dark:text-white">
              Checkout
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-sage-600 dark:text-sage-400">
              <CheckCircle2 className="h-4 w-4" /> Cart
            </span>
            <span className="text-gray-300 dark:text-gray-600">→</span>
            <span className="flex items-center gap-1.5 rounded-full bg-wine-600 px-3.5 py-1.5 text-white shadow-sm">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-bold text-wine-700">
                2
              </span>
              Delivery
            </span>
            <span className="text-gray-300 dark:text-gray-600">→</span>
            <span className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                3
              </span>
              Review
            </span>
            <span className="text-gray-300 dark:text-gray-600">→</span>
            <span className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                4
              </span>
              Confirmation
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* LEFT COLUMN: Checkout Form Sections */}
          <div className="lg:col-span-7 space-y-6">

            {/* Express Checkout Account Banner for Guest Users */}
            {!session && (
              <div className="rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center h-10 w-10 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                    <User className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold text-amber-900 dark:text-amber-100">
                      Express Checkout Account
                    </h3>
                    <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                      Sign in or register to save addresses, earn wallet rewards &amp; track your order live.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="shrink-0 rounded-full bg-wine-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-wine-700 transition-all shadow-md"
                >
                  Sign In / Register
                </button>
              </div>
            )}

            {/* 1. Delivery Address Manager */}
            <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-cream-200 dark:border-gray-700 pb-3">
                <h2 className="font-display text-base font-bold text-wine-800 dark:text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gold-600" /> Delivery Address
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddr(null);
                    setAddrForm({
                      type: 'Home',
                      name: customerName,
                      phone: customerPhone,
                      pincode: '462001',
                      flat: '',
                      street: '',
                      city: 'Bhopal',
                      state: 'Madhya Pradesh',
                      landmark: '',
                    });
                    setShowAddAddrModal(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-3 py-1.5 text-xs font-semibold text-wine-700 hover:bg-cream-200 dark:bg-gray-700 dark:text-gold-300 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New Address
                </button>
              </div>

              {/* Saved Address Cards */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {addresses.map((addr) => {
                  const isSelected = selectedAddrId === addr.id;
                  const displayMobile = addr.phone.replace(/\D/g, '').slice(-10);
                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddrId(addr.id);
                        handlePincodeCheck(addr.pincode);
                      }}
                      className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all ${
                        isSelected
                          ? 'border-wine-600 bg-wine-600/5 ring-2 ring-wine-600/30 dark:bg-wine-600/10'
                          : 'border-cream-200 bg-cream-50/50 hover:border-wine-600/40 dark:border-gray-700 dark:bg-gray-700/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 rounded-full bg-wine-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                            {addr.type === 'Home' ? <Home className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                            {addr.type}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-wine-600 dark:text-gold-300">
                              ✓ Selected
                            </span>
                          )}
                        </div>

                        <h4 className="mt-2 font-display text-sm font-bold text-wine-800 dark:text-white">
                          {addr.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                          Mobile: +91 {displayMobile}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {addr.flat}, {addr.street}, {addr.city}, {addr.state} -{' '}
                          <span className="font-bold text-wine-700 dark:text-gold-300">{addr.pincode}</span>
                        </p>
                      </div>

                      <div className="mt-3 border-t border-cream-200 dark:border-gray-600 pt-2 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAddrId(addr.id);
                            handlePincodeCheck(addr.pincode);
                          }}
                          className={`font-semibold ${
                            isSelected ? 'text-wine-600 dark:text-gold-300' : 'text-gray-600 hover:text-wine-600'
                          }`}
                        >
                          {isSelected ? 'Deliver Here ✓' : 'Select Address'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAddr(addr);
                            setAddrForm({ ...addr, phone: displayMobile });
                            setShowAddAddrModal(true);
                          }}
                          className="text-gray-400 hover:text-wine-600"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Availability Banner */}
              {pinVerification && (
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-sage-500/10 p-3.5 border border-sage-500/30 text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-sage-600" />
                    <div>
                      <p className="font-bold text-sage-800 dark:text-sage-300">
                        {pinVerification.message}
                      </p>
                      <p className="text-[11px] text-sage-700 dark:text-sage-400">
                        {pinVerification.date} · {deliveryCharge === 0 ? 'FREE Delivery' : 'Standard Delivery ₹99'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Order Review Section */}
            <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-cream-200 dark:border-gray-700 pb-3">
                <h2 className="font-display text-base font-bold text-wine-800 dark:text-white">
                  Review Your Order ({count} items)
                </h2>
                <Link to="/cart" className="text-xs font-semibold text-wine-600 hover:underline dark:text-gold-300">
                  Edit Cart
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {items.map((i) => (
                  <div
                    key={i.product.slug}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-cream-50 p-3 text-xs dark:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={i.product.image}
                        alt={i.product.name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div>
                        <h4 className="font-display font-bold text-wine-800 dark:text-white">
                          {i.product.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Qty: {i.qty} × {formatPrice(i.product.price)} · Shop: {i.product.vendor_name || 'A_S Artisan'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-wine-800 dark:text-white">
                      {formatPrice(i.product.price * i.qty)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Payment Section with Razorpay Integration */}
            <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-cream-200 dark:border-gray-700 pb-3">
                <h2 className="font-display text-base font-bold text-wine-800 dark:text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gold-600" /> Select Payment Method
                </h2>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  {
                    id: 'razorpay',
                    label: 'Online Payment (Razorpay - Google Pay, PhonePe, Paytm, Cards, BHIM, Netbanking)',
                    desc: 'Real-time 100% secure payment via UPI Apps, Google Pay, PhonePe, Paytm, Credit/Debit Cards & Net Banking',
                    badge: '⚡ Recommended',
                  },
                  {
                    id: 'cod',
                    label: 'Cash on Delivery (COD)',
                    desc: 'Pay cash when your gift hamper arrives at your doorstep',
                  },
                ].map((pay) => {
                  const isChecked = paymentMethod === pay.id;
                  return (
                    <label
                      key={pay.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                        isChecked
                          ? 'border-wine-600 bg-wine-600/5 ring-1 ring-wine-600 dark:bg-wine-600/10'
                          : 'border-cream-200 bg-cream-50/40 hover:border-wine-600/30 dark:border-gray-700 dark:bg-gray-700/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={isChecked}
                        onChange={() => setPaymentMethod(pay.id as any)}
                        className="mt-1 accent-wine-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-display text-xs font-bold text-wine-800 dark:text-white">
                            {pay.label}
                          </p>
                          {pay.badge && (
                            <span className="rounded-full bg-wine-600 px-2 py-0.5 text-[9px] font-bold text-white">
                              {pay.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {pay.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary & Final Place Order CTA */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-[0_20px_50px_-20px_rgba(87,34,44,0.15)] dark:border-gray-700 dark:bg-gray-800">
                <h3 className="border-b border-cream-200 dark:border-gray-700 pb-3 font-display text-lg font-bold text-wine-800 dark:text-white">
                  Order Summary
                </h3>

                {/* Refund Wallet Balance Card Option */}
                {walletBalance > 0 && (
                  <div className="mt-4 rounded-2xl bg-gold-500/10 border border-gold-500/30 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-gold-500 text-wine-950 flex items-center justify-center shrink-0">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-wine-900 dark:text-cream-50">
                          Use Refund Wallet Balance
                        </p>
                        <p className="text-[11px] text-ink-700/60 dark:text-gray-300">
                          Available: <span className="font-semibold text-gold-600 dark:text-gold-300">{formatPrice(walletBalance)}</span>
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
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-gold-500"></div>
                    </label>
                  </div>
                )}

                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Subtotal ({count} items)</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>

                  {discountTotal > 0 && (
                    <div className="flex justify-between text-sage-700 dark:text-sage-400">
                      <span>Discount</span>
                      <span className="font-semibold">- {formatPrice(discountTotal)}</span>
                    </div>
                  )}

                  {customizationTotal > 0 && (
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>Customization Fee</span>
                      <span className="font-semibold">+ {formatPrice(customizationTotal)}</span>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sage-700 dark:text-sage-400">
                      <span>Coupon Discount</span>
                      <span className="font-semibold">- {formatPrice(couponDiscount)}</span>
                    </div>
                  )}

                  {maxWalletUsable > 0 && (
                    <div className="flex justify-between text-gold-600 dark:text-gold-400 font-bold">
                      <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> Wallet Applied</span>
                      <span className="font-bold">- {formatPrice(maxWalletUsable)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Delivery</span>
                    {deliveryCharge === 0 ? (
                      <span className="font-bold text-sage-600 uppercase tracking-wider">FREE</span>
                    ) : (
                      <span className="font-semibold">{formatPrice(deliveryCharge)}</span>
                    )}
                  </div>

                  <div className="border-t border-dashed border-cream-300 dark:border-gray-700 pt-3 flex justify-between font-display text-base font-bold text-wine-800 dark:text-white">
                    <span>Total Payable</span>
                    <span className="text-lg text-wine-700 dark:text-gold-300">{formatPrice(remainingPayableTotal)}</span>
                  </div>
                </div>

                {orderError && (
                  <div className="mt-4 rounded-2xl bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* Final Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="group mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-wine-600 py-4 text-sm font-bold tracking-wide text-white shadow-lg shadow-wine-600/30 transition-all hover:bg-wine-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing Payment...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'razorpay' ? 'PAY NOW WITH RAZORPAY' : 'PLACE ORDER (COD)'} ({formatPrice(finalTotal)})
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <div className="mt-4 text-center">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3 text-sage-600" /> 100% Razorpay Encrypted Checkout
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Razorpay Payment Modal Overlay */}
      <RazorpayModal
        isOpen={showRazorpayModal}
        amount={finalTotal}
        orderNumber={`GH${Math.floor(100000 + Math.random() * 900000)}`}
        customerName={customerName}
        customerEmail={customerEmail || 'customer@ashamper.com'}
        customerPhone={customerPhone}
        onClose={() => {
          setShowRazorpayModal(false);
          setPlacingOrder(false);
        }}
        onPaymentSuccess={async (paymentId, method) => {
          setShowRazorpayModal(false);
          await createOrderRecord(method, 'paid', paymentId);
          setPlacingOrder(false);
        }}
      />

      {/* Add / Edit Address Modal */}
      {showAddAddrModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h3 className="font-display text-lg font-bold text-wine-800 dark:text-white">
              {editingAddr ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h3>

            <form onSubmit={handleSaveAddress} className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(['Home', 'Work', 'Other'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAddrForm((p) => ({ ...p, type: t }))}
                    className={`rounded-full py-2 text-xs font-semibold transition-all ${
                      addrForm.type === t
                        ? 'bg-wine-600 text-white'
                        : 'bg-cream-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <input
                type="text"
                required
                placeholder="Full Name *"
                value={addrForm.name || ''}
                onChange={(e) => setAddrForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-2xl border border-cream-300 bg-cream-50 p-2.5 text-xs text-ink-800 outline-none focus:border-wine-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-semibold text-xs text-gray-500 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Mobile Number *"
                    value={addrForm.phone || ''}
                    onChange={(e) => setAddrForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                    className="w-full rounded-2xl border border-cream-300 bg-cream-50 pl-11 pr-2.5 py-2.5 text-xs text-ink-800 outline-none focus:border-wine-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-medium"
                  />
                </div>

                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="PIN Code (6-digit) *"
                  value={addrForm.pincode || ''}
                  onChange={(e) => {
                    const pin = e.target.value.replace(/\D/g, '');
                    setAddrForm((p) => ({ ...p, pincode: pin }));
                    handlePincodeCheck(pin);
                  }}
                  className="w-full rounded-2xl border border-cream-300 bg-cream-50 p-2.5 text-xs text-ink-800 outline-none focus:border-wine-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <input
                type="text"
                required
                placeholder="Flat / House No. / Building Name *"
                value={addrForm.flat || ''}
                onChange={(e) => setAddrForm((p) => ({ ...p, flat: e.target.value }))}
                className="w-full rounded-2xl border border-cream-300 bg-cream-50 p-2.5 text-xs text-ink-800 outline-none focus:border-wine-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />

              <input
                type="text"
                required
                placeholder="Street / Colony / Area *"
                value={addrForm.street || ''}
                onChange={(e) => setAddrForm((p) => ({ ...p, street: e.target.value }))}
                className="w-full rounded-2xl border border-cream-300 bg-cream-50 p-2.5 text-xs text-ink-800 outline-none focus:border-wine-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="City *"
                  value={addrForm.city || ''}
                  onChange={(e) => setAddrForm((p) => ({ ...p, city: e.target.value }))}
                  className="w-full rounded-2xl border border-cream-300 bg-cream-50 p-2.5 text-xs text-ink-800 outline-none focus:border-wine-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="State *"
                  value={addrForm.state || ''}
                  onChange={(e) => setAddrForm((p) => ({ ...p, state: e.target.value }))}
                  className="w-full rounded-2xl border border-cream-300 bg-cream-50 p-2.5 text-xs text-ink-800 outline-none focus:border-wine-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <input
                type="text"
                placeholder="Landmark (Optional)"
                value={addrForm.landmark || ''}
                onChange={(e) => setAddrForm((p) => ({ ...p, landmark: e.target.value }))}
                className="w-full rounded-2xl border border-cream-300 bg-cream-50 p-2.5 text-xs text-ink-800 outline-none focus:border-wine-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />

              {addrError && <p className="text-xs text-red-600 font-semibold">{addrError}</p>}

              <div className="mt-4 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddrModal(false)}
                  className="rounded-full px-5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-wine-600 px-6 py-2 text-xs font-semibold text-white hover:bg-wine-700"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-cream-200 p-4 shadow-lg dark:bg-gray-900/95 dark:border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Total Amount</span>
          <span className="font-display text-base font-bold text-wine-800 dark:text-gold-300">
            {formatPrice(finalTotal)}
          </span>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={placingOrder}
          className="rounded-full bg-wine-600 px-6 py-3 text-xs font-bold text-white shadow hover:bg-wine-700 disabled:opacity-60 flex items-center gap-2"
        >
          {placingOrder ? 'Processing...' : paymentMethod === 'razorpay' ? 'PAY NOW' : 'PLACE ORDER'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <CheckoutAuthModal
        isOpen={showAuthModal && !session}
        onClose={() => setShowAuthModal(false)}
        onContinueAsGuest={() => setShowAuthModal(false)}
      />
    </main>
  );
}
