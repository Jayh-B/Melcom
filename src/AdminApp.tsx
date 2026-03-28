import { useState, useEffect, FormEvent } from "react";
import { 
  LayoutDashboard, 
  BarChart3,
  Users,
  Package,
  Settings,
  AlertCircle,
  LogOut,
  Lock,
  ChevronRight,
  Search,
  Filter,
  Download,
  LogIn,
  Plus,
  Minus,
  Edit,
  Trash2,
  History,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { AdminStats, Customer, Product, Order } from "./types";
import { seedProductsToFirestore, clearProductsFromFirestore } from "./seedProducts";
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
  collection, doc, getDoc, getDocs, onSnapshot, query, where, orderBy, limit, updateDoc,
  handleFirestoreError, OperationType
} from "./firebase";

const AdminLogin = ({ onLogin, error }: { onLogin: () => void, error: string }) => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-8 shadow-2xl"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-red-600/20">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Portal</h1>
          <p className="text-gray-400 text-sm">Secure access for Melcom authorized personnel only.</p>
        </div>

        <div className="space-y-6">
          <button 
            onClick={onLogin}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all transform active:scale-95 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
          >
            <LogIn size={20} /> Authenticate with Google
          </button>
          
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">System Version v5.0.0-firebase</p>
        </div>
      </motion.div>
    </div>
  );
};

