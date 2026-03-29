import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, BarChart3, Users, Package, Settings, LogOut, Lock,
  LogIn, AlertCircle, Search, Filter, Download, Plus, Minus, Edit, Trash2,
  History, TrendingUp, AlertTriangle, Upload, X, Save, ChevronDown,
  RefreshCw, UserCheck, ShieldCheck, Building2, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { AdminStats, Customer, Product, Order, Supplier, UserRole } from './types';
import { uploadProductImage, validateImageFile } from './lib/storage';
import {
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
  collection, doc, getDoc, getDocs, onSnapshot, query, orderBy, limit,
  updateDoc, setDoc, deleteDoc, where, handleFirestoreError, OperationType, writeBatch
} from './firebase';
import { useToast } from './context/ToastContext';
import { ToastContainer } from './components/Toast';
import { StatCardSkeleton } from './components/Skeleton';

// ── Admin Login Screen ────────────────────────────────────────────────────────

function AdminLogin({ onLogin, error, devBypass, onDevSignIn }: { onLogin: () => void; error: string; devBypass?: boolean; onDevSignIn?: () => void }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-8 shadow-2xl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-600/20">
            <Lock size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Admin Portal</h1>
          <p className="text-gray-500 text-sm">Secure access for Melcom authorised personnel only.</p>
        </div>
        <button onClick={onLogin}
          className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2">
          <LogIn size={18} /> Authenticate with Google
        </button>
        {devBypass && (
          <button onClick={onDevSignIn}
            className="w-full mt-3 bg-gray-800 text-white py-3 rounded-2xl font-bold hover:bg-gray-900 transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2">
            <UserCheck size={16} /> Dev sign in (bypass)
          </button>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm font-medium bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}
        <p className="text-center text-[10px] text-gray-700 uppercase tracking-widest font-bold">System Version v5.1.0-firebase</p>
      </motion.div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, trend, trendPositive, loading }: { label: string; value: string | number; trend: string; trendPositive: boolean; loading: boolean }) {
  if (loading) return <StatCardSkeleton />;
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      <p className={cn('text-xs font-bold', trendPositive ? 'text-green-500' : 'text-red-500')}>{trend}</p>
    </div>
  );
}

// ── Image Upload Widget ───────────────────────────────────────────────────────

