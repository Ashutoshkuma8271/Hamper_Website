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
  QrCode,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';
import { formatPrice, useCart } from '@/cart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { openRazorpayCheckout } from '@/lib/razorpay';
import RazorpayModal from '@/components/RazorpayModal';
import { getWalletBalance, deductWalletBalance, subscribeToRealtimeWallet } from '@/lib/orderSync';
import { getSavedAddresses, saveDeliveryAddress, type DeliveryAddress } from '@/lib/addressStore';
import CheckoutAuthModal from '@/components/CheckoutAuthModal';
import { toast } from 'react-hot-toast';

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

  // Address State - Strictly isolated per user
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>('');
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
  const [pinVerification, setPinVerification] = useState<{ valid: boolean; message: string; date: string } | null>(null);

  // Payment Method State - NO DEFAULT SELECTED
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'razorpay' | 'cod' | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Refund Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(false);

  // Checkout Auth Modal state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const merchantUpiId = 'ashutoshgifthamper@upi';

  useEffect(() => {
    if (!session) {
      setShowAuthModal(true);
    }
  }, [session]);

  // Load user profile & user-isolated delivery addresses
  useEffect(() => {
    if (session?.user) {
      setCustomerEmail(session.user.email || '');
      setCustomerName(profile?.full_name || session.user.user_metadata?.full_name || '');
      const rawMob = profile?.phone || session.user.user_metadata?.phone || '';
      const cleanDigits = rawMob.replace(/\D/g, '');
      setCustomerPhone(cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits);

      getWalletBalance(session.user.id).then(setWalletBalance);
      const unsubscribe = subscribeToRealtimeWallet(session.user.id, setWalletBalance);

      // Load user delivery addresses strictly matching session.user.id
      getSavedAddresses(session.user.id).then((saved) => {
        if (saved && saved.length > 0) {
          const mapped: Address[] = saved.map((a) => ({
            id: a.id,
            type: a.address_type as 'Home' | 'Work' | 'Other',
            name: a.full_name,
            phone: a.phone,
            pincode: a.pincode,
            flat: a.house_no,
            street: a.street,
            city: a.city,
            state: a.state,
            landmark: a.landmark,
            isDefault: a.is_default,
          }));
          setAddresses(mapped);
          const def = mapped.find((m) => m.isDefault) || mapped[0];
          setSelectedAddrId(def.id);
          if (def.pincode) handlePincodeCheck(def.pincode);
        } else {
          setAddresses([]);
          setSelectedAddrId('');
        }
      });

      return () => unsubscribe();
    } else {
      setAddresses([]);
      setSelectedAddrId('');
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
        date: 'Estimated delivery in 2-4 business days',
      });
    } else {
      setPinVerification(null);
    }
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
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

    try {
      const savedAddr = await saveDeliveryAddress(
        {
          id: editingAddr?.id,
          full_name: addrForm.name.trim(),
          phone: cleanMobile,
          house_no: addrForm.flat.trim(),
          street: addrForm.street.trim(),
          city: addrForm.city.trim(),
          state: addrForm.state.trim(),
          pincode: addrForm.pincode.trim(),
          landmark: addrForm.landmark?.trim() || '',
          address_type: (addrForm.type as any) || 'Home',
          is_default: addresses.length === 0,
        },
        session?.user?.id
      );

      const newAddrItem: Address = {
        id: savedAddr.id,
        type: savedAddr.address_type as any,
        name: savedAddr.full_name,
        phone: savedAddr.phone,
        pincode: savedAddr.pincode,
        flat: savedAddr.house_no,
        street: savedAddr.street,
        city: savedAddr.city,
        state: savedAddr.state,
        landmark: savedAddr.landmark,
        isDefault: savedAddr.is_default,
      };

      if (editingAddr) {
        setAddresses((prev) => prev.map((a) => (a.id === editingAddr.id ? newAddrItem : a)));
      } else {
        setAddresses((prev) => [newAddrItem, ...prev]);
        setSelectedAddrId(newAddrItem.id);
      }

      setShowAddAddrModal(false);
      setEditingAddr(null);
      setAddrForm({ type: 'Home', name: '', phone: '', pincode: '', flat: '', street: '', city: '', state: '', landmark: '' });
      toast.success('Delivery address saved successfully!');
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : 'Failed to save address.');
    }
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
      estimated_delivery: 'Estimated in 2-4 business days',
    };

    try {
      const existing = localStorage.getItem('a_s_hamper_orders');
      const parsed = existing ? JSON.parse(existing) : [];
      localStorage.setItem('a_s_hamper_orders', JSON.stringify([localOrder, ...parsed]));
    } catch (e) {
      console.error('Local order save error:', e);
    }

    clear();
    navigate(`/order-confirmation?orderId=${orderNum}`);
  };

  const handlePlaceOrder = async () => {
    setOrderError(null);

    if (!selectedAddr) {
      setOrderError('Please select or add a delivery address to proceed.');
      return;
    }

    if (!paymentMethod) {
      setOrderError('Please select your preferred payment method (UPI, Razorpay, or COD).');
      return;
    }

    setPlacingOrder(true);

    if (paymentMethod === 'cod') {
      await createOrderRecord('COD', 'pending');
      setPlacingOrder(false);
      return;
    }

    if (paymentMethod === 'upi') {
      // Direct UPI QR payment verification
      setShowRazorpayModal(true);
      return;
    }

    if (paymentMethod === 'razorpay') {
      setShowRazorpayModal(true);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `upi://pay?pa=${merchantUpiId}&pn=MyGiftHamper&am=${Math.round(remainingPayableTotal)}&cu=INR`
  )}`;

  return (
    <main className="min-h-screen bg-cream-50/60 dark:bg-gray-900 pt-24 pb-20 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      <div className="mx-auto max-w-7xl">
        {/* Navigation Breadcrumb Header */}
        <div className="flex items-center justify-between border-b border-cream-200 dark:border-gray-800 pb-4 mb-6">
          <button
            onClick={() => navigate('/cart')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-wine-700 hover:text-wine-900 dark:text-gold-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </button>

          <h1 className="font-display text-xl sm:text-2xl font-bold text-wine-800 dark:text-white flex items-center gap-2">
            <Lock className="h-5 w-5 text-gold-500" /> Secure Checkout
          </h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Customer Info, Addresses & Payment Options */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Customer Contact Details */}
            <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-cream-200 dark:border-gray-700 pb-3">
                <h2 className="font-display text-base font-bold text-wine-800 dark:text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-wine-600 dark:text-gold-300" /> 1. Customer Contact
                </h2>
                {session ? (
                  <span className="rounded-full bg-sage-500/15 px-3 py-1 text-[11px] font-bold text-sage-700 dark:text-sage-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Logged In
                  </span>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-xs font-bold text-wine-600 hover:underline dark:text-gold-300"
                  >
                    Log In for Faster Checkout
                  </button>
                )}
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 font-medium mb-1">Customer Email</label>
                  <input
                    type="email"
                    readOnly={!!session}
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-2xl border border-cream-300 bg-cream-50/60 p-3 text-wine-800 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 font-medium mb-1">Mobile Number</label>
                  <div className="flex items-center gap-2">
                    <span className="rounded-2xl border border-cream-300 bg-cream-100 p-3 text-wine-800 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit number"
                      className="w-full rounded-2xl border border-cream-300 bg-cream-50/60 p-3 text-wine-800 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. User Delivery Addresses Section */}
            <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-cream-200 dark:border-gray-700 pb-3">
                <h2 className="font-display text-base font-bold text-wine-800 dark:text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-wine-600 dark:text-gold-300" /> 2. Delivery Address
                </h2>
                <button
                  onClick={() => {
                    setEditingAddr(null);
                    setAddrForm({
                      type: 'Home',
                      name: customerName,
                      phone: customerPhone,
                      pincode: '',
                      flat: '',
                      street: '',
                      city: '',
                      state: '',
                      landmark: '',
                    });
                    setShowAddAddrModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-wine-600 hover:text-wine-700 dark:text-gold-300"
                >
                  <Plus className="h-4 w-4" /> Add New Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="mt-4 text-center py-6 rounded-2xl bg-cream-50 dark:bg-gray-700/50 border border-dashed border-cream-300 dark:border-gray-600">
                  <MapPin className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    No delivery addresses saved for this account.
                  </p>
                  <button
                    onClick={() => {
                      setEditingAddr(null);
                      setAddrForm({
                        type: 'Home',
                        name: customerName,
                        phone: customerPhone,
                        pincode: '',
                        flat: '',
                        street: '',
                        city: '',
                        state: '',
                        landmark: '',
                      });
                      setShowAddAddrModal(true);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-wine-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-wine-700"
                  >
                    <Plus className="h-4 w-4" /> Add Delivery Address
                  </button>
                </div>
              ) : (
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
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
                        className={`relative cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-wine-600 bg-wine-600/5 ring-2 ring-wine-600/30 dark:border-gold-400 dark:bg-wine-900/30'
                            : 'border-cream-200 bg-cream-50/40 hover:border-wine-600/40 dark:border-gray-700 dark:bg-gray-700/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 rounded-full bg-cream-200 px-2.5 py-0.5 text-[10px] font-bold text-wine-800 dark:bg-gray-600 dark:text-gray-200">
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
              )}

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

            {/* 4. Payment Options - NO DEFAULT SELECTED */}
            <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4">
              <div className="border-b border-cream-200 dark:border-gray-700 pb-3">
                <h2 className="font-display text-base font-bold text-wine-800 dark:text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gold-600" /> Select Payment Option
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Choose your preferred payment method below.
                </p>
              </div>

              <div className="space-y-3">
                {/* Option 1: Instant UPI QR Code */}
                <label
                  className={`block cursor-pointer rounded-2xl border p-4 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-wine-600 bg-wine-600/5 ring-2 ring-wine-600/30 dark:bg-wine-900/30'
                      : 'border-cream-200 bg-cream-50/40 hover:border-wine-600/30 dark:border-gray-700 dark:bg-gray-700/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment_option"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="mt-1 accent-wine-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xs font-bold text-wine-800 dark:text-white flex items-center gap-1.5">
                          <QrCode className="h-4 w-4 text-wine-600 dark:text-gold-300" />
                          UPI Payment (Scan QR Code / Google Pay, PhonePe, Paytm, BHIM)
                        </span>
                        <span className="rounded-full bg-gold-500/20 text-wine-900 dark:text-gold-300 text-[10px] font-bold px-2 py-0.5">
                          Instant Scan &amp; Pay
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        Scan auto-generated UPI QR code or copy merchant UPI ID to complete payment instantly.
                      </p>
                    </div>
                  </div>

                  {/* Dynamic QR Code & Merchant UPI ID display box */}
                  {paymentMethod === 'upi' && (
                    <div className="mt-4 pt-4 border-t border-cream-200 dark:border-gray-700 text-center space-y-3 animate-fade-in">
                      <div className="inline-block p-3 rounded-2xl bg-white shadow-md border border-cream-300 dark:border-gray-600">
                        <img
                          src={qrCodeUrl}
                          alt="UPI Payment QR Code"
                          className="h-44 w-44 mx-auto rounded-xl"
                        />
                        <p className="mt-2 text-[11px] font-bold text-wine-800 dark:text-gray-900">
                          Scan to pay {formatPrice(remainingPayableTotal)}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 max-w-sm mx-auto bg-cream-100 dark:bg-gray-700/80 p-2.5 rounded-xl border border-cream-300 dark:border-gray-600">
                        <span className="text-xs font-mono font-bold text-wine-800 dark:text-gold-300">
                          UPI ID: {merchantUpiId}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCopyUpiId();
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-wine-600 hover:text-wine-800 dark:text-gold-300 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg border shadow-sm"
                        >
                          {copiedUpi ? <Check className="h-3.5 w-3.5 text-sage-600" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedUpi ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 font-medium">
                        <Smartphone className="h-3.5 w-3.5 text-sage-600" />
                        Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI App
                      </p>
                    </div>
                  )}
                </label>

                {/* Option 2: Razorpay Gateway */}
                <label
                  className={`block cursor-pointer rounded-2xl border p-4 transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-wine-600 bg-wine-600/5 ring-2 ring-wine-600/30 dark:bg-wine-900/30'
                      : 'border-cream-200 bg-cream-50/40 hover:border-wine-600/30 dark:border-gray-700 dark:bg-gray-700/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment_option"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="mt-1 accent-wine-600"
                    />
                    <div className="flex-1">
                      <span className="font-display text-xs font-bold text-wine-800 dark:text-white">
                        Online Payment (Credit / Debit Card / NetBanking / Razorpay)
                      </span>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        Pay via Visa, Mastercard, RuPay, NetBanking &amp; Digital Wallets through Razorpay.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Option 3: Cash on Delivery (COD) */}
                <label
                  className={`block cursor-pointer rounded-2xl border p-4 transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-wine-600 bg-wine-600/5 ring-2 ring-wine-600/30 dark:bg-wine-900/30'
                      : 'border-cream-200 bg-cream-50/40 hover:border-wine-600/30 dark:border-gray-700 dark:bg-gray-700/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment_option"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 accent-wine-600"
                    />
                    <div className="flex-1">
                      <span className="font-display text-xs font-bold text-wine-800 dark:text-white">
                        Cash on Delivery (COD)
                      </span>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        Pay cash directly to the delivery partner upon arrival.
                      </p>
                    </div>
                  </div>
                </label>
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
                  <div className="mt-4 rounded-2xl bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2 dark:bg-red-950/40 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* Final Place Order / Pay Now Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="group mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-wine-600 py-4 text-sm font-bold tracking-wide text-white shadow-lg shadow-wine-600/30 transition-all hover:bg-wine-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing Order...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'upi'
                        ? `PAY NOW VIA UPI (${formatPrice(remainingPayableTotal)})`
                        : paymentMethod === 'razorpay'
                        ? `PAY NOW WITH RAZORPAY (${formatPrice(remainingPayableTotal)})`
                        : paymentMethod === 'cod'
                        ? `PLACE ORDER (COD ${formatPrice(remainingPayableTotal)})`
                        : `SELECT PAYMENT METHOD (${formatPrice(remainingPayableTotal)})`}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <div className="mt-4 text-center">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3 text-sage-600" /> 100% Secure Encrypted Checkout
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
        amount={remainingPayableTotal}
        orderNumber={`GH${Math.floor(100000 + Math.random() * 900000)}`}
        customerName={customerName || selectedAddr?.name || 'Valued Customer'}
        customerEmail={customerEmail || 'customer@ashamper.com'}
        customerPhone={customerPhone || selectedAddr?.phone || '9876543210'}
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
            {formatPrice(remainingPayableTotal)}
          </span>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={placingOrder}
          className="rounded-full bg-wine-600 px-6 py-3 text-xs font-bold text-white shadow hover:bg-wine-700 disabled:opacity-60 flex items-center gap-2"
        >
          {placingOrder ? 'Processing...' : paymentMethod ? 'PROCEED TO PAY' : 'SELECT PAYMENT'}
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
