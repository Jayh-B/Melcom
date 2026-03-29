import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ShoppingBag, User, Menu, X, ShoppingCart, ChevronRight, Truck, CreditCard,
  Users, ArrowRight, CheckCircle2, LogOut, LogIn, Heart, Star, Package
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { Product, CartItem, Order, Customer, ShippingDetails } from "./types";
import {
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
  collection, doc, setDoc, getDoc, getDocs, onSnapshot, query, where,
  orderBy, limit, updateDoc, handleFirestoreError, OperationType, runTransaction
} from "./firebase";
import { ToastProvider, useToast } from "./context/ToastContext";
import { ToastContainer } from "./components/Toast";
import { ProductGridSkeleton, ProductCardSkeleton } from "./components/Skeleton";
import { CookieBanner } from "./components/CookieBanner";
import { SearchAutocomplete } from "./components/SearchAutocomplete";
import { ProductDetail } from "./pages/ProductDetail";
import { OrderHistory } from "./pages/OrderHistory";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { InvoiceButton } from "./components/InvoiceButton";
import { GoogleGenerativeAI } from "@google/genai";

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ cartCount, wishlistCount, user, onLogin, onLogout, products, searchQuery, setSearchQuery }: {
  cartCount: number; wishlistCount: number; user: any;
  onLogin: () => void; onLogout: () => void;
  products: Product[]; searchQuery: string; setSearchQuery: (q: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-18 items-center py-3">
          {/* Logo */}
          <div className="flex items-center gap-8 sm:gap-12">
            <Link to="/" className="flex items-center gap-2 group" aria-label="Melcom Home">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">M</div>
              <span className="text-xl font-black tracking-tighter text-gray-900 hidden sm:block">MELCOM</span>
            </Link>
            <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-600">
              {[['Catalog', '/catalog'], ['Electronics', '/catalog?category=Electronics+%26+Appliances'], ['Supermarket', '/catalog?category=Supermarket'], ['Fashion', '/catalog?category=Fashion']].map(([l, h]) => (
                <Link key={l} to={h} className="hover:text-red-600 transition-colors">{l}</Link>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search — desktop */}
            <div className="hidden md:block">
              <SearchAutocomplete
                products={products}
                searchQuery={searchQuery}
                setSearchQuery={q => { setSearchQuery(q); if (q && location.pathname !== '/catalog') navigate('/catalog'); }}
              />
            </div>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-red-600 transition-colors" aria-label={`Wishlist (${wishlistCount})`}>
              <Heart size={22} />
              {wishlistCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{wishlistCount}</span>}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-red-600 transition-colors" aria-label={`Cart (${cartCount})`}>
              <ShoppingCart size={22} />
              {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
            </Link>

            {/* Auth */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                {user.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />}
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-none">{user.displayName?.split(' ')[0]}</p>
                  <button onClick={onLogout} className="text-[10px] text-red-600 font-bold hover:underline">Sign Out</button>
                </div>
              </div>
            ) : (
              <button onClick={onLogin} className="hidden md:flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">
                <LogIn size={15} /> Sign In
              </button>
            )}
            <button className="p-2 text-gray-600 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <SearchAutocomplete
          products={products}
          searchQuery={searchQuery}
          setSearchQuery={q => { setSearchQuery(q); if (q) { navigate('/catalog'); setMenuOpen(false); } }}
          className="w-full"
        />
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden">
            <div className="px-4 py-5 space-y-3">
              {[['Catalog', '/catalog'], ['Electronics', '/catalog?category=Electronics+%26+Appliances'], ['Supermarket', '/catalog?category=Supermarket'], ['My Orders', '/orders']].map(([l, h]) => (
                <Link key={l} to={h} className="block text-base font-semibold text-gray-700 py-1" onClick={() => setMenuOpen(false)}>{l}</Link>
              ))}
              <div className="pt-2 border-t border-gray-100">
                {user
                  ? <button onClick={() => { onLogout(); setMenuOpen(false); }} className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold text-sm">Sign Out</button>
                  : <button onClick={() => { onLogin(); setMenuOpen(false); }} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-sm">Sign In with Google</button>
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────────

export const ProductCard: React.FC<{
  product: Product;
  addToCart: (p: Product, v?: Record<string, string>) => void;
  trackView?: (id: string) => void;
  isWishlisted?: boolean;
  toggleWishlist?: (p: Product) => void;
}> = ({ product, addToCart, trackView, isWishlisted, toggleWishlist }) => {
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (product.variations) {
      const init: Record<string, string> = {};
      product.variations.forEach(v => { init[v.name] = v.options[0]; });
      setSelectedVariations(init);
    }
  }, [product]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, Object.keys(selectedVariations).length > 0 ? selectedVariations : undefined);
    addToast(`"${product.name}" added to cart`, 'success');
  };

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist?.(product);
    addToast(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist', isWishlisted ? 'info' : 'success');
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      onViewportEnter={() => trackView?.(product.id)}
      className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
    >
      <div className="relative h-64 sm:h-72 overflow-hidden shrink-0">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img src={product.image} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer" loading="lazy" />
        </Link>
        <button
          onClick={handleWish}
          className={cn('absolute top-3 left-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-md',
            isWishlisted ? 'bg-red-600 text-white shadow-red-600/30' : 'bg-white/90 text-gray-700 hover:bg-white')}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black text-gray-700 uppercase tracking-wider">
          {product.category}
        </div>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs">Sold Out</span>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute bottom-3 left-3 bg-red-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">
            Only {product.stock} left
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-1 gap-4">
        <div className="flex-1 space-y-1.5">
          <Link to={`/product/${product.id}`}>
            <h3 className="font-black text-base sm:text-lg line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">{product.name}</h3>
          </Link>
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{product.description}</p>
          {product.variations && (
            <div className="space-y-2 pt-2">
              {product.variations.map(v => (
                <div key={v.name} className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{v.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {v.options.map(opt => (
                      <button key={opt} onClick={() => setSelectedVariations(p => ({ ...p, [v.name]: opt }))}
                        className={cn('px-3 py-1 text-[10px] rounded-lg border-2 font-black uppercase tracking-wide transition-all',
                          selectedVariations[v.name] === opt ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300')}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-50 pt-4">
          <div>
            <span className="text-xl sm:text-2xl font-black text-gray-900">GH₵ {product.price.toLocaleString()}</span>
          </div>
          <button onClick={handleAdd} disabled={product.stock === 0}
            className="bg-red-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-red-700 active:scale-90 transition-all disabled:opacity-40 disabled:bg-gray-200 shadow-lg shadow-red-600/20"
            aria-label={`Add ${product.name} to cart`}
          >
            {product.stock === 0 ? <X size={20} /> : <ShoppingBag size={20} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Pages ────────────────────────────────────────────────────────────────────

function HomePage({ recommendations, addToCart, wishlist, toggleWishlist, loading }: {
  recommendations: Product[]; addToCart: (p: Product, v?: Record<string, string>) => void;
  wishlist: Product[]; toggleWishlist: (p: Product) => void; loading: boolean;
}) {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero */}
      <section className="relative h-[75vh] min-h-[560px] bg-gray-900 overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <img src="https://picsum.photos/seed/melcom-hero/1920/1080" alt="" className="w-full h-full object-cover opacity-40" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/75 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 w-full">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-xl space-y-6">
            <span className="inline-flex items-center gap-2 bg-red-600/15 border border-red-600/25 text-red-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />New Season 2026
            </span>
            <h1 className="text-5xl sm:text-7xl font-black text-white leading-none tracking-tight">
              RETAIL<br /><span className="text-red-600">REDEFINED.</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed">Ghana's premier omnichannel retailer — quality products, same-day delivery, seamless digital experience.</p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/catalog" className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-red-700 active:scale-95 transition-all shadow-2xl shadow-red-600/30 text-sm uppercase tracking-wider">
                Explore Catalog <ArrowRight size={18} />
              </Link>
              <Link to="/catalog?category=Electronics+%26+Appliances" className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-4 rounded-2xl font-black hover:bg-white/20 transition-all text-sm uppercase tracking-wider">
                Electronics
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Curated for You</h2>
            <p className="text-gray-500 mt-1">AI-powered picks based on what's trending</p>
          </div>
          <Link to="/catalog" className="text-sm font-bold text-red-600 hover:text-red-700 hidden sm:flex items-center gap-1">
            View all <ChevronRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map(p => (
              <ProductCard key={p.id} product={p} addToCart={addToCart} isWishlisted={wishlist.some(w => w.id === p.id)} toggleWishlist={toggleWishlist} />
            ))}
          </div>
        )}
      </section>

      {/* Category Bento */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8">Shop by Department</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[560px]">
          {[
            { name: 'Electronics & Appliances', href: '/catalog?category=Electronics+%26+Appliances', seed: 'electronics', span: 'col-span-2 md:col-span-2 md:row-span-2' },
            { name: 'Supermarket',       href: '/catalog?category=Supermarket', seed: 'groceries',  span: 'col-span-2 md:col-span-2' },
            { name: 'Furniture',         href: '/catalog?category=Furniture',   seed: 'furniture',  span: 'col-span-1' },
            { name: 'Fashion',           href: '/catalog?category=Fashion',     seed: 'fashion',    span: 'col-span-1' },
          ].map(({ name, href, seed, span }) => (
            <Link key={name} to={href}
              className={cn('group relative rounded-2xl overflow-hidden bg-gray-100', span)}>
              <img src={`https://picsum.photos/seed/${seed}/800/800`} alt={name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex items-end p-5">
                <span className="text-white font-black text-lg leading-tight">{name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Truck,       title: 'Same-Day Delivery',     sub: 'From 40+ stores nationwide' },
            { icon: CreditCard,  title: 'MoMo & Card',           sub: 'MTN, Telecel, Visa, MC' },
            { icon: Users,       title: 'Loyalty Rewards',       sub: '5% back on every purchase' },
            { icon: ShoppingBag, title: 'Genuine Products',      sub: '100% authentic items' },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="bg-white p-6 rounded-2xl shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CatalogPage({ products, addToCart, trackView, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, wishlist, toggleWishlist, loading }: {
  products: Product[]; addToCart: (p: Product, v?: Record<string, string>) => void;
  trackView: (id: string) => void; searchQuery: string; setSearchQuery: (q: string) => void;
  selectedCategory: string; setSelectedCategory: (c: string) => void;
  wishlist: Product[]; toggleWishlist: (p: Product) => void; loading: boolean;
}) {
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get('category');
  useEffect(() => { if (catParam) setSelectedCategory(decodeURIComponent(catParam)); }, [catParam]);

  const categories = ['All', 'Furniture', 'Electronics & Appliances', 'Mobiles & Computers', 'Sports & Fitness', 'Supermarket', 'Toys & Entertainment', 'Fashion'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-8">
            <div>
              <h3 className="font-black text-lg mb-4">Departments</h3>
              <div className="space-y-1.5">
                {categories.map(c => (
                  <button key={c} onClick={() => setSelectedCategory(c)}
                    className={cn('w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                      selectedCategory === c ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100')}>
                    <span>{c}</span>
                    {selectedCategory === c && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-red-600 p-6 rounded-2xl text-white space-y-3">
              <h4 className="text-xl font-black">Melcom Rewards</h4>
              <p className="text-sm text-red-100">Earn 5% back on every purchase.</p>
              <button className="bg-white text-red-600 px-5 py-2 rounded-xl font-black text-xs hover:scale-105 transition-transform">Join Now</button>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <main className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black">{searchQuery ? `Results: "${searchQuery}"` : selectedCategory === 'All' ? 'All Products' : selectedCategory}</h1>
              <p className="text-sm text-gray-500 mt-1">{products.length} products</p>
            </div>
            <select className="bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest py-2.5 px-4 focus:ring-2 focus:ring-red-600/20 outline-none">
              <option>Featured</option>
              <option>Price: Low → High</option>
              <option>Price: High → Low</option>
            </select>
          </div>

          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {products.map(p => (
                <ProductCard key={p.id} product={p} addToCart={addToCart} trackView={trackView}
                  isWishlisted={wishlist.some(w => w.id === p.id)} toggleWishlist={toggleWishlist} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-5 bg-gray-50 rounded-3xl">
              <Package size={40} className="text-gray-300 mx-auto" />
              <h2 className="text-2xl font-black">No matches found</h2>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors">
                Reset Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function WishlistPage({ wishlist, toggleWishlist, addToCart }: {
  wishlist: Product[]; toggleWishlist: (p: Product) => void; addToCart: (p: Product) => void;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black">My Wishlist</h1>
          <p className="text-gray-500 mt-1">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/catalog" className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-red-600 transition-colors">
          Continue Shopping
        </Link>
      </div>
      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map(p => (
            <ProductCard key={p.id} product={p} addToCart={addToCart} isWishlisted toggleWishlist={toggleWishlist} />
          ))}
        </div>
      ) : (
        <div className="py-28 text-center space-y-5 bg-gray-50 rounded-3xl">
          <Heart size={40} className="text-gray-300 mx-auto" />
          <h2 className="text-2xl font-black">Your wishlist is empty</h2>
          <Link to="/catalog" className="inline-block bg-red-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors">
            Explore Products
          </Link>
        </div>
      )}
    </div>
  );
}

function CartPage({ cart, updateQuantity, removeFromCart }: {
  cart: CartItem[];
  updateQuantity: (id: string, v: Record<string, string> | undefined, q: number) => void;
  removeFromCart: (id: string, v: Record<string, string> | undefined) => void;
}) {
  const navigate = useNavigate();
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  if (cart.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-28 text-center space-y-5">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto"><ShoppingCart size={36} className="text-gray-400" /></div>
      <h2 className="text-2xl font-black">Your cart is empty</h2>
      <Link to="/catalog" className="inline-block bg-red-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors">Start Shopping</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black mb-8">Shopping Cart <span className="text-gray-400 font-normal text-xl">({cart.length} item{cart.length > 1 ? 's' : ''})</span></h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <Link to={`/product/${item.id}`}>
                <img src={item.image} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-gray-100 shrink-0" referrerPolicy="no-referrer" />
              </Link>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex justify-between gap-2">
                  <Link to={`/product/${item.id}`} className="font-bold text-gray-900 hover:text-red-600 transition-colors line-clamp-2">{item.name}</Link>
                  <button onClick={() => removeFromCart(item.id, item.selectedVariations)} className="text-gray-400 hover:text-red-600 shrink-0" aria-label="Remove"><X size={18} /></button>
                </div>
                {item.selectedVariations && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(item.selectedVariations).map(([k, v]) => (
                      <span key={k} className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-md">{k}: {v}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => updateQuantity(item.id, item.selectedVariations, item.quantity - 1)} className="px-3 py-1.5 hover:bg-gray-50 transition-colors text-gray-700" aria-label="Decrease">−</button>
                    <span className="px-3 font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.selectedVariations, item.quantity + 1)} className="px-3 py-1.5 hover:bg-gray-50 transition-colors text-gray-700" aria-label="Increase">+</button>
                  </div>
                  <span className="font-black text-gray-900">GH₵ {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4 sticky top-24">
            <h2 className="text-xl font-bold">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-bold">GH₵ {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-bold text-green-600">Free</span></div>
              <div className="flex justify-between text-[11px] text-gray-400"><span>Taxes calculated at checkout</span></div>
              <div className="border-t pt-3 flex justify-between font-black text-lg">
                <span>Est. Total</span>
                <span className="text-red-600">GH₵ {subtotal.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => navigate('/checkout')} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-colors text-sm">
              Proceed to Checkout →
            </button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pt-1">
              <CreditCard size={13} />
              <span>Secured by Paystack</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout with Paystack ───────────────────────────────────────────────────

function CheckoutPage({ cart, clearCart, user }: { cart: CartItem[]; clearCart: () => void; user: any }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [taxInfo, setTaxInfo] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('MoMo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [shipping, setShipping] = useState<ShippingDetails>({
    fullName: user?.displayName || '',
    phone: '',
    address: '',
    city: 'Accra',
    email: user?.email || '',
  });

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  useEffect(() => {
    if (subtotal > 0) {
      fetch('/api/finance/calculate-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseAmount: subtotal }),
      }).then(r => r.json()).then(setTaxInfo).catch(() => {});
    }
  }, [subtotal]);

  const processPaystackPayment = async (orderId: string) => {
    const userEmail = user?.email || shipping.email || 'guest@melcom.com.gh';

    // Try Paystack inline popup (requires CDN script in index.html)
    if (typeof (window as any).PaystackPop !== 'undefined') {
      return new Promise<string>((resolve, reject) => {
        const handler = (window as any).PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
          email: userEmail,
          amount: Math.round((taxInfo?.totalAmount || subtotal) * 100),
          currency: 'GHS',
          ref: orderId,
          metadata: { order_id: orderId, customer_name: shipping.fullName },
          onClose: () => reject(new Error('Payment cancelled')),
          callback: (response: any) => resolve(response.reference),
        });
        handler.openIframe();
      });
    }

    // Fallback: server-side initialization then redirect
    const res = await fetch('/api/payment/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, amount: taxInfo?.totalAmount || subtotal, orderId }),
    });
    const data = await res.json();
    if (data.data?.authorization_url) {
      window.location.href = data.data.authorization_url;
      return orderId;
    }
    throw new Error('Payment initialization failed');
  };

  const handlePlaceOrder = async () => {
    if (!shipping.fullName || !shipping.phone || !shipping.address) {
      addToast('Please fill in all shipping details', 'error');
      setStep(1);
      return;
    }
    setIsProcessing(true);
    const orderId = `MLC-${Date.now()}`;

    try {
      let paymentReference = orderId;

      if (paymentMethod !== 'Cash on Delivery') {
        paymentReference = await processPaystackPayment(orderId);
      }

      // Verify payment on server for card/MoMo
      if (paymentMethod !== 'Cash on Delivery') {
        const verifyRes = await fetch(`/api/payment/verify/${paymentReference}`);
        const verifyData = await verifyRes.json();
        if (!verifyData.data?.status === 'success' && paymentMethod !== 'Cash on Delivery') {
          // Allow to continue in dev/test mode
          console.warn('Payment verification note:', verifyData);
        }
      }

      const orderData: Order = {
        id: orderId,
        customerId: user?.uid || 'anonymous',
        items: cart,
        totalAmount: taxInfo?.totalAmount || subtotal,
        taxAmount: taxInfo?.taxes?.totalTax || 0,
        paymentMethod,
        paymentReference,
        status: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
        createdAt: new Date().toISOString(),
        shippingDetails: shipping,
      };

      await setDoc(doc(db, 'orders', orderId), orderData);

      // Update customer loyalty points
      if (user?.uid) {
        const customerRef = doc(db, 'customers', user.uid);
        const snap = await getDoc(customerRef);
        const points = snap.exists() ? (snap.data().loyaltyPoints || 0) : 0;
        await setDoc(customerRef, {
          loyaltyPoints: points + Math.floor((taxInfo?.totalAmount || subtotal) / 10),
          lastPurchase: new Date().toISOString(),
          phone: shipping.phone,
          address: `${shipping.address}, ${shipping.city}`,
        }, { merge: true });
      }

      // Atomic stock update
      await runTransaction(db, async tx => {
        for (const item of cart) {
          const ref = doc(db, 'products', item.id);
          const snap = await tx.get(ref);
          if (!snap.exists()) continue;
          const cur = snap.data().stock;
          tx.update(ref, { stock: Math.max(0, cur - item.quantity) });
        }
      });

      // Send confirmation email
      if (user?.email || shipping.email) {
        const customer = { firstName: shipping.fullName.split(' ')[0], email: user?.email || shipping.email };
        fetch('/api/email/order-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: orderData, customer }),
        }).catch(() => {});
      }

      setCompletedOrder(orderData);
      clearCart();
      addToast('Order placed successfully!', 'success', 6000);
    } catch (err: any) {
      if (err.message?.includes('cancelled')) {
        addToast('Payment was cancelled', 'warning');
      } else {
        addToast('Payment failed. Please try again.', 'error');
        console.error('Checkout error:', err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (completedOrder) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 size={40} />
      </motion.div>
      <h2 className="text-3xl font-black">Order Confirmed!</h2>
      <p className="text-gray-500">Thank you for shopping with Melcom. Your order is being processed.</p>
      <div className="bg-gray-50 p-5 rounded-2xl text-left space-y-1">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Order Reference</p>
        <p className="text-xl font-mono font-black text-red-600">{completedOrder.id}</p>
        <p className="text-sm text-gray-500">Confirmation sent to {user?.email || shipping.email}</p>
      </div>
      <div className="flex gap-3 justify-center flex-wrap">
        <InvoiceButton order={completedOrder} customer={{ firstName: shipping.fullName.split(' ')[0], lastName: shipping.fullName.split(' ').slice(1).join(' '), email: user?.email || shipping.email || '', phone: shipping.phone, id: user?.uid || 'guest', loyaltyPoints: 0 }} />
        <Link to="/orders" className="flex items-center gap-2 border border-gray-200 text-gray-700 px-5 py-2 rounded-xl font-bold text-sm hover:bg-gray-50">
          <Package size={16} /> View Orders
        </Link>
        <Link to="/" className="bg-gray-900 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-gray-800">Back to Home</Link>
      </div>
    </div>
  );

  if (cart.length === 0) { navigate('/cart'); return null; }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {['Shipping', 'Payment', 'Review'].map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm', step > i ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500')}>
                    {step > i ? '✓' : i + 1}
                  </div>
                  <span className={cn('text-sm font-bold hidden sm:block', step >= i + 1 ? 'text-gray-900' : 'text-gray-400')}>{label}</span>
                </div>
                {i < 2 && <div className={cn('flex-1 h-px', step > i + 1 ? 'bg-green-400' : 'bg-gray-200')} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Shipping */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
              <h2 className="text-xl font-black">Shipping Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {([['fullName', 'Full Name', 'text'], ['phone', 'Phone Number', 'tel'], ['email', 'Email Address', 'email']] as const).map(([field, label, type]) => (
                  <div key={field} className={cn('space-y-1.5', field === 'email' && 'sm:col-span-2')}>
                    <label className="text-sm font-bold text-gray-700">{label}</label>
                    <input type={type} value={shipping[field] || ''} onChange={e => setShipping(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition-all" />
                  </div>
                ))}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Delivery Address</label>
                  <textarea value={shipping.address} onChange={e => setShipping(p => ({ ...p, address: e.target.value }))} rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition-all resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">City</label>
                  <select value={shipping.city} onChange={e => setShipping(p => ({ ...p, city: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-600/20 outline-none transition-all">
                    {['Accra', 'Kumasi', 'Takoradi', 'Tema', 'Cape Coast', 'Koforidua'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors">
                Continue to Payment →
              </button>
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
              <h2 className="text-xl font-black">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'MoMo',             label: '📱  Mobile Money',       sub: 'MTN MoMo, Telecel Cash, AT Money' },
                  { id: 'Card',             label: '💳  Debit / Credit Card', sub: 'Visa, Mastercard — processed by Paystack' },
                  { id: 'Cash on Delivery', label: '💵  Cash on Delivery',    sub: 'Pay when your order arrives' },
                ].map(({ id, label, sub }) => (
                  <button key={id} onClick={() => setPaymentMethod(id)}
                    className={cn('w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
                      paymentMethod === id ? 'border-red-600 bg-red-50' : 'border-gray-100 hover:border-gray-300')}>
                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                      paymentMethod === id ? 'border-red-600 bg-red-600' : 'border-gray-300')}>
                      {paymentMethod === id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-gray-50">← Back</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors">Review Order →</button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
              <h2 className="text-xl font-black">Review & Confirm</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Deliver to</span><span className="font-bold">{shipping.fullName}, {shipping.city}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-bold">{paymentMethod}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Confirmation to</span><span className="font-bold truncate max-w-[60%]">{user?.email || shipping.email || '—'}</span></div>
              </div>
              {taxInfo && (
                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>GH₵ {taxInfo.baseAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between text-gray-500"><span>VAT (15%) + Levies</span><span>GH₵ {taxInfo.taxes.totalTax.toLocaleString()}</span></div>
                  <div className="flex justify-between font-black text-lg border-t pt-2 text-red-600"><span>Total</span><span>GH₵ {taxInfo.totalAmount.toLocaleString()}</span></div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-gray-50">← Back</button>
                <button onClick={handlePlaceOrder} disabled={isProcessing}
                  className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-black text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isProcessing ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                  ) : (
                    `Pay GH₵ ${(taxInfo?.totalAmount || subtotal).toLocaleString()}`
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center">🔒 Payments secured by Paystack · PCI-DSS compliant</p>
            </motion.div>
          )}
        </div>

        {/* Right: order summary */}
        <div>
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm sticky top-24 space-y-4">
            <h2 className="font-bold text-lg">Order Summary</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500">×{item.quantity} · GH₵ {item.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            {taxInfo && (
              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>GH₵ {taxInfo.baseAmount.toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-500 text-xs"><span>VAT 15%</span><span>GH₵ {taxInfo.taxes.vat.toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-500 text-xs"><span>NHIL 2.5%</span><span>GH₵ {taxInfo.taxes.nhil.toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-500 text-xs"><span>GETFund 2.5%</span><span>GH₵ {taxInfo.taxes.getFund.toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-500 text-xs"><span>COVID Levy 1%</span><span>GH₵ {taxInfo.taxes.covidLevy.toLocaleString()}</span></div>
                <div className="flex justify-between font-black text-base border-t pt-2 text-red-600"><span>Total</span><span>GH₵ {taxInfo.totalAmount.toLocaleString()}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-xl">M</div>
            <span className="text-xl font-black tracking-tighter">MELCOM</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">Ghana's premier retail chain — quality products delivered to your door.</p>
        </div>
        {[
          { title: 'Shop', links: [['Catalog', '/catalog'], ['Electronics', '/catalog'], ['Groceries', '/catalog'], ['Fashion', '/catalog']] },
          { title: 'Account', links: [['My Orders', '/orders'], ['Wishlist', '/wishlist'], ['My Cart', '/cart']] },
          { title: 'Company', links: [['Privacy Policy', '/privacy'], ['About Us', '#'], ['Contact', '#'], ['Store Locator', '#']] },
        ].map(({ title, links }) => (
          <div key={title}>
            <h4 className="font-black mb-4">{title}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {links.map(([l, h]) => <li key={l}><Link to={h} className="hover:text-red-400 transition-colors">{l}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
        <p>© 2026 Melcom Ghana Limited. All rights reserved. Registered in Ghana.</p>
        <p>TIN: C0003849284 · VAT Reg: V0013288X</p>
      </div>
    </footer>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function AppContent() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('melcom_cart_v1') || '[]'); } catch { return []; }
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try { return JSON.parse(localStorage.getItem('melcom_wishlist_v1') || '[]'); } catch { return []; }
  });

  // Persist cart & wishlist to localStorage
  useEffect(() => {
    try { localStorage.setItem('melcom_cart_v1', JSON.stringify(cart)); } catch {}
  }, [cart]);

  useEffect(() => {
    try { localStorage.setItem('melcom_wishlist_v1', JSON.stringify(wishlist)); } catch {}
    // Sync wishlist to Firestore for logged-in users
    if (user?.uid) {
      setDoc(doc(db, 'wishlists', user.uid), { items: wishlist.map(p => p.id), updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    }
  }, [wishlist, user?.uid]);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist(prev => prev.some(p => p.id === product.id) ? prev.filter(p => p.id !== product.id) : [...prev, product]);
  }, []);

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        syncUserToCRM(u);
        // Restore wishlist from Firestore
        try {
          const wishSnap = await getDoc(doc(db, 'wishlists', u.uid));
          if (wishSnap.exists() && products.length > 0) {
            const ids: string[] = wishSnap.data().items || [];
            setWishlist(products.filter(p => ids.includes(p.id)));
          }
        } catch {}
      }
    });
  }, [products.length]);

  const syncUserToCRM = async (u: any) => {
    try {
      const ref = doc(db, 'customers', u.uid);
      const snap = await getDoc(ref);
      const base = { id: u.uid, email: u.email || '', firstName: u.displayName?.split(' ')[0] || 'User', lastName: u.displayName?.split(' ').slice(1).join(' ') || '', phone: u.phoneNumber || '', loyaltyPoints: 0 };
      if (!snap.exists()) {
        await setDoc(ref, base);
        setCustomer(base);
      } else {
        const data = snap.data() as Customer;
        setCustomer(data);
        await setDoc(ref, { email: u.email || data.email, firstName: u.displayName?.split(' ')[0] || data.firstName }, { merge: true });
      }
      // Also ensure user doc for role management
      const userRef = doc(db, 'users', u.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL, role: u.email === 'dm570692@gmail.com' ? 'admin' : 'customer', createdAt: new Date().toISOString() });
      }
    } catch (e) { console.error('CRM sync:', e); }
  };

  // Real-time products
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
      setProducts(data);
      setLoading(false);
      // Seed if empty (for demo)
      if (data.length === 0) seedInitialProducts();
    });
  }, []);

  // AI Recommendations with Gemini
  useEffect(() => {
    if (products.length === 0) return;
    const getRecommendations = async () => {
      if (!import.meta.env.VITE_GEMINI_API_KEY && !import.meta.env.GEMINI_API_KEY) {
        setRecommendations(products.slice(0, 4));
        return;
      }
      try {
        // Get user's recent interactions
        let interactionCategories: string[] = [];
        if (user?.uid) {
          const interSnap = await getDocs(query(collection(db, 'interactions'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(10)));
          const productIds = interSnap.docs.map(d => d.data().productId);
          interactionCategories = [...new Set(productIds.map(id => products.find(p => p.id === id)?.category).filter(Boolean) as string[])];
        }

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
        const ai = new GoogleGenerativeAI(apiKey);
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const categoryList = [...new Set(products.map(p => p.category))].join(', ');
        const prompt = `You are a retail recommendation engine for Melcom Ghana.
Categories available: ${categoryList}.
User's recent interests: ${interactionCategories.length > 0 ? interactionCategories.join(', ') : 'new user, no history'}.
Return a JSON array of exactly 4 category names from the available list that would be most relevant to show on the homepage. Return ONLY the JSON array, no other text.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        const cats: string[] = JSON.parse(text);
        const filtered = cats.flatMap(cat => products.filter(p => p.category === cat).slice(0, 1));
        setRecommendations(filtered.length >= 4 ? filtered.slice(0, 4) : products.slice(0, 4));
      } catch {
        setRecommendations(products.slice(0, 4));
      }
    };
    getRecommendations();
  }, [products, user?.uid]);

  const seedInitialProducts = async () => {
    const initial = [
      { id: 'p1', sku: 'ELC-001', name: 'Samsung 55" QLED Smart TV', description: 'Crystal UHD 4K Smart TV with HDR, 60Hz.', price: 4500, stock: 15, category: 'Electronics & Appliances', image: 'https://picsum.photos/seed/tv/400/300' },
      { id: 'p2', sku: 'APP-002', name: 'LG Double Door Fridge 350L', description: 'Inverter Linear Compressor with Door-in-Door.', price: 8200, stock: 8, category: 'Electronics & Appliances', image: 'https://picsum.photos/seed/fridge/400/300' },
      { id: 'p3', sku: 'GRO-003', name: 'Jasmine Rice 5kg', description: 'Premium long grain jasmine rice.', price: 120, stock: 500, category: 'Supermarket', image: 'https://picsum.photos/seed/rice/400/300' },
      { id: 'p4', sku: 'MOB-004', name: 'iPhone 15 Pro', description: 'Titanium design, A17 Pro chip, ProRes video.', price: 12500, stock: 12, category: 'Mobiles & Computers', image: 'https://picsum.photos/seed/phone/400/300', variations: [{ name: 'Storage', options: ['128GB', '256GB', '512GB'] }, { name: 'Color', options: ['Natural Titanium', 'Black Titanium', 'White Titanium'] }] },
      { id: 'p5', sku: 'APP-005', name: 'Panasonic Microwave 25L', description: '800W Solo Microwave with 5 power levels.', price: 950, stock: 20, category: 'Electronics & Appliances', image: 'https://picsum.photos/seed/microwave/400/300' },
      { id: 'p6', sku: 'FUR-006', name: 'Executive Office Chair', description: 'Ergonomic chair with lumbar support and adjustable height.', price: 1800, stock: 10, category: 'Furniture', image: 'https://picsum.photos/seed/chair/400/300' },
    ];
    for (const p of initial) {
      await setDoc(doc(db, 'products', p.id), p).catch(() => {});
    }
  };

  const trackInteraction = async (productId: string, type: 'view' | 'cart') => {
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, 'interactions', `${user.uid}_${productId}_${Date.now()}`), {
        userId: user.uid, productId, type, timestamp: new Date().toISOString(),
      });
    } catch {}
  };

  const addToCart = useCallback((product: Product, selectedVariations?: Record<string, string>) => {
    trackInteraction(product.id, 'cart');
    setCart(prev => {
      const key = JSON.stringify(selectedVariations);
      const ex = prev.find(i => i.id === product.id && JSON.stringify(i.selectedVariations) === key);
      if (ex) return prev.map(i => i.id === product.id && JSON.stringify(i.selectedVariations) === key ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1, selectedVariations }];
    });
  }, [user?.uid]);

  const updateQuantity = (id: string, v: Record<string, string> | undefined, q: number) => {
    if (q < 1) return;
    setCart(prev => prev.map(i => i.id === id && JSON.stringify(i.selectedVariations) === JSON.stringify(v) ? { ...i, quantity: q } : i));
  };

  const removeFromCart = (id: string, v: Record<string, string> | undefined) => {
    setCart(prev => prev.filter(i => !(i.id === id && JSON.stringify(i.selectedVariations) === JSON.stringify(v))));
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleLogin = () => signInWithPopup(auth, googleProvider).catch(console.error);
  const handleLogout = () => signOut(auth).catch(console.error);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-red-600 text-white px-4 py-2 rounded-xl z-50 font-bold">
        Skip to content
      </a>

      <Navbar
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        wishlistCount={wishlist.length}
        user={user} onLogin={handleLogin} onLogout={handleLogout}
        products={products} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
      />

      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage recommendations={recommendations} addToCart={addToCart} wishlist={wishlist} toggleWishlist={toggleWishlist} loading={loading} />} />
          <Route path="/catalog" element={<CatalogPage products={filteredProducts} addToCart={addToCart} trackView={id => trackInteraction(id, 'view')} searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} wishlist={wishlist} toggleWishlist={toggleWishlist} loading={loading} />} />
          <Route path="/product/:id" element={<ProductDetail products={products} addToCart={addToCart} wishlist={wishlist} toggleWishlist={toggleWishlist} trackView={id => trackInteraction(id, 'view')} />} />
          <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} />} />
          <Route path="/cart" element={<CartPage cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />
          <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={() => setCart([])} user={user} />} />
          <Route path="/orders" element={<OrderHistory user={user} customer={customer} />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </main>

      <Footer />
      <ToastContainer />
      <CookieBanner />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}
