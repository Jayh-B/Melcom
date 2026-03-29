import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Search, Filter, Clock, CheckCircle2, Truck, XCircle, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, Customer } from '../types';
import { cn } from '../lib/utils';
import { InvoiceButton } from '../components/InvoiceButton';
import { OrderRowSkeleton } from '../components/Skeleton';
import { db, collection, query, where, orderBy, onSnapshot } from '../firebase';

const statusConfig: Record<string, { label: string; cls: string; icon: any; step: number }> = {
  Pending:    { label: 'Pending',    cls: 'bg-gray-100 text-gray-600',    icon: Clock,        step: 0 },
  Paid:       { label: 'Paid',       cls: 'bg-blue-50 text-blue-700',     icon: CheckCircle2, step: 1 },
  Processing: { label: 'Processing', cls: 'bg-amber-50 text-amber-700',   icon: Package,      step: 2 },
  Shipped:    { label: 'Shipped',    cls: 'bg-purple-50 text-purple-700', icon: Truck,        step: 3 },
  Delivered:  { label: 'Delivered',  cls: 'bg-green-50 text-green-700',   icon: CheckCircle2, step: 4 },
  Cancelled:  { label: 'Cancelled',  cls: 'bg-red-50 text-red-600',       icon: XCircle,      step: -1 },
};

const STEPS = ['Paid', 'Processing', 'Shipped', 'Delivered'];

interface Props {
  user: any;
  customer: Partial<Customer>;
}

export function OrderHistory({ user, customer }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => d.data() as Order));
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || o.status === filter;
    return matchSearch && matchFilter;
  });

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center space-y-6">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
          <Package size={32} className="text-gray-400" />
        </div>
        <h2 className="text-3xl font-black">Sign in to view orders</h2>
        <p className="text-gray-500">You need to be signed in to view your order history.</p>
        <Link to="/" className="inline-block bg-red-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-700 transition-colors">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/catalog" className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2">
          <ShoppingBag size={16} /> Shop More
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-colors',
                filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <OrderRowSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <Package size={40} className="text-gray-300 mx-auto" />
            <p className="font-bold text-gray-500">{orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}</p>
            {orders.length === 0 && (
              <Link to="/catalog" className="inline-block text-sm text-red-600 font-bold hover:underline">
                Start Shopping →
              </Link>
            )}
          </div>
        ) : (
          filtered.map((order, idx) => {
            const st = statusConfig[order.status] ?? statusConfig['Pending'];
            const Icon = st.icon;
            const isExp = expanded === order.id;

            return (
              <div key={order.id} className={cn('border-b border-gray-50 last:border-0', isExp && 'bg-gray-50/50')}>
                {/* Row */}
                <button
                  className="w-full flex items-center gap-4 p-5 sm:p-6 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExp ? null : order.id)}
                  aria-expanded={isExp}
                >
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Package size={24} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 font-mono text-sm">{order.id}</p>
                      <span className={cn('text-[10px] font-black uppercase px-2 py-0.5 rounded-full', st.cls)}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {' · '}{order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-gray-900">GH₵ {order.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{order.paymentMethod}</p>
                  </div>
                  <ChevronRight size={18} className={cn('text-gray-400 transition-transform shrink-0', isExp && 'rotate-90')} />
                </button>

                {/* Expanded */}
                <AnimatePresence>
                  {isExp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 space-y-6">
                        {/* Progress tracker */}
                        {order.status !== 'Cancelled' && (
                          <div className="flex items-center gap-0">
                            {STEPS.map((step, i) => {
                              const done = st.step > i;
                              const active = st.step === i + 1;
                              return (
                                <div key={step} className="flex items-center flex-1">
                                  <div className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-all',
                                    done || active ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
                                  )}>
                                    {done ? '✓' : i + 1}
                                  </div>
                                  <div className="text-center flex-1 -mx-1">
                                    <p className={cn('text-[9px] font-bold uppercase tracking-wider mt-2', (done || active) ? 'text-red-600' : 'text-gray-400')}>
                                      {step}
                                    </p>
                                  </div>
                                  {i < STEPS.length - 1 && (
                                    <div className={cn('h-0.5 flex-1', done ? 'bg-red-600' : 'bg-gray-200')} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Items */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Items</h4>
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-gray-100" referrerPolicy="no-referrer" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                                {item.selectedVariations && (
                                  <p className="text-xs text-gray-500">
                                    {Object.entries(item.selectedVariations).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold">GH₵ {(item.price * item.quantity).toLocaleString()}</p>
                                <p className="text-xs text-gray-400">×{item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Delivery info */}
                        {order.shippingDetails && (
                          <div className="bg-white rounded-2xl p-4 border border-gray-100">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Delivery To</h4>
                            <p className="text-sm font-bold text-gray-900">{order.shippingDetails.fullName}</p>
                            <p className="text-sm text-gray-600">{order.shippingDetails.address}, {order.shippingDetails.city}</p>
                            <p className="text-sm text-gray-600">{order.shippingDetails.phone}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 flex-wrap">
                          <InvoiceButton order={order} customer={{ ...customer, id: user.uid }} />
                          {order.status === 'Delivered' && (
                            <Link to={`/catalog`} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                              Buy Again
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
