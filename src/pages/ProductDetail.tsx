import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, ChevronLeft, Star, Package, Truck, Shield, Plus, Minus, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { ProductDetailSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

interface Props {
  products: Product[];
  addToCart: (p: Product, variations?: Record<string, string>) => void;
  wishlist: Product[];
  toggleWishlist: (p: Product) => void;
  trackView: (id: string) => void;
}

export function ProductDetail({ products, addToCart, wishlist, toggleWishlist, trackView }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const product = products.find(p => p.id === id);
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState(false);
  const isWishlisted = wishlist.some(p => p.id === id);

  // Build image gallery (use product.images if available, else seed 4 from picsum)
  const images = product?.images?.length
    ? product.images
    : product
      ? [product.image, ...Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/${product.id}-${i + 1}/600/600`)]
      : [];

  const related = products.filter(p => p.category === product?.category && p.id !== id).slice(0, 4);

  useEffect(() => {
    if (product) {
      trackView(product.id);
      // Default variation selections
      if (product.variations) {
        const initial: Record<string, string> = {};
        product.variations.forEach(v => { initial[v.name] = v.options[0]; });
        setSelectedVariations(initial);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id, product]);

  // Update meta title
  useEffect(() => {
    if (product) document.title = `${product.name} — Melcom Ghana`;
    return () => { document.title = 'Melcom Ghana'; };
  }, [product]);

  if (products.length === 0) return <ProductDetailSkeleton />;
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center space-y-6">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
          <Package size={32} className="text-gray-400" />
        </div>
        <h2 className="text-3xl font-black">Product not found</h2>
        <Link to="/catalog" className="inline-block bg-red-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-700 transition-colors">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, Object.keys(selectedVariations).length > 0 ? selectedVariations : undefined);
    addToast(`"${product.name}" added to cart`, 'success');
  };

  const handleWishlist = () => {
    toggleWishlist(product);
    addToast(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist', isWishlisted ? 'info' : 'success');
  };

  const stars = Math.round(product.rating ?? 4.2);
  const reviewCount = product.reviewCount ?? Math.floor(50 + Math.random() * 200);

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-red-600 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link to="/catalog" className="hover:text-red-600 transition-colors">Catalog</Link>
          <ChevronRight size={14} />
          <Link to={`/catalog?category=${encodeURIComponent(product.category)}`} className="hover:text-red-600 transition-colors">{product.category}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">
          {/* ── Image Gallery ── */}
          <div className="space-y-4">
            <div
              className="relative aspect-square bg-gray-50 rounded-3xl overflow-hidden cursor-zoom-in group"
              onClick={() => setLightbox(true)}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImg}
                  src={images[selectedImg]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full transition-opacity">
                  Click to enlarge
                </span>
              </div>
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs">Out of Stock</span>
                </div>
              )}
              {product.stock > 0 && product.stock <= 5 && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider">
                  Only {product.stock} left
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={cn(
                    'w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0',
                    selectedImg === i ? 'border-red-600 shadow-md shadow-red-600/20' : 'border-transparent hover:border-gray-300'
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                </button>
              ))}
            </div>
          </div>

          {/* ── Product Info ── */}
          <div className="space-y-6 lg:pt-2">
            {/* Category + SKU */}
            <div className="flex items-center gap-3">
              <Link
                to={`/catalog?category=${encodeURIComponent(product.category)}`}
                className="text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
              >
                {product.category}
              </Link>
              {product.sku && <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>}
            </div>

            {/* Name */}
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className={cn(i < stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200')} />
                ))}
              </div>
              <span className="text-sm text-gray-600 font-medium">{(stars + 0.2).toFixed(1)}</span>
              <span className="text-sm text-gray-400">({reviewCount.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-4">
              <span className="text-4xl font-black text-gray-900">GH₵ {product.price.toLocaleString()}</span>
              {product.price > 500 && (
                <span className="text-lg text-gray-400 line-through mb-1">GH₵ {Math.round(product.price * 1.12).toLocaleString()}</span>
              )}
              {product.price > 500 && (
                <span className="mb-1 text-sm font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">SAVE 11%</span>
              )}
            </div>

            {/* Stock */}
            <div className={cn(
              'flex items-center gap-2 text-sm font-bold',
              product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-600'
            )}>
              <div className={cn('w-2 h-2 rounded-full', product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500')} />
              {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} remaining` : 'Out of Stock'}
            </div>

            <div className="border-t border-gray-100" />

            {/* Variations */}
            {product.variations?.map(v => (
              <div key={v.name} className="space-y-2">
                <p className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  {v.name}: <span className="font-medium normal-case text-red-600">{selectedVariations[v.name]}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {v.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedVariations(p => ({ ...p, [v.name]: opt }))}
                      className={cn(
                        'px-4 py-2 text-xs rounded-xl border-2 font-bold uppercase tracking-wide transition-all',
                        selectedVariations[v.name] === opt
                          ? 'bg-gray-900 border-gray-900 text-white shadow-lg'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 py-3 font-bold text-lg w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-red-700 active:scale-[0.98] transition-all shadow-xl shadow-red-600/25 disabled:opacity-50 disabled:bg-gray-200 disabled:shadow-none"
              >
                <ShoppingBag size={20} />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleWishlist}
                className={cn(
                  'w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all',
                  isWishlisted ? 'bg-red-600 border-red-600 text-white' : 'border-gray-200 text-gray-600 hover:border-red-600 hover:text-red-600'
                )}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck,    label: 'Free Delivery',   sub: 'Accra & Kumasi' },
                { icon: Shield,   label: 'Genuine Product', sub: '100% authentic' },
                { icon: Package,  label: 'Easy Returns',    sub: '7-day policy' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-gray-50 rounded-2xl p-3 text-center">
                  <Icon size={18} className="text-red-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900">{label}</p>
                  <p className="text-[10px] text-gray-500">{sub}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="border-t border-gray-100 pt-6 space-y-3">
              <h3 className="font-black text-gray-900">About this product</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="border-t border-gray-100 pt-6 space-y-3">
                <h3 className="font-black text-gray-900">Specifications</h3>
                <div className="space-y-2">
                  {Object.entries(product.specifications).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm py-2 border-b border-gray-50">
                      <span className="text-gray-500 font-medium">{k}</span>
                      <span className="text-gray-900 font-bold text-right max-w-[60%]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <section className="mt-20 border-t border-gray-100 pt-16">
            <h2 className="text-2xl font-black text-gray-900 mb-8">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(p => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">{p.name}</p>
                    <p className="text-red-600 font-black mt-1">GH₵ {p.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white"
              onClick={() => setLightbox(false)}
              aria-label="Close lightbox"
            >
              <X size={28} />
            </button>
            <img
              src={images[selectedImg]}
              alt={product.name}
              className="max-w-full max-h-full object-contain rounded-2xl"
              referrerPolicy="no-referrer"
              onClick={e => e.stopPropagation()}
            />
            {/* Lightbox nav */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                  onClick={e => { e.stopPropagation(); setSelectedImg(i => (i - 1 + images.length) % images.length); }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                  onClick={e => { e.stopPropagation(); setSelectedImg(i => (i + 1) % images.length); }}
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