function ImageUpload({ productId, currentImage, onUploaded }: { productId: string; currentImage: string; onUploaded: (url: string) => void }) {
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) { addToast(validation.error!, 'error'); return; }
    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    try {
      const url = await uploadProductImage(file, productId);
      setPreview(url);
      onUploaded(url);
      addToast('Image uploaded successfully', 'success');
    } catch (e) {
      setPreview(currentImage);
      addToast('Upload failed. Check storage rules.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div
        onClick={() => inputRef.current?.click()}
        className="w-16 h-16 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-red-400 transition-colors cursor-pointer relative">
        {preview
          ? <img src={preview} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Upload size={20} className="text-gray-400" /></div>
        }
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Upload size={16} className="text-white" />
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

// ── Supplier Modal ────────────────────────────────────────────────────────────

function SupplierModal({ supplier, onClose, onSave }: {
  supplier: Partial<Supplier> | null;
  onClose: () => void;
  onSave: (s: Partial<Supplier>) => void;
}) {
  const [form, setForm] = useState<Partial<Supplier>>(supplier || { status: 'Active' });
  const isEdit = !!supplier?.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-black">{isEdit ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[
            ['name', 'Company Name', 'text', true],
            ['email', 'Contact Email', 'email', true],
            ['phone', 'Phone Number', 'tel', false],
            ['address', 'Address', 'text', false],
            ['paymentTerms', 'Payment Terms (e.g. Net 30)', 'text', false],
          ].map(([field, label, type, required]) => (
            <div key={field as string} className="space-y-1">
              <label className="text-sm font-bold text-gray-700">{label as string} {required ? '*' : ''}</label>
              <input type={type as string} required={required as boolean}
                value={(form as any)[field as string] || ''}
                onChange={e => setForm(p => ({ ...p, [field as string]: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition-all" />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-600/20 outline-none resize-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Status</label>
            <select value={form.status || 'Active'} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-2xl font-bold text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-red-700 flex items-center justify-center gap-2">
              <Save size={16} /> {isEdit ? 'Save Changes' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Admin App ─────────────────────────────────────────────────────────────────

export default function AdminApp() {
  const { addToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [statsLoading, setStatsLoading] = useState(true);

  // Data
  const [stats, setStats] = useState<AdminStats>({ totalSales: 0, totalTaxCollected: 0, orderCount: 0, customerCount: 0, lowStockItems: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);

  // UI state
  const [productSearch, setProductSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierModal, setSupplierModal] = useState<Partial<Supplier> | null | undefined>(undefined); // undefined = closed
  const [seeding, setSeeding] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          const isDefault = u.email === 'dm570692@gmail.com';
          const hasRole = userDoc.exists() && ['admin', 'manager'].includes(userDoc.data().role);
          if (isDefault || hasRole) {
            setUser(u); setIsAdmin(true); setAuthError('');
          } else {
            await signOut(auth);
            setAuthError('Access denied: no admin privileges.');
          }
        } catch {
          await signOut(auth);
          setAuthError('Could not verify permissions. Try again.');
        }
      } else {
        setUser(null); setIsAdmin(false);
      }
      setAuthLoading(false);
    });
  }, []);

  // Dev auth bypass for local development
  const handleDevSignIn = () => {
    if (import.meta.env.MODE === 'production') return;
    const devUser = { uid: 'dev-admin', email: 'dev@local', displayName: 'Dev Admin', photoURL: '' };
    setUser(devUser as any);
    setIsAdmin(true);
    setAuthLoading(false);
    setAuthError('');
  };

  // ── Real-time data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;

    const unsubs: (() => void)[] = [];

    // Products
    unsubs.push(onSnapshot(collection(db, 'products'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
      setProducts(data);
      setStats(p => ({ ...p, lowStockItems: data.filter(x => x.stock < 10).length }));
    }));

    // Orders (last 100)
    unsubs.push(onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)), snap => {
      const data = snap.docs.map(d => d.data() as Order);
      setOrders(data);
      setStats(p => ({
        ...p,
        totalSales: data.reduce((s, o) => s + o.totalAmount, 0),
        totalTaxCollected: data.reduce((s, o) => s + o.taxAmount, 0),
        orderCount: snap.size,
      }));
      setStatsLoading(false);
    }));

    // Customers
    unsubs.push(onSnapshot(collection(db, 'customers'), snap => {
      setCustomers(snap.docs.map(d => d.data() as Customer));
      setStats(p => ({ ...p, customerCount: snap.size }));
    }));

    // Suppliers
    unsubs.push(onSnapshot(query(collection(db, 'suppliers'), orderBy('name')), snap => {
      setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Supplier[]);
    }));

    // Roles
    unsubs.push(onSnapshot(collection(db, 'users'), snap => {
      setRoles(snap.docs.map(d => d.data() as UserRole));
    }));

    return () => unsubs.forEach(u => u());
  }, [isAdmin]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch { setAuthError('Authentication failed. Please try again.'); }
  };

  const handleLogout = () => signOut(auth).catch(console.error);

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      await updateDoc(doc(db, 'products', productId), { stock: Math.max(0, newStock) });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const handleUpdateImage = async (productId: string, imageUrl: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), { image: imageUrl });
    } catch (e) {
      addToast('Failed to update product image', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      addToast('Product deleted', 'success');
    } catch { addToast('Failed to delete product', 'error'); }
  };

  const handleSaveSupplier = async (data: Partial<Supplier>) => {
    const id = data.id || `SUP-${Date.now()}`;
    try {
      await setDoc(doc(db, 'suppliers', id), { ...data, id, createdAt: data.createdAt || new Date().toISOString() });
      addToast(data.id ? 'Supplier updated' : 'Supplier added', 'success');
      setSupplierModal(undefined);
    } catch { addToast('Failed to save supplier', 'error'); }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('Remove this supplier?')) return;
    try {
      await deleteDoc(doc(db, 'suppliers', id));
      addToast('Supplier removed', 'success');
    } catch { addToast('Failed to remove supplier', 'error'); }
  };

  const handleRoleChange = async (uid: string, role: UserRole['role']) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      addToast(`Role updated to ${role}`, 'success');
    } catch { addToast('Failed to update role', 'error'); }
  };

  const handleSeedProducts = async () => {
    if (!window.confirm('Seed 10 demo products to Firestore?')) return;
    setSeeding(true);
    try {
      const demo = [
        { id: 'demo-1', sku: 'ELC-001', name: 'Samsung 55" QLED TV', description: 'Crystal UHD 4K Smart TV', price: 4500, stock: 15, category: 'Electronics & Appliances', image: 'https://picsum.photos/seed/tv/400/300' },
        { id: 'demo-2', sku: 'APP-002', name: 'LG Double Door Fridge', description: 'Inverter Linear Compressor', price: 8200, stock: 8, category: 'Electronics & Appliances', image: 'https://picsum.photos/seed/fridge/400/300' },
        { id: 'demo-3', sku: 'GRO-003', name: 'Jasmine Rice 5kg', description: 'Premium long grain rice', price: 120, stock: 500, category: 'Supermarket', image: 'https://picsum.photos/seed/rice/400/300' },
        { id: 'demo-4', sku: 'MOB-004', name: 'iPhone 15 Pro', description: 'A17 Pro chip, titanium', price: 12500, stock: 12, category: 'Mobiles & Computers', image: 'https://picsum.photos/seed/phone/400/300' },
        { id: 'demo-5', sku: 'FUR-005', name: 'Executive Office Chair', description: 'Ergonomic lumbar support', price: 1800, stock: 10, category: 'Furniture', image: 'https://picsum.photos/seed/chair/400/300' },
        { id: 'demo-6', sku: 'SPT-006', name: 'Treadmill Pro 2000', description: '15 programmes, foldable', price: 5600, stock: 5, category: 'Sports & Fitness', image: 'https://picsum.photos/seed/treadmill/400/300' },
        { id: 'demo-7', sku: 'APP-007', name: 'Midea Split AC 1.5HP', description: 'Inverter, 5-star energy rating', price: 3100, stock: 20, category: 'Electronics & Appliances', image: 'https://picsum.photos/seed/ac/400/300' },
        { id: 'demo-8', sku: 'TOY-008', name: 'Lego City Police Set', description: '743 pieces, age 7+', price: 540, stock: 30, category: 'Toys & Entertainment', image: 'https://picsum.photos/seed/lego/400/300' },
        { id: 'demo-9', sku: 'GRO-009', name: 'Sunlight Washing Powder 5kg', description: 'Tough on stains, gentle on fabric', price: 185, stock: 200, category: 'Supermarket', image: 'https://picsum.photos/seed/detergent/400/300' },
        { id: 'demo-10', sku: 'MOB-010', name: 'Dell Laptop 15"', description: 'i5 12th gen, 16GB RAM', price: 7800, stock: 7, category: 'Mobiles & Computers', image: 'https://picsum.photos/seed/laptop/400/300' },
      ];
      const batch = writeBatch(db);
      demo.forEach(p => batch.set(doc(db, 'products', p.id), p));
      await batch.commit();
      addToast('Demo products seeded', 'success');
    } catch { addToast('Seeding failed', 'error'); }
    finally { setSeeding(false); }
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-600' };
    if (stock < 10)  return { label: 'Low Stock',    cls: 'bg-amber-100 text-amber-600' };
    return              { label: 'In Stock',     cls: 'bg-green-100 text-green-700' };
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  // ── Guards ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAdmin) return <AdminLogin onLogin={handleLogin} error={authError} devBypass={import.meta.env.VITE_DEV_AUTH_BYPASS === 'true'} onDevSignIn={handleDevSignIn} />;

  // ── Sidebar nav items ─────────────────────────────────────────────────────
  const navItems = [
    { id: 'overview',   label: 'Dashboard',       icon: LayoutDashboard },
    { id: 'finance',    label: 'Finance & Tax',    icon: BarChart3 },
    { id: 'crm',        label: 'CRM & Loyalty',    icon: Users },
    { id: 'scm',        label: 'SCM & Inventory',  icon: Package },
    { id: 'suppliers',  label: 'Suppliers',         icon: Building2 },
    { id: 'roles',      label: 'Role Management',  icon: ShieldCheck },
    { id: 'settings',   label: 'Settings',         icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {import.meta.env.MODE !== 'production' && (typeof window !== 'undefined') && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
        <div className="w-full bg-yellow-50 border-b border-yellow-200 text-yellow-800 p-3 text-sm flex items-center justify-center">
          ⚠️ Firebase OAuth Notice — running on <strong className="mx-1">{window.location.hostname}</strong>. If Google Sign-In fails, add this domain to your Firebase Console → Authentication → Settings → Authorized domains.
        </div>
      )}
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col p-5 sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center font-black text-lg">M</div>
          <div><p className="font-black text-sm leading-none">ADMIN PANEL</p><p className="text-[10px] text-gray-500 font-bold">Melcom Ghana</p></div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all',
                activeTab === id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
              <Icon size={18} />{label}
            </button>
          ))}
          <div className="pt-3 border-t border-gray-800 mt-3 space-y-1">
            <button onClick={handleSeedProducts} disabled={seeding}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40 transition-all">
              <RefreshCw size={18} className={seeding ? 'animate-spin' : ''} />
              {seeding ? 'Seeding...' : 'Seed Demo Products'}
            </button>
          </div>
        </nav>

        <div className="pt-4 border-t border-gray-800 space-y-2">
          <p className="text-xs text-gray-500 px-3 font-bold truncate">{user?.email}</p>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-100 px-8 py-5 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-gray-500">Melcom Retail Operations Management</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-700">Live Sync</span>
            </div>
          </div>
        </header>

        <div className="p-8">

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Gross Revenue" value={`GH₵ ${stats.totalSales.toLocaleString()}`} trend="+12.5% vs last month" trendPositive loading={statsLoading} />
                <StatCard label="Total Orders" value={stats.orderCount} trend="+8.2% this week" trendPositive loading={statsLoading} />
                <StatCard label="Active Customers" value={stats.customerCount} trend="+5.1% new signups" trendPositive loading={statsLoading} />
                <StatCard label="Critical Stock" value={`${stats.lowStockItems} items`} trend={stats.lowStockItems > 0 ? 'Action Required' : 'Optimal'} trendPositive={stats.lowStockItems === 0} loading={statsLoading} />
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-xl font-black">Recent Transactions</h2>
                  <div className="flex gap-2">
                    <button className="p-2 bg-gray-50 rounded-xl text-gray-500 hover:text-gray-900 transition-colors"><Filter size={18} /></button>
                    <button className="p-2 bg-gray-50 rounded-xl text-gray-500 hover:text-gray-900 transition-colors"><Download size={18} /></button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      <tr>
                        {['Order ID', 'Customer', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                          <th key={h} className="px-6 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.slice(0, 10).map(o => (
                        <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm text-gray-500">{o.id}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {o.shippingDetails?.fullName || `User ${o.customerId.slice(0, 6)}`}
                          </td>
                          <td className="px-6 py-4 font-black text-gray-900">GH₵ {o.totalAmount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{o.paymentMethod}</td>
                          <td className="px-6 py-4">
                            <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase',
                              o.status === 'Paid' || o.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                              o.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                              o.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                            )}>{o.status}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No transactions yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── FINANCE ──────────────────────────────────────────────────── */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-black text-lg">Tax Liability Breakdown</h3>
                  {[
                    ['VAT (15%)',         stats.totalTaxCollected * 0.714],
                    ['NHIL (2.5%)',       stats.totalTaxCollected * 0.119],
                    ['GETFund (2.5%)',    stats.totalTaxCollected * 0.119],
                    ['COVID Levy (1%)',   stats.totalTaxCollected * 0.048],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label as string}</span>
                      <span className="font-bold">GH₵ {(val as number).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between font-black text-red-600">
                    <span>Total Tax</span>
                    <span>GH₵ {stats.totalTaxCollected.toLocaleString()}</span>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-gray-900 p-6 rounded-3xl text-white space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black">Revenue Analytics</h3>
                      <p className="text-gray-400 text-sm">Weekly performance trend</p>
                    </div>
                    <BarChart3 className="text-red-600" size={32} />
                  </div>
                  <div className="h-40 flex items-end gap-2">
                    {[40, 70, 45, 90, 65, 80, 55, 100].map((h, i) => (
                      <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, duration: 0.8 }}
                        className="flex-1 bg-red-600 rounded-t-lg" style={{ opacity: 0.6 + (i / 20) }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Today'].map(d => <span key={d}>{d}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CRM ──────────────────────────────────────────────────────── */}
          {activeTab === 'crm' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" placeholder="Search customers..." className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-600/20 outline-none w-72" />
                </div>
                <button className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-gray-800">
                  <Download size={16} /> Export CSV
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      <tr>
                        {['Customer', 'Contact', 'Loyalty Points', 'Last Purchase', 'Actions'].map(h => (
                          <th key={h} className="px-6 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {customers.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center font-black text-red-600">
                                {c.firstName?.[0]}{c.lastName?.[0]}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-gray-900">{c.firstName} {c.lastName}</p>
                                <p className="text-[11px] text-gray-400 font-mono">{c.id.slice(0, 12)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">{c.email}</p>
                            <p className="text-sm text-gray-500">{c.phone}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-[80px]">
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-600 rounded-full" style={{ width: `${Math.min((c.loyaltyPoints / 1000) * 100, 100)}%` }} />
                                </div>
                              </div>
                              <span className="text-sm font-bold">{c.loyaltyPoints}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString() : '—'}</td>
                          <td className="px-6 py-4">
                            <button className="text-sm font-bold text-red-600 hover:text-red-700">Edit</button>
                          </td>
                        </tr>
                      ))}
                      {customers.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No customers yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SCM / INVENTORY ──────────────────────────────────────────── */}
          {activeTab === 'scm' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center"><Package size={22} className="text-blue-600" /></div>
                  <div><p className="text-xs font-black text-gray-400 uppercase tracking-wider">Total SKUs</p><p className="text-2xl font-black">{products.length}</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center"><AlertTriangle size={22} className="text-amber-600" /></div>
                  <div><p className="text-xs font-black text-gray-400 uppercase tracking-wider">Low Stock</p><p className="text-2xl font-black">{stats.lowStockItems}</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center"><TrendingUp size={22} className="text-green-600" /></div>
                  <div><p className="text-xs font-black text-gray-400 uppercase tracking-wider">Inventory Value</p><p className="text-2xl font-black">GH₵ {products.reduce((s, p) => s + p.price * p.stock, 0).toLocaleString()}</p></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search by name, SKU or category..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-600/20 outline-none" />
                </div>
                <button className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-gray-800">
                  <Plus size={16} /> Add Product
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      <tr>
                        {['Product', 'SKU / Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-6 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredProducts.map(p => {
                        const status = getStockStatus(p.stock);
                        return (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <ImageUpload productId={p.id} currentImage={p.image} onUploaded={url => handleUpdateImage(p.id, url)} />
                                <div>
                                  <p className="font-bold text-sm text-gray-900">{p.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">{p.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-mono font-bold text-gray-600">{p.sku || '—'}</p>
                              <p className="text-xs text-gray-400">{p.category}</p>
                            </td>
                            <td className="px-6 py-4 font-black text-gray-900">GH₵ {p.price.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={cn('text-lg font-black', p.stock < 10 ? 'text-red-600' : 'text-gray-900')}>{p.stock}</span>
                                <div className="flex gap-1">
                                  <button onClick={() => handleUpdateStock(p.id, p.stock - 1)} className="p-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" aria-label="Decrease stock"><Minus size={12} /></button>
                                  <button onClick={() => handleUpdateStock(p.id, p.stock + 1)} className="p-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" aria-label="Increase stock"><Plus size={12} /></button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase', status.cls)}>{status.label}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1">
                                <button className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all" aria-label="Edit"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all" aria-label="Delete"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProducts.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No products match your search.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SUPPLIERS ────────────────────────────────────────────────── */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              {supplierModal !== undefined && (
                <SupplierModal supplier={supplierModal} onClose={() => setSupplierModal(undefined)} onSave={handleSaveSupplier} />
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)}
                    placeholder="Search suppliers..." className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-600/20 outline-none w-64" />
                </div>
                <button onClick={() => setSupplierModal({ status: 'Active' })}
                  className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors">
                  <Plus size={16} /> Add Supplier
                </button>
              </div>

              <div className="grid gap-4">
                {filteredSuppliers.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-lg text-gray-400">
                        {s.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-gray-900">{s.name}</p>
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black uppercase', s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>{s.status}</span>
                        </div>
                        <p className="text-sm text-gray-500">{s.email} {s.phone && `· ${s.phone}`}</p>
                        {s.paymentTerms && <p className="text-xs text-gray-400 mt-0.5">Payment: {s.paymentTerms}</p>}
                        {s.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{s.notes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setSupplierModal(s)} className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-bold hover:bg-gray-50">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDeleteSupplier(s.id)} className="flex items-center gap-1.5 border border-red-100 text-red-600 px-3 py-2 rounded-xl text-sm font-bold hover:bg-red-50">
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
                {filteredSuppliers.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-3xl border border-gray-100">
                    <Building2 size={36} className="text-gray-300 mx-auto mb-4" />
                    <p className="font-bold text-gray-500">No suppliers yet</p>
                    <button onClick={() => setSupplierModal({ status: 'Active' })} className="mt-4 text-sm text-red-600 font-bold hover:underline">Add your first supplier</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ROLE MANAGEMENT ──────────────────────────────────────────── */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">Changing a user's role takes effect immediately. Managers have access to inventory and orders but cannot manage roles or suppliers.</p>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      <tr>
                        {['User', 'Email', 'Current Role', 'Change Role'].map(h => (
                          <th key={h} className="px-6 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {roles.map(r => (
                        <tr key={r.uid} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {r.photoURL ? (
                                <img src={r.photoURL} alt="" className="w-9 h-9 rounded-xl" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-500">
                                  {r.displayName?.[0] || r.email?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <p className="font-bold text-sm text-gray-900">{r.displayName || '—'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{r.email}</td>
                          <td className="px-6 py-4">
                            <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase',
                              r.role === 'admin' ? 'bg-red-100 text-red-700' :
                              r.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            )}>{r.role}</span>
                          </td>
                          <td className="px-6 py-4">
                            {r.uid !== user?.uid ? (
                              <div className="flex gap-2">
                                {(['admin', 'manager', 'customer'] as const).map(role => (
                                  <button key={role} disabled={r.role === role}
                                    onClick={() => handleRoleChange(r.uid, role)}
                                    className={cn('px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                                      r.role === role ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                      role === 'admin' ? 'border border-red-200 text-red-600 hover:bg-red-50' :
                                      role === 'manager' ? 'border border-blue-200 text-blue-600 hover:bg-blue-50' :
                                      'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    )}>
                                    {role}
                                  </button>
                                ))}
                              </div>
                            ) : <span className="text-xs text-gray-400 italic">You (cannot change own role)</span>}
                          </td>
                        </tr>
                      ))}
                      {roles.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No users registered yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ─────────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="font-black text-lg">Store Configuration</h3>
                {[
                  ['Store Name', 'Melcom Ghana Limited'],
                  ['GRA TIN', 'C0003849284'],
                  ['VAT Registration', 'V0013288X'],
                  ['Support Email', 'support@melcom.com.gh'],
                  ['Paystack Public Key', import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '(not set in .env.local)'],
                  ['reCAPTCHA Site Key', import.meta.env.VITE_RECAPTCHA_SITE_KEY || '(not set in .env.local)'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm font-bold text-gray-600">{label}</span>
                    <span className="text-sm text-gray-900 font-mono text-right max-w-[60%] break-all">{value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="font-black text-lg">Environment Variables</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Create a <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code> file with these variables:
                </p>
                <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto font-mono">
{`VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
VITE_RECAPTCHA_SITE_KEY=6Le...
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_GEMINI_API_KEY=AIza...
VITE_APP_CHECK_DEBUG=true    # dev only
PAYSTACK_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG....
FROM_EMAIL=noreply@melcom.com.gh`}
                </pre>
              </div>
            </div>
          )}

        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
