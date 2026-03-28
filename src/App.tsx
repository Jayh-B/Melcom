import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  User, 
  Search, 
  Menu, 
  X, 
  ShoppingCart, 
  ChevronRight, 
  LayoutDashboard, 
  Truck, 
  CreditCard, 
  BarChart3,
  Users,
  Package,
  Settings,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LogOut,
  LogIn,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { Product, CartItem, Order, Customer, AdminStats, TaxBreakdown } from "./types";
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
  collection, doc, setDoc, getDoc, getDocs, onSnapshot, query, where, orderBy, limit, updateDoc,
  handleFirestoreError, OperationType, runTransaction
} from "./firebase";

// --- Components ---

const Navbar = ({ cartCount, wishlistCount, user, onLogin, onLogout, searchQuery, setSearchQuery }: { 
  cartCount: number, 
  wishlistCount: number,
  user: any, 
  onLogin: () => void, 
  onLogout: () => void,
  searchQuery: string,
  setSearchQuery: (q: string) => void
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-gray-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-11 h-11 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">M</div>
              <span className="text-2xl font-black tracking-tighter text-gray-900 font-display">MELCOM</span>
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500">
              <Link to="/catalog" className="hover:text-red-600 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-red-600 hover:after:w-full after:transition-all">Catalog</Link>
              <Link to="/catalog?category=Electronics" className="hover:text-red-600 transition-colors">Electronics</Link>
              <Link to="/catalog?category=Groceries" className="hover:text-red-600 transition-colors">Groceries</Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center bg-gray-100/80 rounded-2xl px-5 py-2.5 gap-3 border border-transparent focus-within:border-red-600/20 focus-within:bg-white transition-all">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (window.location.pathname !== "/catalog" && e.target.value.length > 0) {
                    navigate("/catalog");
                  }
                }}
                className="bg-transparent border-none focus:ring-0 text-sm w-48 font-medium"
              />
            </div>
            <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-red-600 transition-colors">
              <Heart size={24} />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-red-600 transition-colors">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-gray-900">{user.displayName || user.email}</p>
                  <button onClick={onLogout} className="text-[10px] text-red-600 font-bold uppercase hover:underline">Sign Out</button>
                </div>
                {user.photoURL && <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200" />}
              </div>
            ) : (
              <button 
                onClick={onLogin}
                className="hidden md:flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
              >
                <LogIn size={18} /> Sign In
              </button>
            )}

            <button className="p-2 text-gray-600 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <Link to="/catalog" className="block text-lg font-medium" onClick={() => setIsMenuOpen(false)}>Catalog</Link>
              <div className="pt-4 border-t border-gray-100">
                {user ? (
                  <button onClick={onLogout} className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold">Sign Out</button>
                ) : (
                  <button onClick={onLogin} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold">Sign In</button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Pages ---

const HomePage = ({ recommendations, addToCart, wishlist, toggleWishlist }: { 
  recommendations: Product[], 
  addToCart: (p: Product, variations?: Record<string, string>) => void,
  wishlist: Product[],
  toggleWishlist: (p: Product) => void
}) => {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] bg-gray-900 overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <img 
            src="https://picsum.photos/seed/melcom-hero/1920/1080" 
            alt="Hero" 
            className="w-full h-full object-cover opacity-50 scale-105 animate-pulse-slow"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/20 text-red-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em]">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
              New Season 2026
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] font-display tracking-tight">
              RETAIL <br /> 
              <span className="text-red-600">REDEFINED.</span>
            </h1>
            <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-lg">
              Experience Ghana's premier retail destination, now reimagined for the digital age. Quality, speed, and reliability in every click.
            </p>
            <div className="flex flex-wrap gap-5 pt-4">
              <Link to="/catalog" className="bg-red-600 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-600/20 uppercase tracking-wider text-sm">
                Explore Catalog <ArrowRight size={20} />
              </Link>
              <button className="glass text-white px-10 py-5 rounded-2xl font-black hover:bg-white/10 transition-all uppercase tracking-wider text-sm">
                Our Story
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-end gap-4">
          <div className="w-px h-24 bg-gradient-to-b from-transparent to-red-600" />
          <span className="text-white font-black text-xs uppercase tracking-[0.3em] vertical-text">Scroll to explore</span>
        </div>
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black text-gray-900 font-display tracking-tight">Curated for You</h2>
              <p className="text-gray-500 font-medium mt-2">Personalized selections based on your shopping behavior</p>
            </div>
            <div className="flex gap-2">
              <button className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"><ChevronRight size={20} className="rotate-180" /></button>
              <button className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"><ChevronRight size={20} /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendations.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                addToCart={addToCart} 
                isWishlisted={wishlist.some(item => item.id === product.id)}
                toggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        </section>
      )}

      {/* Categories Bento Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-gray-900 font-display tracking-tight">Shop by Department</h2>
          <p className="text-gray-500 font-medium mt-2">Explore our wide range of premium products</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-[600px]">
          <Link 
            to="/catalog?category=Electronics"
            className="md:col-span-2 md:row-span-2 group relative rounded-3xl overflow-hidden bg-gray-100"
          >
            <img 
              src="https://picsum.photos/seed/electronics/800/800" 
              alt="Electronics" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-10">
              <span className="text-red-500 font-black text-xs uppercase tracking-widest mb-2">Premium Tech</span>
              <h3 className="text-4xl font-black text-white font-display">Electronics</h3>
              <p className="text-gray-300 mt-2 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity">Latest gadgets and high-performance devices for your modern lifestyle.</p>
            </div>
          </Link>
          <Link 
            to="/catalog?category=Groceries"
            className="md:col-span-2 group relative rounded-3xl overflow-hidden bg-gray-100"
          >
            <img 
              src="https://picsum.photos/seed/groceries/800/400" 
              alt="Groceries" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-3xl font-black text-white font-display">Supermarket</h3>
            </div>
          </Link>
          <Link 
            to="/catalog?category=Furniture"
            className="group relative rounded-3xl overflow-hidden bg-gray-100"
          >
            <img 
              src="https://picsum.photos/seed/furniture/400/400" 
              alt="Furniture" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h3 className="text-xl font-black text-white font-display">Furniture</h3>
            </div>
          </Link>
          <Link 
            to="/catalog?category=Fashion"
            className="group relative rounded-3xl overflow-hidden bg-gray-100"
          >
            <img 
              src="https://picsum.photos/seed/fashion/400/400" 
              alt="Fashion" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h3 className="text-xl font-black text-white font-display">Fashion</h3>
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
              <Truck size={24} />
            </div>
            <h3 className="text-xl font-bold">Rapid Delivery</h3>
            <p className="text-gray-500">Leveraging our 40+ stores as fulfillment nodes for same-day delivery in major cities.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-bold">Localized Payments</h3>
            <p className="text-gray-500">Seamlessly pay with MTN MoMo, Telecel Cash, or ATMoney alongside Visa/Mastercard.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold">Loyalty Rewards</h3>
            <p className="text-gray-500">Earn points on every purchase and redeem them for discounts on your next shopping trip.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductCard: React.FC<{ 
  product: Product, 
  addToCart: (p: Product, variations?: Record<string, string>) => void,
  trackView?: (id: string) => void,
  isWishlisted?: boolean,
  toggleWishlist?: (p: Product) => void
}> = ({ product, addToCart, trackView, isWishlisted, toggleWishlist }) => {
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product.variations) {
      const initial: Record<string, string> = {};
      product.variations.forEach(v => {
        initial[v.name] = v.options[0];
      });
      setSelectedVariations(initial);
    }
  }, [product]);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onViewportEnter={() => trackView?.(product.id)}
      className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 group flex flex-col h-full"
    >
      <div className="h-72 overflow-hidden relative shrink-0">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-5 left-5">
          <button 
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist?.(product);
            }}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-lg",
              isWishlisted 
                ? "bg-red-600 text-white shadow-red-600/20" 
                : "bg-white/80 backdrop-blur-md text-gray-900 hover:bg-white"
            )}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="absolute top-5 right-5 glass px-4 py-1.5 rounded-full text-[10px] font-black text-gray-900 uppercase tracking-widest">
          {product.category}
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute bottom-5 left-5 bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
            Limited: {product.stock} left
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-xs">Sold Out</span>
          </div>
        )}
      </div>
      <div className="p-8 flex-1 flex flex-col space-y-6">
        <div className="flex-1 space-y-2">
          <h3 className="font-black text-xl line-clamp-1 font-display tracking-tight group-hover:text-red-600 transition-colors">{product.name}</h3>
          <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed">{product.description}</p>
          
          {product.variations && (
            <div className="space-y-4 pt-4">
              {product.variations.map(v => (
                <div key={v.name} className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{v.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSelectedVariations(prev => ({ ...prev, [v.name]: opt }))}
                        className={cn(
                          "px-4 py-1.5 text-[10px] rounded-xl border-2 transition-all font-black uppercase tracking-wider",
                          selectedVariations[v.name] === opt 
                            ? "bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-900/20" 
                            : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-gray-900 font-display">GH₵ {product.price.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Premium Quality</span>
          </div>
          <button 
            onClick={() => addToCart(product, Object.keys(selectedVariations).length > 0 ? selectedVariations : undefined)}
            disabled={product.stock === 0}
            className="bg-red-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-red-700 hover:rotate-12 active:scale-90 transition-all disabled:opacity-50 disabled:bg-gray-200 shadow-xl shadow-red-600/20"
          >
            {product.stock === 0 ? <X size={24} /> : <ShoppingBag size={24} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const WishlistPage = ({ wishlist, toggleWishlist, addToCart }: { 
  wishlist: Product[], 
  toggleWishlist: (p: Product) => void,
  addToCart: (p: Product) => void 
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black font-display tracking-tight">My Wishlist</h1>
          <p className="text-gray-500 font-medium">Items you've saved for later. {wishlist.length} products total.</p>
        </div>
        <Link to="/catalog" className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors">
          Continue Shopping
        </Link>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishlist.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              addToCart={addToCart} 
              isWishlisted={true}
              toggleWishlist={toggleWishlist}
            />
          ))}
        </div>
      ) : (
        <div className="py-32 text-center space-y-8 bg-gray-50 rounded-[3rem]">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto text-red-600 shadow-xl">
            <Heart size={40} fill="currentColor" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black font-display">Your wishlist is empty</h2>
            <p className="text-gray-500 font-medium max-w-sm mx-auto">Start saving your favorite items to see them here later.</p>
          </div>
          <Link 
            to="/catalog"
            className="inline-block bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-colors shadow-xl shadow-red-600/20"
          >
            Explore Products
          </Link>
        </div>
      )}
    </div>
  );
};

const CatalogPage = ({ products, addToCart, trackView, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, wishlist, toggleWishlist }: { 
  products: Product[], 
  addToCart: (p: Product, variations?: Record<string, string>) => void,
  trackView: (id: string) => void,
  searchQuery: string,
  setSearchQuery: (q: string) => void,
  selectedCategory: string,
  setSelectedCategory: (c: string) => void,
  wishlist: Product[],
  toggleWishlist: (p: Product) => void
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-72 space-y-10">
          <div className="space-y-6">
            <h3 className="font-black text-xl font-display tracking-tight">Departments</h3>
            <div className="space-y-3">
              {['All', 'Furniture', 'Electronics & Appliances', 'Mobiles & Computers', 'Sports & Fitness', 'Supermarket', 'Toys & Entertainment'].map(c => (
                <button 
                  key={c} 
                  onClick={() => setSelectedCategory(c)}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-bold transition-all",
                    selectedCategory === c 
                      ? "bg-gray-900 text-white shadow-xl shadow-gray-900/20" 
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <span>{c}</span>
                  {selectedCategory === c && <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="font-black text-xl font-display tracking-tight">Price Range</h3>
            <div className="px-2">
              <input type="range" className="w-full accent-red-600 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer" min="0" max="20000" />
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">
                <span>GH₵ 0</span>
                <span>GH₵ 20,000+</span>
              </div>
            </div>
          </div>
          
          <div className="bg-red-600 p-8 rounded-[2rem] text-white space-y-4 relative overflow-hidden group">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <h4 className="text-2xl font-black font-display leading-tight">Melcom <br /> Rewards</h4>
            <p className="text-sm text-red-100 font-medium">Earn 5% back on every purchase with our new loyalty program.</p>
            <button className="bg-white text-red-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:scale-105 transition-transform">Join Now</button>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black font-display tracking-tight">
                {searchQuery ? `Results for "${searchQuery}"` : selectedCategory === 'All' ? 'All Products' : selectedCategory}
              </h1>
              <p className="text-sm text-gray-500 font-medium">{products.length} premium items curated for you</p>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex-1 md:w-80 relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search in catalog..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-600/20 focus:bg-white text-sm font-medium transition-all"
                />
              </div>
              <select className="bg-gray-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest py-3.5 px-6 focus:ring-2 focus:ring-red-600/20">
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  addToCart={addToCart} 
                  trackView={trackView} 
                  isWishlisted={wishlist.some(item => item.id === product.id)}
                  toggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center space-y-8 bg-gray-50 rounded-[3rem]">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto text-gray-300 shadow-xl">
                <Search size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black font-display">No matches found</h2>
                <p className="text-gray-500 font-medium max-w-sm mx-auto">We couldn't find any products matching your current search or filters.</p>
              </div>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const CartPage = ({ cart, updateQuantity, removeFromCart }: { 
  cart: CartItem[], 
  updateQuantity: (id: string, variations: Record<string, string> | undefined, q: number) => void,
  removeFromCart: (id: string, variations: Record<string, string> | undefined) => void
}) => {
  const navigate = useNavigate();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <ShoppingCart size={48} />
        </div>
        <h2 className="text-3xl font-black">Your cart is empty</h2>
        <p className="text-gray-500">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/catalog" className="inline-block bg-red-600 text-white px-8 py-4 rounded-xl font-bold">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex gap-6 bg-white p-6 rounded-2xl border border-gray-100">
              <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <button onClick={() => removeFromCart(item.id, item.selectedVariations)} className="text-gray-400 hover:text-red-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{item.category}</span>
                  {item.selectedVariations && Object.entries(item.selectedVariations).map(([name, value]) => (
                    <span key={name} className="text-xs font-bold bg-red-50 px-2 py-1 rounded text-red-600">
                      {name}: {value}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button 
                      onClick={() => updateQuantity(item.id, item.selectedVariations, item.quantity - 1)}
                      className="px-3 py-1 hover:bg-gray-50"
                    >-</button>
                    <span className="px-4 font-bold">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.selectedVariations, item.quantity + 1)}
                      className="px-3 py-1 hover:bg-gray-50"
                    >+</button>
                  </div>
                  <span className="font-bold text-lg">GH₵ {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-8 rounded-2xl space-y-6">
            <h2 className="text-xl font-bold">Order Summary</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold">GH₵ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated Shipping</span>
                <span className="text-green-600 font-bold">FREE</span>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between text-lg font-black">
                <span>Total</span>
                <span className="text-red-600">GH₵ {subtotal.toLocaleString()}</span>
              </div>
            </div>
            <button 
              onClick={() => navigate("/checkout")}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Checkout
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
            <CreditCard size={16} />
            <span>Secure Checkout with Paystack & Hubtel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage = ({ cart, clearCart, user }: { cart: CartItem[], clearCart: () => void, user: any }) => {
  const navigate = useNavigate();
  const [taxInfo, setTaxInfo] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("MoMo");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({
    fullName: user?.user_metadata?.full_name || "Kofi Annan",
    phone: "0244123456",
    address: "123 Independence Ave, Accra",
    city: "Accra"
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    fetch("/api/finance/calculate-tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseAmount: subtotal })
    })
    .then(res => res.json())
    .then(data => setTaxInfo(data));
  }, [subtotal]);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(r => setTimeout(r, 2000));

      const orderId = `ORD-${Date.now()}`;
      const orderData: Order = {
        id: orderId,
        customerId: user?.uid || "anonymous",
        items: cart,
        totalAmount: taxInfo.totalAmount,
        taxAmount: taxInfo.taxes.totalTax,
        paymentMethod,
        status: "Paid",
        createdAt: new Date().toISOString()
      };

      // Save order to Firestore
      await setDoc(doc(db, "orders", orderId), orderData);

      // Update customer loyalty points and last purchase if logged in
      if (user) {
        const customerRef = doc(db, "customers", user.uid);
        const customerSnap = await getDoc(customerRef);
        const currentPoints = customerSnap.exists() ? (customerSnap.data().loyaltyPoints || 0) : 0;
        
        await setDoc(customerRef, {
          loyaltyPoints: currentPoints + Math.floor(taxInfo.totalAmount / 10),
          lastPurchase: new Date().toISOString(),
          phone: shippingDetails.phone,
          address: `${shippingDetails.address}, ${shippingDetails.city}`
        }, { merge: true });
      }

      // Update stock levels using a transaction for atomicity
      await runTransaction(db, async (transaction) => {
        for (const item of cart) {
          const productRef = doc(db, "products", item.id);
          const productSnap = await transaction.get(productRef);
          
          if (!productSnap.exists()) {
            throw new Error(`Product ${item.id} does not exist!`);
          }

          const currentStock = productSnap.data().stock;
          if (currentStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }

          transaction.update(productRef, {
            stock: currentStock - item.quantity
          });
        }
      });

      setOrderComplete(true);
      clearCart();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "orders");
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h2 className="text-3xl font-black">Order Confirmed!</h2>
        <p className="text-gray-500">Thank you for shopping with Melcom. Your order is being processed and will be delivered shortly.</p>
        <div className="bg-gray-50 p-6 rounded-2xl text-left space-y-2">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Order Reference</p>
          <p className="text-xl font-mono font-bold">#MLC-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
        </div>
        <Link to="/" className="inline-block bg-gray-900 text-white px-8 py-4 rounded-xl font-bold">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                  step >= s ? "bg-red-600 text-white" : "bg-gray-200 text-gray-500"
                )}>{s}</div>
                <span className={cn("text-sm font-bold", step >= s ? "text-gray-900" : "text-gray-400")}>
                  {s === 1 ? "Shipping" : s === 2 ? "Payment" : "Review"}
                </span>
                {s < 3 && <div className="w-8 h-px bg-gray-200" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h2 className="text-2xl font-black">Shipping Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full border-gray-200 rounded-xl p-3" 
                    value={shippingDetails.fullName}
                    onChange={(e) => setShippingDetails({...shippingDetails, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Phone Number</label>
                  <input 
                    type="text" 
                    className="w-full border-gray-200 rounded-xl p-3" 
                    value={shippingDetails.phone}
                    onChange={(e) => setShippingDetails({...shippingDetails, phone: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-600">Address</label>
                  <textarea 
                    className="w-full border-gray-200 rounded-xl p-3" 
                    rows={3} 
                    value={shippingDetails.address}
                    onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">City</label>
                  <select 
                    className="w-full border-gray-200 rounded-xl p-3"
                    value={shippingDetails.city}
                    onChange={(e) => setShippingDetails({...shippingDetails, city: e.target.value})}
                  >
                    <option>Accra</option>
                    <option>Kumasi</option>
                    <option>Takoradi</option>
                  </select>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold">
                Continue to Payment
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h2 className="text-2xl font-black">Payment Method</h2>
              <div className="grid grid-cols-2 gap-4">
                {['MoMo', 'Card', 'Cash on Delivery'].map(method => (
                  <button 
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "p-6 rounded-2xl border-2 text-left transition-all",
                      paymentMethod === method ? "border-red-600 bg-red-50" : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{method}</span>
                      {paymentMethod === method && <CheckCircle2 className="text-red-600" size={20} />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {method === 'MoMo' ? 'MTN, Telecel, AT' : method === 'Card' ? 'Visa, Mastercard' : 'Pay when you receive'}
                    </p>
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="border border-gray-200 px-8 py-4 rounded-xl font-bold">Back</button>
                <button onClick={() => setStep(3)} className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold">Review Order</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h2 className="text-2xl font-black">Review & Confirm</h2>
              <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping to:</span>
                  <span className="font-bold">{shippingDetails.fullName}, {shippingDetails.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment via:</span>
                  <span className="font-bold">{paymentMethod}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="border border-gray-200 px-8 py-4 rounded-xl font-bold">Back</button>
                <button 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="flex-1 bg-red-600 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : `Pay GH₵ ${taxInfo?.totalAmount.toLocaleString()}`}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="bg-white border border-gray-100 p-8 rounded-2xl space-y-6 sticky top-24">
            <h2 className="text-xl font-bold">Order Summary</h2>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-bold line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} x GH₵ {item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            {taxInfo && (
              <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>GH₵ {taxInfo.baseAmount.toLocaleString()}</span>
                </div>
                <div className="space-y-1 pl-4 border-l-2 border-gray-100">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>VAT (15%)</span>
                    <span>GH₵ {taxInfo.taxes.vat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>NHIL (2.5%)</span>
                    <span>GH₵ {taxInfo.taxes.nhil.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>GETFund (2.5%)</span>
                    <span>GH₵ {taxInfo.taxes.getFund.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>COVID Levy (1%)</span>
                    <span>GH₵ {taxInfo.taxes.covidLevy.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total Tax</span>
                  <span>GH₵ {taxInfo.taxes.totalTax.toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between text-xl font-black text-red-600">
                  <span>Total</span>
                  <span>GH₵ {taxInfo.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [wishlist, setWishlist] = useState<Product[]>([]);

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        syncUserToCRM(u);
        syncUserToUsersCollection(u);
      }
    });

    return () => unsubscribe();
  }, []);

  const syncUserToUsersCollection = async (u: any) => {
    try {
      const userRef = doc(db, 'users', u.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          role: u.email === "dm570692@gmail.com" ? "admin" : "customer",
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error syncing to users collection:", error);
    }
  };

  const syncUserToCRM = async (u: any) => {
    const customerData: Customer = {
      id: u.uid,
      email: u.email || "",
      firstName: u.displayName?.split(' ')[0] || "User",
      lastName: u.displayName?.split(' ')[1] || "",
      phone: u.phoneNumber || "N/A",
      loyaltyPoints: 0,
    };

    try {
      const customerDoc = doc(db, 'customers', u.uid);
      const docSnap = await getDoc(customerDoc);
      
      if (!docSnap.exists()) {
        await setDoc(customerDoc, customerData);
      } else {
        // Update existing customer info if needed
        await setDoc(customerDoc, {
          email: u.email || docSnap.data().email,
          firstName: u.displayName?.split(' ')[0] || docSnap.data().firstName,
          lastName: u.displayName?.split(' ')[1] || docSnap.data().lastName,
        }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `customers/${u.uid}`);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Seeding initial products if none exist
  useEffect(() => {
    const seedProducts = async () => {
      const q = query(collection(db, "products"));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        const initialProducts = [
          { id: "1", sku: "ELC-001", name: "Samsung 55\" QLED TV", description: "Crystal UHD 4K Smart TV with HDR.", price: 4500, stock: 15, category: "Electronics", image: "https://picsum.photos/seed/tv/400/300" },
          { id: "2", sku: "APP-002", name: "LG Double Door Fridge", description: "Inverter Linear Compressor with Door-in-Door.", price: 8200, stock: 8, category: "Home Appliances", image: "https://picsum.photos/seed/fridge/400/300" },
          { id: "3", sku: "GRO-003", name: "Melcom Choice Jasmine Rice 5kg", description: "Premium long grain jasmine rice.", price: 120, stock: 500, category: "Groceries", image: "https://picsum.photos/seed/rice/400/300" },
          { id: "4", sku: "FAS-004", name: "Men's Casual Cotton Shirt", description: "Breathable cotton shirt for everyday wear.", price: 85, stock: 45, category: "Fashion", image: "https://picsum.photos/seed/shirt/400/300" },
          { id: "5", sku: "ELC-005", name: "Apple iPhone 15 Pro", description: "Titanium design, A17 Pro chip.", price: 12500, stock: 12, category: "Electronics", image: "https://picsum.photos/seed/phone/400/300" },
          { id: "6", sku: "APP-006", name: "Panasonic Microwave Oven", description: "25L Solo Microwave with 800W power.", price: 950, stock: 20, category: "Home Appliances", image: "https://picsum.photos/seed/microwave/400/300" },
        ];

        for (const p of initialProducts) {
          await setDoc(doc(db, "products", p.id), p);
        }
        console.log("Products seeded successfully");
      }
    };

    if (isAuthReady) {
      const isAdmin = user?.email === "dm570692@gmail.com";
      if (isAdmin) {
        seedProducts();
      }
    }
  }, [isAuthReady, user]);

  // Real-time Inventory Sync via Firestore
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products");
    });

    return () => unsubscribe();
  }, []);

  // Fetch Recommendations (Simplified for now, can be enhanced with interaction tracking)
  useEffect(() => {
    if (products.length > 0) {
      setRecommendations(products.slice(0, 4));
    }
  }, [products]);

  const trackInteraction = async (productId: string, type: 'view' | 'cart') => {
    if (!user) return;
    const interactionId = `${user.uid}_${productId}_${Date.now()}`;
    try {
      await setDoc(doc(db, "interactions", interactionId), {
        userId: user.uid,
        productId,
        type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Silent fail for interactions
    }
  };

  const addToCart = (product: Product, selectedVariations?: Record<string, string>) => {
    trackInteraction(product.id, 'cart');
    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && 
        JSON.stringify(item.selectedVariations) === JSON.stringify(selectedVariations)
      );
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && JSON.stringify(item.selectedVariations) === JSON.stringify(selectedVariations))
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedVariations }];
    });
  };

  const updateQuantity = (id: string, variations: Record<string, string> | undefined, q: number) => {
    if (q < 1) return;
    setCart(prev => prev.map(item => 
      (item.id === id && JSON.stringify(item.selectedVariations) === JSON.stringify(variations))
        ? { ...item, quantity: q } 
        : item
    ));
  };

  const removeFromCart = (id: string, variations: Record<string, string> | undefined) => {
    setCart(prev => prev.filter(item => 
      !(item.id === id && JSON.stringify(item.selectedVariations) === JSON.stringify(variations))
    ));
  };

  const clearCart = () => setCart([]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Router>
      <div className="min-h-screen bg-white font-sans text-gray-900">
        <Navbar 
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
          wishlistCount={wishlist.length}
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        <main>
          <Routes>
            <Route path="/" element={
              <HomePage 
                recommendations={recommendations} 
                addToCart={addToCart} 
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
              />
            } />
            <Route path="/catalog" element={
              <CatalogPage 
                products={filteredProducts} 
                addToCart={addToCart} 
                trackView={(id) => trackInteraction(id, 'view')} 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
              />
            } />
            <Route path="/wishlist" element={
              <WishlistPage 
                wishlist={wishlist} 
                toggleWishlist={toggleWishlist} 
                addToCart={addToCart} 
              />
            } />
            <Route path="/cart" element={<CartPage cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />
            <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={clearCart} user={user} />} />
          </Routes>
        </main>

        <footer className="bg-gray-900 text-white pt-32 pb-12 mt-32 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-20 relative z-10">
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-red-600/20">M</div>
                <span className="text-3xl font-black tracking-tighter font-display">MELCOM</span>
              </div>
              <p className="text-gray-400 text-sm font-medium leading-relaxed">
                Ghana's premier retail chain, bridging physical operations with a seamless digital marketplace. Quality you can trust, delivered to your door.
              </p>
              <div className="flex gap-4">
                {['fb', 'tw', 'ig', 'li'].map(s => (
                  <div key={s} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                    <span className="text-[10px] font-black uppercase">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-black font-display mb-8">Shop</h4>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li><Link to="/catalog" className="hover:text-red-600 transition-colors">Electronics</Link></li>
                <li><Link to="/catalog" className="hover:text-red-600 transition-colors">Home Appliances</Link></li>
                <li><Link to="/catalog" className="hover:text-red-600 transition-colors">Groceries</Link></li>
                <li><Link to="/catalog" className="hover:text-red-600 transition-colors">Fashion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-black font-display mb-8">Company</h4>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li><a href="#" className="hover:text-red-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-red-600 transition-colors">Store Locator</a></li>
                <li><a href="#" className="hover:text-red-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-red-600 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div className="space-y-8">
              <h4 className="text-lg font-black font-display mb-8">Newsletter</h4>
              <p className="text-sm text-gray-400 font-medium">Get the latest offers and updates delivered to your inbox.</p>
              <div className="flex flex-col gap-3">
                <input type="email" placeholder="Email address" className="bg-white/5 border-none rounded-2xl px-6 py-4 w-full text-sm font-medium focus:ring-2 focus:ring-red-600/50 transition-all" />
                <button className="bg-red-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-colors shadow-xl shadow-red-600/20">Subscribe</button>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 pt-20 border-t border-white/5 mt-20 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            <p>© 2026 Melcom Ghana. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
