import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Instagram,
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { OrderModal } from './components/OrderModal.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductQuickViewModal } from './components/ProductQuickViewModal.tsx';
import { ResilientImage } from './components/ResilientImage.tsx';
import { WealthStylistDrawer } from './components/WealthStylistDrawer.tsx';
import {
  ATELIER_IMAGE,
  BUSINESS_INFO,
  HERO_IMAGE,
  INITIAL_PRODUCTS,
  TESTIMONIALS,
} from './data/seedCatalog.ts';
import {
  CartItem,
  GenderAudience,
  PageView,
  Product,
  ProductCategory,
} from './types.ts';
import { buildWhatsAppUrl } from './utils/format.ts';

const CART_STORAGE_KEY = 'wfb_shopping_cart_v1';
const PRODUCTS_CACHE_KEY = 'wfb_products_cache_v2';

function getPageFromPathname(pathname: string): PageView {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (clean === '/admin') return 'admin';
  if (clean === '/shop') return 'shop';
  if (clean === '/about') return 'about';
  if (clean === '/contact') return 'contact';
  return 'home';
}

function getPathnameForPage(target: PageView): string {
  if (target === 'home') return '/';
  return `/${target}`;
}

export default function App() {
  const [page, setPage] = useState<PageView>(() =>
    getPageFromPathname(window.location.pathname)
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Product[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage error
    }
    return INITIAL_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage error
    }
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [selectedGender, setSelectedGender] = useState<'All' | GenderAudience>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [cartOpen, setCartOpen] = useState(false);
  const [stylistOpen, setStylistOpen] = useState(false);
  const [quickViewState, setQuickViewState] = useState<{
    product: Product | null;
    option: string;
  }>({ product: null, option: '' });
  const [orderModalState, setOrderModalState] = useState<{
    product: Product | null;
    option: string;
  }>({ product: null, option: '' });

  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const onPopState = () => {
      setPage(getPageFromPathname(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(''), 2600);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(data.products));
      }
    } catch {
      // Keep cached or seed products if offline
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  const navigateTo = (target: PageView, category?: 'All' | ProductCategory) => {
    if (category) {
      setSelectedCategory(category);
    }
    const nextPath = getPathnameForPage(target);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setPage(target);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product, selectedOption: string) => {
    const itemId = `${product.id}__${selectedOption}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          image: product.image,
          selectedOption,
          optionLabel: product.optionLabel,
          quantity: 1,
        },
      ];
    });
    showToast(`Added ${product.name} (${selectedOption}) to your bag`);
  };

  const handleUpdateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOpenOrderNow = (product: Product, option: string) => {
    setOrderModalState({ product, option });
  };

  const handleOpenQuickView = (product: Product, option: string) => {
    setQuickViewState({ product, option });
  };

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const bestSellers = useMemo(() => {
    const featured = products.filter((p) => p.isBestSeller);
    return (featured.length >= 6 ? featured : products).slice(0, 6);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catMatch =
        selectedCategory === 'All' || p.category === selectedCategory;
      const genderMatch =
        selectedGender === 'All' || p.gender === selectedGender;
      const q = searchQuery.trim().toLowerCase();
      const textMatch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return catMatch && genderMatch && textMatch;
    });
  }, [products, selectedCategory, selectedGender, searchQuery]);

  const categoryPreviews = useMemo(() => {
    const findRep = (cat: ProductCategory, fallbackImg: string) =>
      products.find((p) => p.category === cat)?.image || fallbackImg;
    return [
      {
        index: '01',
        title: 'Clothes' as ProductCategory,
        subtitle: 'Agbada, Senator suits, velvet blazers & silk kaftans',
        count: products.filter((p) => p.category === 'Clothes').length,
        image: findRep('Clothes', '/src/assets/images/cloth_agbada_black_gold_1794943007631.jpg'),
      },
      {
        index: '02',
        title: 'Shoes' as ProductCategory,
        subtitle: 'Italian calfskin monk-straps, suede loafers & heels',
        count: products.filter((p) => p.category === 'Shoes').length,
        image: findRep('Shoes', '/src/assets/images/shoe_monk_loafers_1794943009993.jpg'),
      },
      {
        index: '03',
        title: 'Caps' as ProductCategory,
        subtitle: 'Hand-woven gold Fila, bullion wool caps & fedoras',
        count: products.filter((p) => p.category === 'Caps').length,
        image: findRep('Caps', '/src/assets/images/cap_fila_velvet_1794943012304.jpg'),
      },
    ];
  }, [products]);

  // Public storefront navigation strictly excludes Admin
  const publicNavItems: Array<{ label: string; target: PageView }> = [
    { label: 'Home', target: 'home' },
    { label: 'Shop', target: 'shop' },
    { label: 'About', target: 'about' },
    { label: 'Contact', target: 'contact' },
  ];

  // Dedicated /admin URL View — completely separate from end-user storefront UI
  if (page === 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#0B0B0D]">
        <header className="bg-[#0B0B0D] text-[#FAF8F4] border-b border-[#C6A254]/25">
          <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between gap-6">
            <span className="font-serif text-xl font-semibold tracking-wide text-[#FAF8F4] whitespace-nowrap">
              Wealth Fashion · Owner Portal
            </span>
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-[#C6A254] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </button>
          </div>
        </header>
        <main className="flex-1">
          <AdminDashboard products={products} onRefreshProducts={fetchProducts} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#0B0B0D]">
      {/* TOP NAVIGATION BAR — Strict 3-Zone Contract, Zero Admin Link */}
      <header className="sticky top-0 z-40 bg-[#0B0B0D]/95 backdrop-blur-md text-[#FAF8F4] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-[74px] flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Wordmark */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="font-serif text-2xl font-semibold tracking-tight text-[#FAF8F4] hover:text-[#C6A254] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Wealth Fashion
          </button>

          {/* Zone 2: 4 clean single-line text nav links */}
          <nav className="hidden md:flex items-center gap-9 text-[11px] uppercase tracking-[0.18em] font-medium text-[#FAF8F4]/75">
            {publicNavItems.map((item) => {
              const active = page === item.target;
              return (
                <button
                  key={item.target}
                  type="button"
                  onClick={() => navigateTo(item.target)}
                  className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b ${
                    active
                      ? 'text-[#C6A254] border-[#C6A254]'
                      : 'border-transparent hover:text-white hover:border-[#C6A254]/40'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action (Shopping Bag) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="min-h-[40px] px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-semibold bg-[#C6A254] text-[#0B0B0D] hover:bg-[#D4B36A] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="tabular-nums">Bag ({cartCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 text-[#FAF8F4] hover:text-[#C6A254] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-white/10 bg-[#0B0B0D] px-6 py-4 flex flex-col gap-1">
            {publicNavItems.map((item) => (
              <button
                key={item.target}
                type="button"
                onClick={() => navigateTo(item.target)}
                className={`text-left py-3 text-xs uppercase tracking-[0.18em] font-medium border-b border-white/5 ${
                  page === item.target ? 'text-[#C6A254]' : 'text-[#FAF8F4]/85'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-22 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0B0B0D] text-[#C6A254] border border-[#C6A254]/40 shadow-xl text-xs font-medium"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {page === 'home' && (
          <>
            {/* HERO SECTION — Editorial Asymmetric Runway Showcase */}
            <section className="relative bg-[#0B0B0D] text-[#FAF8F4] overflow-hidden">
              <div className="max-w-7xl mx-auto px-6 pt-10 pb-14 lg:py-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[540px] lg:min-h-[620px]">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="lg:col-span-5 flex flex-col justify-center py-8 lg:py-20 lg:pr-10 z-10"
                  >
                    <p className="text-[11px] uppercase tracking-[0.25em] text-[#C6A254] font-semibold">
                      Ibadan Flagship Atelier · Men & Women
                    </p>
                    <h1 className="mt-4 font-serif text-[clamp(2.85rem,5vw,4.75rem)] font-medium leading-[1.02] tracking-tight text-balance">
                      Look Rich,{' '}
                      <span className="italic text-[#D8B973] font-normal">
                        Feel Confident
                      </span>
                    </h1>
                    <p className="mt-6 text-[15px] text-[#FAF8F4]/72 leading-relaxed max-w-md">
                      Bespoke black-and-gold Agbada, Italian calfskin footwear, and signature velvet headwear—curated in Bodija, Ibadan for effortless presence.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => navigateTo('shop', 'All')}
                        className="min-h-[46px] px-7 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold bg-[#C6A254] text-[#0B0B0D] hover:bg-[#D4B36A] transition-colors inline-flex items-center gap-2.5 whitespace-nowrap cursor-pointer"
                      >
                        <span>Explore Collection</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStylistOpen(true)}
                        className="min-h-[46px] px-5 py-3 text-[11px] uppercase tracking-[0.16em] font-medium text-[#FAF8F4]/90 border-b border-[#C6A254]/50 hover:text-[#C6A254] hover:border-[#C6A254] transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#C6A254]" />
                        <span>Consult Wealth Stylist</span>
                      </button>
                    </div>
                  </motion.div>

                  <div className="lg:col-span-7 relative min-h-[340px] lg:min-h-[620px]">
                    <ResilientImage
                      src={HERO_IMAGE}
                      alt="Wealth Fashion Boutique Ibadan luxury black and gold couture couple"
                      className="w-full h-full object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none hidden lg:block absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-[#0B0B0D] to-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Full-width 4-Column Atelier Strip below Hero */}
              <div className="border-t border-white/10 bg-[#101014]">
                <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:divide-x lg:divide-white/10">
                  <div className="lg:pr-6">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#C6A254]">
                      Ibadan Flagship
                    </p>
                    <p className="mt-1 text-xs text-[#FAF8F4]/75">
                      Awolowo Avenue, Bodija
                    </p>
                  </div>
                  <div className="lg:px-6">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#C6A254]">
                      Three Houses
                    </p>
                    <p className="mt-1 text-xs text-[#FAF8F4]/75">
                      Clothes, Shoes & Headwear
                    </p>
                  </div>
                  <div className="lg:px-6">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#C6A254]">
                      Express Courier
                    </p>
                    <p className="mt-1 text-xs text-[#FAF8F4]/75">
                      Same-Day Ibadan & Nationwide
                    </p>
                  </div>
                  <div className="lg:pl-6">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#C6A254]">
                      Direct Concierge
                    </p>
                    <p className="mt-1 text-xs text-[#FAF8F4]/75 font-mono">
                      {BUSINESS_INFO.whatsappDisplay}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* EDITORIAL CATEGORY LOOKBOOK — Asymmetric Mosaic */}
            <section className="max-w-7xl mx-auto px-6 py-20 lg:py-24">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#E0D9CA]">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
                    The Boutique Houses
                  </p>
                  <h2 className="mt-2 font-serif text-4xl font-medium text-[#0B0B0D]">
                    Curated By Discipline
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('shop', 'All')}
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B0B0D] hover:text-[#9D7B32] inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore All {products.length} Pieces</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Primary House: Clothes */}
                <button
                  type="button"
                  onClick={() => navigateTo('shop', categoryPreviews[0].title)}
                  className="group lg:col-span-6 relative aspect-[4/3] lg:aspect-auto lg:min-h-[460px] overflow-hidden bg-[#151519] text-left cursor-pointer"
                >
                  <ResilientImage
                    src={categoryPreviews[0].image}
                    alt="Clothes at Wealth Fashion Boutique"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 flex items-end justify-between gap-4 text-[#FAF8F4]">
                    <div>
                      <p className="font-serif italic text-sm text-[#C6A254]">
                        {categoryPreviews[0].index} · {categoryPreviews[0].count} Pieces
                      </p>
                      <h3 className="mt-1 font-serif text-3xl font-medium">
                        {categoryPreviews[0].title}
                      </h3>
                      <p className="mt-1 text-xs text-[#FAF8F4]/75 max-w-sm">
                        {categoryPreviews[0].subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#C6A254] shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </button>

                {/* Secondary Houses: Shoes & Caps */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  {categoryPreviews.slice(1).map((cat) => (
                    <button
                      key={cat.title}
                      type="button"
                      onClick={() => navigateTo('shop', cat.title)}
                      className="group relative min-h-[218px] overflow-hidden bg-[#151519] text-left cursor-pointer"
                    >
                      <ResilientImage
                        src={cat.image}
                        alt={`${cat.title} at Wealth Fashion Boutique`}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between gap-4 text-[#FAF8F4]">
                        <div>
                          <p className="font-serif italic text-sm text-[#C6A254]">
                            {cat.index} · {cat.count} Pieces
                          </p>
                          <h3 className="mt-0.5 font-serif text-2xl font-medium">
                            {cat.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-[#FAF8F4]/75">
                            {cat.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#C6A254] shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* BEST SELLERS — Clean Gallery Grid */}
            <section className="max-w-7xl mx-auto px-6 pb-20 lg:pb-24">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#E0D9CA]">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
                    Most Requested
                  </p>
                  <h2 className="mt-2 font-serif text-4xl font-medium text-[#0B0B0D]">
                    House Best Sellers
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('shop', 'All')}
                  className="px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] transition-colors whitespace-nowrap cursor-pointer"
                >
                  View Full Catalogue
                </button>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {bestSellers.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onOrderNow={handleOpenOrderNow}
                    onQuickView={handleOpenQuickView}
                  />
                ))}
              </div>
            </section>

            {/* WHY SHOP WITH US — Obsidian Editorial Manifesto (Zero Card Clones) */}
            <section className="bg-[#0B0B0D] text-[#FAF8F4] py-20 lg:py-24">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-28">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#C6A254] font-semibold">
                    The Wealth Standard
                  </p>
                  <h2 className="font-serif text-4xl sm:text-5xl font-medium leading-[1.08] text-balance">
                    Tailored for Presence,{' '}
                    <span className="italic text-[#D8B973] font-normal">
                      Priced with Integrity
                    </span>
                  </h2>
                  <p className="text-sm text-[#FAF8F4]/70 leading-relaxed max-w-md">
                    Every silhouette in our Bodija showroom balances rich Nigerian sartorial heritage with understated contemporary finish.
                  </p>
                </div>

                <div className="lg:col-span-7 divide-y divide-white/12 border-t border-b border-white/12">
                  {[
                    {
                      num: '01',
                      title: 'Bespoke Ibadan Tailoring',
                      body: 'Agbada, Senator suits, and silk kaftans cut from breathable luxury fabrics with crisp metallic gold threadwork.',
                    },
                    {
                      num: '02',
                      title: 'Affordable Luxury Without Markup',
                      body: 'Direct-from-atelier pricing in Naira across sizes S–XL and footwear 40–45 for discerning men and women.',
                    },
                    {
                      num: '03',
                      title: 'Same-Day Ibadan & Global Dispatch',
                      body: 'Dedicated courier across Bodija, Jericho, Oluyole, and Akobo, plus 48–72 hour tracked delivery nationwide.',
                    },
                    {
                      num: '04',
                      title: 'AI Stylist + WhatsApp Concierge',
                      body: 'Instant three-piece outfit curation from Wealth Stylist backed by real fitting support on +234 904 755 2985.',
                    },
                  ].map((pillar) => (
                    <div
                      key={pillar.num}
                      className="py-7 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-baseline"
                    >
                      <span className="sm:col-span-2 font-serif italic text-2xl text-[#C6A254]">
                        {pillar.num}.
                      </span>
                      <div className="sm:col-span-10 space-y-1.5">
                        <h3 className="font-sans text-base font-semibold text-[#FAF8F4]">
                          {pillar.title}
                        </h3>
                        <p className="text-sm text-[#FAF8F4]/68 leading-relaxed">
                          {pillar.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CLIENT TESTIMONIALS — Hairline Broadsheet Quotes */}
            <section className="max-w-7xl mx-auto px-6 py-20 lg:py-24">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#E0D9CA]">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
                    Client Voices
                  </p>
                  <h2 className="mt-2 font-serif text-4xl font-medium text-[#0B0B0D]">
                    Worn Across Ibadan & Beyond
                  </h2>
                </div>
                <a
                  href={BUSINESS_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-[#0B0B0D] hover:text-[#9D7B32]"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{BUSINESS_INFO.instagramHandle}</span>
                </a>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-[#E0D9CA]">
                {TESTIMONIALS.map((t, idx) => (
                  <blockquote
                    key={t.name}
                    className={`flex flex-col justify-between gap-6 ${
                      idx === 0
                        ? 'md:pr-8'
                        : idx === 1
                          ? 'md:px-8'
                          : 'md:pl-8'
                    }`}
                  >
                    <p className="font-serif text-xl italic text-[#1C1917] leading-relaxed">
                      “{t.quote}”
                    </p>
                    <footer>
                      <p className="text-sm font-semibold text-[#0B0B0D]">
                        {t.name}
                      </p>
                      <p className="text-xs text-[#6B665C]">{t.role}</p>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </section>
          </>
        )}

        {/* SHOP / PRODUCTS PAGE */}
        {page === 'shop' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="max-w-7xl mx-auto px-6 py-12 lg:py-16 space-y-10"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E0D9CA]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
                  Wealth Fashion Boutique
                </p>
                <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-medium text-[#0B0B0D]">
                  The Complete Collection
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setStylistOpen(true)}
                className="px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] inline-flex items-center gap-2 self-start md:self-auto cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask Wealth Stylist</span>
              </button>
            </div>

            {/* Minimalist Editorial Filter Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E0D9CA]">
              <div className="flex flex-wrap items-center gap-2">
                {(['All', 'Clothes', 'Shoes', 'Caps'] as const).map((cat) => {
                  const active = selectedCategory === cat;
                  const count =
                    cat === 'All'
                      ? products.length
                      : products.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#0B0B0D] text-[#C6A254]'
                          : 'bg-transparent text-[#57534E] border border-[#DCD5C7] hover:border-[#0B0B0D] hover:text-[#0B0B0D]'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedGender}
                  onChange={(e) =>
                    setSelectedGender(e.target.value as 'All' | GenderAudience)
                  }
                  aria-label="Filter by collection"
                  className="min-h-[40px] px-3 py-2 text-xs font-medium bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                >
                  <option value="All">All Collections</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                </select>

                <div className="relative flex-1 sm:w-64">
                  <Search
                    className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    placeholder="Search outfits, shoes, caps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-h-[40px] pl-9 pr-3 py-2 text-xs bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center space-y-3 border-b border-[#E0D9CA]">
                <p className="font-serif text-3xl text-[#0B0B0D]">
                  No pieces matched your filter
                </p>
                <p className="text-sm text-[#57534E]">
                  Try clearing your search or switching back to all categories.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedGender('All');
                    setSearchQuery('');
                  }}
                  className="mt-2 px-6 py-2.5 text-xs uppercase tracking-widest font-semibold bg-[#0B0B0D] text-[#C6A254] cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onOrderNow={handleOpenOrderNow}
                    onQuickView={handleOpenQuickView}
                  />
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* ABOUT PAGE */}
        {page === 'about' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="max-w-7xl mx-auto px-6 py-16 lg:py-24 space-y-20"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
                  Our Story · Ibadan, Nigeria
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#0B0B0D] leading-[1.08] text-balance">
                  Affordable Luxury Fashion for Everyone
                </h1>
                <p className="text-base text-[#44403C] leading-relaxed">
                  Founded in Ibadan, <strong>Wealth Fashion Boutique</strong> was born from a simple conviction: stepping into a room looking sharp, poised, and unforgettable should never require an unattainable price tag.
                </p>
                <p className="text-base text-[#44403C] leading-relaxed">
                  From bespoke black-and-gold Agbada and crisp Senator attire to Italian calfskin footwear and hand-woven velvet Fila caps, every piece in our Bodija showroom is curated for men and women who value quiet power and unmistakable craftsmanship.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigateTo('shop', 'All')}
                    className="min-h-[44px] px-7 py-2.5 text-xs uppercase tracking-[0.18em] font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] cursor-pointer"
                  >
                    Shop the Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('contact')}
                    className="min-h-[44px] px-7 py-2.5 text-xs uppercase tracking-[0.18em] font-medium border border-[#0B0B0D] text-[#0B0B0D] hover:bg-white cursor-pointer"
                  >
                    Book a Fitting
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="aspect-[4/3] overflow-hidden bg-[#151519]">
                  <ResilientImage
                    src={ATELIER_IMAGE}
                    alt="Wealth Fashion Boutique luxury showroom in Bodija Ibadan"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 md:divide-x md:divide-[#E0D9CA] pt-14 border-t border-[#E0D9CA]">
              <div className="md:pr-8">
                <p className="font-serif italic text-xl text-[#9D7B32]">01. Apparel</p>
                <h2 className="mt-2 font-serif text-3xl font-medium text-[#0B0B0D]">
                  Tailored Clothes
                </h2>
                <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                  Sizes S through XL crafted in breathable wool, velvet, cashmere, and silk for weddings, boardrooms, and Ibadan evenings.
                </p>
              </div>
              <div className="md:px-8">
                <p className="font-serif italic text-xl text-[#9D7B32]">02. Footwear</p>
                <h2 className="mt-2 font-serif text-3xl font-medium text-[#0B0B0D]">
                  Signature Shoes
                </h2>
                <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                  Sizes 40 to 45 spanning double monk-straps, gold-crest loafers, court sneakers, Chelsea boots, and chain-trim heels.
                </p>
              </div>
              <div className="md:pl-8">
                <p className="font-serif italic text-xl text-[#9D7B32]">03. Headwear</p>
                <h2 className="mt-2 font-serif text-3xl font-medium text-[#0B0B0D]">
                  Crowning Caps
                </h2>
                <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                  Rich Nigerian velvet Fila, bullion wool caps, crisp alabaster snapbacks, and leather-trimmed fedoras in signature colourways.
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* CONTACT PAGE */}
        {page === 'contact' && <ContactSection products={products} />}
      </main>

      {/* FOOTER — Public Links Only, Zero Admin Exposure */}
      <footer className="bg-[#0B0B0D] text-[#FAF8F4] border-t border-[#C6A254]/20">
        <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-3">
            <p className="font-serif text-3xl font-medium text-[#FAF8F4]">
              Wealth Fashion Boutique
            </p>
            <p className="text-sm text-[#FAF8F4]/68 max-w-sm leading-relaxed">
              Look Rich, Feel Confident. Ibadan destination for luxury clothes, handcrafted footwear, and signature caps for men and women.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C6A254] font-semibold">
              Boutique
            </p>
            <div className="flex flex-col gap-2 text-[#FAF8F4]/75">
              {publicNavItems.map((item) => (
                <button
                  key={item.target}
                  type="button"
                  onClick={() => navigateTo(item.target)}
                  className="text-left hover:text-[#C6A254] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-4 space-y-2.5 text-sm text-[#FAF8F4]/75">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C6A254] font-semibold">
              Ibadan Showroom
            </p>
            <p>{BUSINESS_INFO.location}</p>
            <p>
              WhatsApp:{' '}
              <a
                href={buildWhatsAppUrl('Hello Wealth Fashion Boutique, I would like to place an order.')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C6A254] hover:underline font-mono"
              >
                {BUSINESS_INFO.whatsappDisplay}
              </a>
            </p>
            <p>
              Instagram:{' '}
              <a
                href={BUSINESS_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C6A254] hover:underline"
              >
                {BUSINESS_INFO.instagramHandle}
              </a>
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 px-6 text-center text-xs text-[#FAF8F4]/45">
          © {new Date().getFullYear()} Wealth Fashion Boutique · Ibadan, Nigeria
        </div>
      </footer>

      {/* ALWAYS-VISIBLE FLOATING ACTION PAIR: WEALTH STYLIST AI + WHATSAPP ORDER */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setStylistOpen(true)}
          aria-label="Open Wealth Stylist AI Fashion Assistant"
          className="h-11 px-4 bg-[#0B0B0D] text-[#C6A254] border border-[#C6A254]/50 shadow-2xl hover:bg-[#1C1C22] transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
        >
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Wealth Stylist</span>
        </button>

        <a
          href={buildWhatsAppUrl(
            'Hello Wealth Fashion Boutique! I would like to place an order.'
          )}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Order via WhatsApp"
          className="h-11 px-4 bg-[#C6A254] text-[#0B0B0D] shadow-2xl hover:bg-[#D4B36A] transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2 text-xs font-semibold whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">WhatsApp Order</span>
          <span className="sm:hidden">WhatsApp</span>
        </a>
      </div>

      {/* DRAWERS & MODALS */}
      <CartDrawer
        isOpen={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      <WealthStylistDrawer
        isOpen={stylistOpen}
        onClose={() => setStylistOpen(false)}
        onAddToCart={handleAddToCart}
        onOrderNow={(prod, opt) => {
          setStylistOpen(false);
          handleOpenOrderNow(prod, opt);
        }}
      />

      <ProductQuickViewModal
        product={quickViewState.product}
        initialOption={quickViewState.option}
        onClose={() => setQuickViewState({ product: null, option: '' })}
        onAddToCart={handleAddToCart}
        onOrderNow={handleOpenOrderNow}
      />

      <OrderModal
        product={orderModalState.product}
        initialOption={orderModalState.option}
        onClose={() => setOrderModalState({ product: null, option: '' })}
      />
    </div>
  );
}
