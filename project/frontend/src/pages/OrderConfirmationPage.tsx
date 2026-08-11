import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ShoppingBag,
  Store,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { formatPrice } from '@/cart';
import { supabase } from '@/lib/supabase';

type SavedOrder = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  items: Array<{
    name: string;
    image: string;
    price: number;
    quantity: number;
    subtotal: number;
    vendor_name?: string;
    customization?: any;
  }>;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  estimated_delivery?: string;
};

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      // 1. Check localStorage first
      if (orderId) {
        try {
          const cached = localStorage.getItem(`as_hamper_order_${orderId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (mounted) {
              setOrder(parsed);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('Error reading order from localStorage:', e);
        }
      }

      // 2. Fetch from Supabase
      if (supabase && orderId) {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', orderId)
            .maybeSingle();

          if (!error && data && mounted) {
            setOrder({
              order_number: data.order_number,
              customer_name: data.customer_name,
              customer_email: data.customer_email,
              customer_phone: data.customer_phone,
              address: data.address,
              items: data.items || [],
              total: Number(data.total),
              payment_method: data.payment_method || 'COD',
              payment_status: data.payment_status || 'pending',
              status: data.status || 'new',
              created_at: data.created_at || new Date().toISOString(),
              estimated_delivery: '15 Aug - 18 Aug',
            });
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching order from Supabase:', err);
        }
      }

      // 3. Fallback dummy demo order
      if (mounted) {
        setOrder({
          order_number: orderId || 'GH102458',
          customer_name: 'Ashutosh Kumar',
          customer_email: 'customer@example.com',
          customer_phone: '9876543210',
          address: 'Flat 402, Royal Palms, Arera Colony, Bhopal, MP - 462001',
          items: [
            {
              name: 'Premium Birthday Gift Hamper',
              image: 'https://images.pexels.com/photos/11112057/pexels-photo-11112057.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
              price: 2899,
              quantity: 1,
              subtotal: 2899,
              vendor_name: 'A_S Artisan Gifting',
              customization: { text: 'Happy Birthday, Rahul', color: 'Black' },
            },
          ],
          total: 2899,
          payment_method: 'COD',
          payment_status: 'pending',
          status: 'new',
          created_at: new Date().toISOString(),
          estimated_delivery: '15 Aug - 18 Aug',
        });
        setLoading(false);
      }
    }

    loadOrder();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-cream-50/60 dark:bg-gray-900 pt-24 pb-20 px-4 flex items-center justify-center text-center font-sans">
        <div className="space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-wine-600 border-t-transparent"></div>
          <p className="text-xs font-semibold text-wine-800 dark:text-gold-300">
            Loading order details...
          </p>
        </div>
      </main>
    );
  }

  if (!order) return null;

  return (
    <main className="min-h-screen bg-cream-50/60 dark:bg-gray-900 pt-24 pb-28 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Success Header (Requirement 18) */}
        <div className="rounded-3xl border border-cream-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sage-500/15 text-sage-600 dark:bg-sage-500/25 dark:text-sage-400">
            <CheckCircle2 className="h-12 w-12" />
          </div>

          <span className="mt-4 inline-block rounded-full bg-sage-500/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-sage-700 dark:text-sage-300">
            ✓ Order Placed Successfully!
          </span>

          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-wine-800 dark:text-white">
            Thank you for shopping with us!
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            We have received your order and sent a copy to <span className="font-semibold text-wine-700 dark:text-gold-300">{order.customer_email}</span>.
          </p>

          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-6 rounded-2xl bg-cream-50 p-4 dark:bg-gray-700/60 border border-cream-200 dark:border-gray-600 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Order Number</span>
              <span className="font-display font-bold text-wine-800 dark:text-gold-300 text-base">
                #{order.order_number}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-600 hidden sm:block"></div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Estimated Delivery</span>
              <span className="font-semibold text-gray-800 dark:text-white flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-gold-600" /> {order.estimated_delivery || '15 Aug - 18 Aug'}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-600 hidden sm:block"></div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Amount Paid</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {formatPrice(order.total)} ({order.payment_method})
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Order Tracking Pipeline (Requirement 19) */}
        <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="font-display text-base font-bold text-wine-800 dark:text-white flex items-center gap-2 mb-6">
            <Truck className="h-4 w-4 text-gold-600" /> Order Tracking
          </h2>

          <OrderTrackingPipeline status={order.status} />
        </div>

        {/* Order Details & Items (Requirement 18) */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Delivery Address */}
          <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="font-display text-sm font-bold text-wine-800 dark:text-white flex items-center gap-2 border-b border-cream-200 dark:border-gray-700 pb-3">
              <MapPin className="h-4 w-4 text-gold-600" /> Delivery Address
            </h3>
            <div className="mt-3 text-xs text-gray-700 dark:text-gray-300 space-y-1">
              <p className="font-bold text-wine-800 dark:text-white">{order.customer_name}</p>
              <p className="text-gray-500 dark:text-gray-400">Ph: {order.customer_phone}</p>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300">{order.address}</p>
            </div>
          </div>

          {/* Payment & Order Summary */}
          <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="font-display text-sm font-bold text-wine-800 dark:text-white flex items-center gap-2 border-b border-cream-200 dark:border-gray-700 pb-3">
              <Clock className="h-4 w-4 text-gold-600" /> Payment & Summary
            </h3>
            <div className="mt-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Payment Method:</span>
                <span className="font-bold text-gray-800 dark:text-white uppercase">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Payment Status:</span>
                <span className="font-bold text-sage-600 capitalize">{order.payment_status}</span>
              </div>
              <div className="flex justify-between border-t border-cream-200 dark:border-gray-700 pt-2 font-display text-sm font-bold text-wine-800 dark:text-white">
                <span>Total Amount:</span>
                <span className="text-wine-700 dark:text-gold-300">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Listing */}
        <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="font-display text-base font-bold text-wine-800 dark:text-white border-b border-cream-200 dark:border-gray-700 pb-3">
            Ordered Items ({order.items.length})
          </h3>

          <div className="mt-4 space-y-4">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-cream-50 p-4 dark:bg-gray-700/50"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold-600">
                      <Store className="h-3 w-3" /> {item.vendor_name || 'A_S Artisan'}
                    </span>
                    <h4 className="font-display text-sm font-bold text-wine-800 dark:text-white">
                      {item.name}
                    </h4>

                    {item.customization && (
                      <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        {item.customization.text && <span>Note: "{item.customization.text}"</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                    Qty: {item.quantity} × {formatPrice(item.price)}
                  </span>
                  <span className="font-display text-sm font-bold text-wine-800 dark:text-white">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons (Requirement 18) */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => navigate('/customer')}
            className="rounded-full bg-wine-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-wine-600/30 transition-all hover:bg-wine-700"
          >
            Track Order
          </button>
          <button
            onClick={() => navigate('/customer')}
            className="rounded-full border border-cream-300 bg-white px-6 py-3 text-xs font-semibold text-wine-800 transition-all hover:bg-cream-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            View My Orders
          </button>
          <Link
            to="/all-hampers"
            className="rounded-full bg-gold-500 px-6 py-3 text-xs font-bold text-ink-900 transition-all hover:bg-gold-400"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

{/* Order Tracking Pipeline Component (Requirement 19) */}
function OrderTrackingPipeline({ status = 'new' }: { status?: string }) {
  const steps = [
    { key: 'new', label: 'Order Confirmed', done: true },
    { key: 'packed', label: 'Processing & Packed', done: status === 'packed' || status === 'shipped' || status === 'delivered' },
    { key: 'shipped', label: 'Shipped', done: status === 'shipped' || status === 'delivered' },
    { key: 'out', label: 'Out for Delivery', done: status === 'delivered' },
    { key: 'delivered', label: 'Delivered', done: status === 'delivered' },
  ];

  return (
    <div className="py-2">
      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-cream-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>

        {steps.map((step, idx) => (
          <div key={step.key} className="relative z-10 flex flex-col items-center">
            <div
              className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition-all ${
                step.done
                  ? 'bg-sage-600 text-white ring-4 ring-sage-500/20'
                  : 'bg-cream-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              }`}
            >
              {step.done ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
            </div>
            <span
              className={`mt-2 text-[11px] font-semibold ${
                step.done ? 'text-wine-800 dark:text-gold-300' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile Stacked Step View */}
      <div className="sm:hidden space-y-3">
        {steps.map((step, idx) => (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                step.done ? 'bg-sage-600 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
              }`}
            >
              {step.done ? '✓' : idx + 1}
            </div>
            <span
              className={`text-xs font-semibold ${
                step.done ? 'text-wine-800 dark:text-gold-300' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