export default function AdminApp() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState("");
  const [stats, setStats] = useState<AdminStats>({
    totalSales: 0,
    totalTaxCollected: 0,
    orderCount: 0,
    customerCount: 0,
    lowStockItems: 0
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, { stock: newStock });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${productId}`);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSeedProducts = async () => {
    if (window.confirm("This will add 300 products to your store. Continue?")) {
      setIsSeeding(true);
      try {
        await seedProductsToFirestore();
        alert("300 Products seeded successfully!");
      } catch (error) {
        console.error("Seeding failed:", error);
        alert("Seeding failed. Check console for details.");
      } finally {
        setIsSeeding(false);
      }
    }
  };

  const handleClearProducts = async () => {
    if (window.confirm("WARNING: This will delete ALL products from your store. Continue?")) {
      setIsClearing(true);
      try {
        await clearProductsFromFirestore();
        alert("All products cleared successfully!");
      } catch (error) {
        console.error("Clearing failed:", error);
        alert("Clearing failed. Check console for details.");
      } finally {
        setIsClearing(false);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          // Check admin status
          const userDoc = await getDoc(doc(db, "users", u.uid));
          const isDefaultAdmin = u.email === "dm570692@gmail.com";
          const hasAdminRole = userDoc.exists() && userDoc.data().role === "admin";

          if (isDefaultAdmin || hasAdminRole) {
            setUser(u);
            setIsAdmin(true);
            setAuthError("");
          } else {
            await signOut(auth);
            setAuthError("Access Denied: You do not have administrator privileges.");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          await signOut(auth);
          setAuthError("Error verifying permissions. Please try again.");
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      // Real-time stats calculation from Firestore
      const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
        const productsData = snapshot.docs.map(d => d.data() as Product);
        setProducts(productsData);
        const lowStock = productsData.filter(p => p.stock < 10).length;
        
        setStats(prev => ({
          ...prev,
          lowStockItems: lowStock,
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "products");
      });

      const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(100)), (snapshot) => {
        const orders = snapshot.docs.map(d => d.data() as Order);
        setRecentOrders(orders.slice(0, 10));
        
        const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalTax = orders.reduce((sum, o) => sum + o.taxAmount, 0);
        
        setStats(prev => ({
          ...prev,
          totalSales: totalSales,
          totalTaxCollected: totalTax,
          orderCount: snapshot.size,
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "orders");
      });

      const unsubCustomers = onSnapshot(collection(db, "customers"), (snapshot) => {
        const customersData = snapshot.docs.map(d => d.data() as Customer);
        setCustomers(customersData);
        setStats(prev => ({
          ...prev,
          customerCount: snapshot.size,
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "customers");
      });

      return () => {
        unsubProducts();
        unsubOrders();
        unsubCustomers();
      };
    }
  }, [isAdmin]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError("Authentication failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: "Out of Stock", color: "bg-red-100 text-red-600 border-red-200" };
    if (stock < 10) return { label: "Low Stock", color: "bg-orange-100 text-orange-600 border-orange-200" };
    return { label: "In Stock", color: "bg-green-100 text-green-600 border-green-200" };
  };

  if (!isAdmin) {
    return <AdminLogin onLogin={handleLogin} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-900 text-white flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">M</div>
          <span className="text-xl font-black tracking-tighter">ADMIN PANEL</span>
        </div>

        <nav className="flex-1 space-y-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mb-4">Core Management</p>
          {[
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'finance', label: 'Finance & Tax', icon: BarChart3 },
            { id: 'crm', label: 'CRM & Loyalty', icon: Users },
            { id: 'scm', label: 'SCM & Inventory', icon: Package },
            { id: 'settings', label: 'System Settings', icon: Settings },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                activeTab === tab.id ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-800">
            <button 
              onClick={handleSeedProducts}
              disabled={isSeeding}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 transition-all"
            >
              <Package size={20} />
              {isSeeding ? "Seeding 300..." : "Seed 300 Products"}
            </button>
            <button 
              onClick={handleClearProducts}
              disabled={isClearing}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-all"
            >
              <Trash2 size={20} />
              {isClearing ? "Clearing..." : "Clear All Products"}
            </button>
          </div>
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all mt-auto"
        >
          <LogOut size={20} />
          Terminate Session
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              {activeTab === 'overview' ? 'System Overview' : 
               activeTab === 'finance' ? 'Financial Control' :
               activeTab === 'crm' ? 'Customer Relations' :
               activeTab === 'scm' ? 'Supply Chain' : 'Settings'}
            </h1>
            <p className="text-gray-500 font-medium">Melcom Retail Operations Management System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-gray-600">Live Sync Active</span>
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Gross Revenue', value: `GH₵ ${stats.totalSales.toLocaleString()}`, trend: '+12.5%', color: 'text-gray-900' },
                { label: 'Order Volume', value: stats.orderCount, trend: '+8.2%', color: 'text-gray-900' },
                { label: 'Active Customers', value: stats.customerCount, trend: '+5.1%', color: 'text-gray-900' },
                { label: 'Critical Stock', value: stats.lowStockItems, trend: stats.lowStockItems > 0 ? 'Action Required' : 'Optimal', color: stats.lowStockItems > 0 ? 'text-red-600' : 'text-green-600' },
              ].map((card, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={card.label} 
                  className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-2"
                >
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{card.label}</p>
                  <p className={cn("text-3xl font-black", card.color)}>{card.value}</p>
                  <p className="text-[10px] font-bold text-green-500">{card.trend}</p>
                </motion.div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">Recent Transactions</h2>
                <div className="flex gap-2">
                  <button className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"><Filter size={20} /></button>
                  <button className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"><Download size={20} /></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Reference</th>
                      <th className="px-8 py-4">Customer</th>
                      <th className="px-8 py-4">Amount</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-8 py-6 font-mono font-bold text-gray-400">{order.id}</td>
                        <td className="px-8 py-6">
                          <p className="font-bold text-gray-900">ID: {order.customerId.slice(0, 8)}</p>
                          <p className="text-xs text-gray-400">{order.items.length} Items</p>
                        </td>
                        <td className="px-8 py-6 font-black text-gray-900">GH₵ {order.totalAmount.toLocaleString()}</td>
                        <td className="px-8 py-6">
                          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{order.status}</span>
                        </td>
                        <td className="px-8 py-6">
                          <button className="text-gray-400 group-hover:text-red-600 transition-colors"><ChevronRight size={20} /></button>
                        </td>
                      </tr>
                    ))}
                    {recentOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold">No recent transactions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search customers by name, email or phone..." 
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
                />
              </div>
              <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
                <Download size={20} /> Export CRM Data
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Customer Profile</th>
                      <th className="px-8 py-4">Contact Details</th>
                      <th className="px-8 py-4">Address</th>
                      <th className="px-8 py-4">Loyalty Status</th>
                      <th className="px-8 py-4">Last Activity</th>
                      <th className="px-8 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 font-black text-xl">
                              {c.firstName[0]}{c.lastName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{c.firstName} {c.lastName}</p>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID: {c.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-medium text-gray-600">{c.email}</p>
                          <p className="text-sm font-medium text-gray-600">{c.phone}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-medium text-gray-600 max-w-[200px] truncate">{c.address || 'N/A'}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <span>Points</span>
                              <span>{c.loyaltyPoints} / 1000</span>
                            </div>
                            <div className="w-32 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-red-600 h-full transition-all duration-1000" 
                                style={{ width: `${Math.min((c.loyaltyPoints / 1000) * 100, 100)}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-bold text-gray-400 uppercase">{c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString() : 'Never'}</p>
                        </td>
                        <td className="px-8 py-6">
                          <button className="text-gray-400 hover:text-red-600 transition-colors font-bold text-sm">Edit Profile</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-gray-900">Tax Liability</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">VAT (15%)</span>
                    <span className="font-bold">GH₵ {(stats.totalTaxCollected * 0.714).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">NHIL (2.5%)</span>
                    <span className="font-bold">GH₵ {(stats.totalTaxCollected * 0.119).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">GETFund (2.5%)</span>
                    <span className="font-bold">GH₵ {(stats.totalTaxCollected * 0.119).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">COVID Levy (1%)</span>
                    <span className="font-bold">GH₵ {(stats.totalTaxCollected * 0.048).toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between font-black text-red-600">
                    <span>Total Tax</span>
                    <span>GH₵ {stats.totalTaxCollected.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2 bg-gray-900 p-8 rounded-3xl shadow-xl space-y-6 text-white relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black">Revenue Analytics</h3>
                      <p className="text-gray-400 text-sm">Real-time financial performance tracking</p>
                    </div>
                    <BarChart3 className="text-red-600" size={40} />
                  </div>
                  <div className="h-48 flex items-end gap-2">
                    {[40, 70, 45, 90, 65, 80, 55, 100].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, duration: 1 }}
                        className="flex-1 bg-red-600 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                    <span>Today</span>
                  </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scm' && (
          <div className="space-y-10">
            {/* SCM Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total SKUs</p>
                  <p className="text-2xl font-black text-gray-900">{products.length}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Low Stock Alerts</p>
                  <p className="text-2xl font-black text-gray-900">{stats.lowStockItems}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Inventory Value</p>
                  <p className="text-2xl font-black text-gray-900">
                    GH₵ {products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by name, SKU or category..." 
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none bg-white border border-gray-200 text-gray-900 px-6 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Filter size={20} /> Filter
                </button>
                <button className="flex-1 md:flex-none bg-gray-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  <Plus size={20} /> Add Product
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Product Details</th>
                      <th className="px-8 py-4">SKU / Category</th>
                      <th className="px-8 py-4">Price</th>
                      <th className="px-8 py-4">Stock Level</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Inventory Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map(p => {
                      const status = getStockStatus(p.stock);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-100"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <p className="font-bold text-gray-900">{p.name}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID: {p.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-bold text-gray-600 font-mono">{p.sku || 'NO-SKU'}</p>
                            <p className="text-xs text-gray-400">{p.category}</p>
                          </td>
                          <td className="px-8 py-6 font-black text-gray-900">
                            GH₵ {p.price.toLocaleString()}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <span className={cn(
                                "text-lg font-black",
                                p.stock < 10 ? "text-red-600" : "text-gray-900"
                              )}>
                                {p.stock}
                              </span>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleUpdateStock(p.id, Math.max(0, p.stock - 1))}
                                  className="p-1.5 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <button 
                                  onClick={() => handleUpdateStock(p.id, p.stock + 1)}
                                  className="p-1.5 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase border",
                              status.color
                            )}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                                <Edit size={18} />
                              </button>
                              <button className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                                <History size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center text-gray-400 font-bold">
                          No products found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
