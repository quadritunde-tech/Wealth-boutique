import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Instagram,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { OrderModal } from './components/OrderModal.tsx';
import { ProductCard } from './components/ProductCard.tsx';
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

export default function App() {
  const [page, setPage] = useState<PageView>('home');
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
  const [orderModalState, setOrderModalState] = useState<{
    product: Product | null;
    option: string;
  }>({ product: null, option: '' });

  const [toastMessage, setToastMessage] = useState('');

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
        title: 'Clothes' as ProductCategory,
        subtitle: 'Bespoke Agbada, Senator suits, velvet blazers & silk kaftans',
        count: products.filter((p) => p.category === 'Clothes').length,
        image: findRep('Clothes', '/src/assets/images/cloth_agbada_black_gold_1794943007631.jpg'),
      },
      {
        title: 'Shoes' as ProductCategory,
        subtitle: 'Calfskin monk-straps, gold-crest loafers, sneakers & heels',
        count: products.filter((p) => p.category === 'Shoes').length,
        image: findRep('Shoes', '/src/assets/images/shoe_monk_loafers_1794943009993.jpg'),
      },
      {
        title: 'Caps' as ProductCategory,
        subtitle: 'Velvet gold-weave Fila, bullion wool caps & structured fedoras',
        count: products.filter((p) => p.category === 'Caps').length,
        image: findRep('Caps', '/src/assets/images/cap_fila_velvet_1794943012304.jpg'),
      },
    ];
  }, [products]);

  const navItems: Array<{ label: string; target: PageView }> = [
    { label: 'Home', target: 'home' },
    { label: 'Shop', target: 'shop' },
    { label: 'About', target: 'about' },
    { label: 'Contact', target: 'contact' },
    { label: 'Admin', target: 'admin' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#0B0B0D]">
      {/* TOP NAVIGATION BAR — 3-Zone Contract */}
      <header className="sticky top-0 z-40 bg-[#0B0B0D] text-[#FAF8F4] border-b border-[#C6A254]/25">
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Wordmark */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="font-serif text-xl font-semibold tracking-tight text-[#FAF8F4] hover:text-[#C6A254] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Wealth Fashion
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#FAF8F4]/80">
            {navItems.map((item) => {
              const active = page === item.target;
              return (
                <button
                  key={item.target}
                  type="button"
                  onClick={() => navigateTo(item.target)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b ${
                    active
                      ? 'text-[#C6A254] border-[#C6A254]'
                      : 'border-transparent hover:text-white hover:border-[#C6A254]/50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action (Shopping Bag) + mobile menu toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold bg-[#C6A254] text-[#0B0B0D] hover:bg-[#B89242] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
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
          <nav className="md:hidden border-t border-[#C6A254]/20 bg-[#0B0B0D] px-6 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.target}
                type="button"
                onClick={() => navigateTo(item.target)}
                className={`text-left py-2.5 text-sm font-medium border-b border-white/5 ${
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
          className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0B0B0D] text-[#C6A254] border border-[#C6A254]/40 shadow-xl text-xs font-medium"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {page === 'home' && (
          <>
            {/* HERO SECTION */}
            <section className="bg-[#0B0B0D] text-[#FAF8F4] border-b border-[#C6A254]/20">
              <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
                <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#C6A254] font-semibold">
                    Wealth Fashion Boutique · Ibadan, Nigeria
                  </p>
                  <h1 className="font-serif text-[clamp(2.5rem,4.5vw,4.15rem)] font-semibold leading-[1.08] tracking-tight text-balance">
                    Look Rich, Feel Confident
                  </h1>
                  <p className="text-base text-[#FAF8F4]/78 leading-relaxed max-w-lg">
                    Affordable luxury menswear and womenswear curated in Bodija, Ibadan—from hand-embroidered black and gold Agbada to Italian calfskin footwear and signature Fila headwear.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => navigateTo('shop', 'All')}
                      className="min-h-[46px] px-7 py-3 text-sm font-semibold bg-[#C6A254] text-[#0B0B0D] hover:bg-[#B89242] transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStylistOpen(true)}
                      className="min-h-[46px] px-6 py-3 text-sm font-medium border border-[#C6A254]/60 text-[#FAF8F4] hover:border-[#C6A254] hover:text-[#C6A254] transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#C6A254]" />
                      <span>Ask Wealth Stylist</span>
                    </button>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-[#FAF8F4]/65">
                    <span>Clothes · Shoes · Caps</span>
                    <span aria-hidden="true">/</span>
                    <span>Men & Women</span>
                    <span aria-hidden="true">/</span>
                    <span>Same-Day Ibadan Delivery</span>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="relative h-full min-h-[340px] lg:min-h-[480px] overflow-hidden border border-[#C6A254]/25 bg-[#151519]">
                    <ResilientImage
                      src={HERO_IMAGE}
                      alt="Wealth Fashion Boutique Ibadan luxury black and gold couture couple"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* CATEGORIES SECTION */}
            <section className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#E5DFD3]">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#9D7B32] font-semibold">
                    The Boutique Houses
                  </p>
                  <h2 className="mt-1 font-serif text-3xl font-semibold text-[#0B0B0D]">
                    Shop By Category
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('shop', 'All')}
                  className="text-xs font-semibold uppercase tracking-wider text-[#0B0B0D] hover:text-[#9D7B32] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View All {products.length} Pieces</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {categoryPreviews.map((cat) => (
                  <button
                    key={cat.title}
                    type="button"
                    onClick={() => navigateTo('shop', cat.title)}
                    className="group text-left bg-white border border-[#E5DFD3] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-[#F3EFE6]">
                      <ResilientImage
                        src={cat.image}
                        alt={`${cat.title} collection at Wealth Fashion Boutique`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-[#9D7B32] font-medium tabular-nums">
                          {cat.count} Curated Pieces
                        </p>
                        <h3 className="mt-1 font-serif text-2xl font-semibold text-[#0B0B0D]">
                          {cat.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#57534E] leading-relaxed">
                          {cat.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#0B0B0D] shrink-0 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* BEST SELLERS SECTION */}
            <section className="bg-white border-y border-[#E5DFD3] py-16 lg:py-20">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#EFEAE0]">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#9D7B32] font-semibold">
                      Client Favourites
                    </p>
                    <h2 className="mt-1 font-serif text-3xl font-semibold text-[#0B0B0D]">
                      Best Sellers in Ibadan
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('shop', 'All')}
                    className="px-5 py-2.5 text-xs font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Browse Full Shop
                  </button>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bestSellers.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onOrderNow={handleOpenOrderNow}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* WHY SHOP WITH US + TESTIMONIES */}
            <section className="max-w-7xl mx-auto px-6 py-16 lg:py-20 space-y-16">
              <div>
                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-widest text-[#9D7B32] font-semibold">
                    The Wealth Standard
                  </p>
                  <h2 className="mt-1 font-serif text-3xl font-semibold text-[#0B0B0D]">
                    Why Discerning Clients Shop With Us
                  </h2>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white border border-[#E5DFD3] p-6 space-y-2.5">
                    <Award className="w-5 h-5 text-[#9D7B32]" />
                    <h3 className="font-sans text-base font-semibold text-[#0B0B0D]">
                      Bespoke Ibadan Tailoring
                    </h3>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      Every Agbada, Senator suit, and kaftan is cut from breathable luxury fabrics with crisp gold threadwork.
                    </p>
                  </div>
                  <div className="bg-white border border-[#E5DFD3] p-6 space-y-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#9D7B32]" />
                    <h3 className="font-sans text-base font-semibold text-[#0B0B0D]">
                      Affordable Luxury
                    </h3>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      Direct-from-atelier pricing in Naira with zero middleman markups, crafted for men and women.
                    </p>
                  </div>
                  <div className="bg-white border border-[#E5DFD3] p-6 space-y-2.5">
                    <Truck className="w-5 h-5 text-[#9D7B32]" />
                    <h3 className="font-sans text-base font-semibold text-[#0B0B0D]">
                      Fast Ibadan & Global Dispatch
                    </h3>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      Same-day courier across Bodija, Jericho, Oluyole, and Akobo, plus 48–72 hour express shipping nationwide and abroad.
                    </p>
                  </div>
                  <div className="bg-white border border-[#E5DFD3] p-6 space-y-2.5">
                    <MessageCircle className="w-5 h-5 text-[#9D7B32]" />
                    <h3 className="font-sans text-base font-semibold text-[#0B0B0D]">
                      Personal Concierge & AI Stylist
                    </h3>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      Get instant outfit pairings from Wealth Stylist or confirm measurements directly with our team on WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Testimonies */}
              <div className="pt-12 border-t border-[#E5DFD3]">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#9D7B32] font-semibold">
                      Client Voices
                    </p>
                    <h2 className="mt-1 font-serif text-3xl font-semibold text-[#0B0B0D]">
                      Worn Across Ibadan & Beyond
                    </h2>
                  </div>
                  <a
                    href={BUSINESS_INFO.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B0B0D] hover:text-[#9D7B32]"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>See Looks on {BUSINESS_INFO.instagramHandle}</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {TESTIMONIALS.map((t) => (
                    <blockquote
                      key={t.name}
                      className="bg-white border border-[#E5DFD3] p-6 flex flex-col justify-between gap-5"
                    >
                      <p className="text-sm text-[#292524] leading-relaxed">
                        “{t.quote}”
                      </p>
                      <footer className="pt-4 border-t border-[#EFEAE0]">
                        <p className="text-sm font-semibold text-[#0B0B0D]">
                          {t.name}
                        </p>
                        <p className="text-xs text-[#6B665C]">{t.role}</p>
                      </footer>
                    </blockquote>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* SHOP / PRODUCTS PAGE */}
        {page === 'shop' && (
          <section className="max-w-7xl mx-auto px-6 py-12 lg:py-16 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5DFD3]">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#9D7B32] font-semibold">
                  Wealth Fashion Boutique Collection
                </p>
                <h1 className="mt-1 font-serif text-4xl font-semibold text-[#0B0B0D]">
                  Curated Luxury Catalogue
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setStylistOpen(true)}
                className="px-4 py-2.5 text-xs font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] inline-flex items-center gap-2 self-start md:self-auto cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Need Styling Advice? Ask Wealth Stylist</span>
              </button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#E5DFD3] p-4">
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
                          : 'bg-[#FAF8F4] text-[#44403C] border border-[#DCD5C7] hover:border-[#0B0B0D]'
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
                  className="min-h-[40px] px-3 py-2 text-xs font-medium bg-[#FAF8F4] border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
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
                    className="w-full min-h-[40px] pl-9 pr-3 py-2 text-xs bg-[#FAF8F4] border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-[#E5DFD3] p-12 text-center space-y-3">
                <p className="font-serif text-2xl text-[#0B0B0D]">
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
                  className="mt-2 px-5 py-2.5 text-xs font-semibold bg-[#0B0B0D] text-[#C6A254] cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onOrderNow={handleOpenOrderNow}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ABOUT PAGE */}
        {page === 'about' && (
          <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24 space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <p className="text-xs uppercase tracking-widest text-[#9D7B32] font-semibold">
                  Our Story · Ibadan, Nigeria
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#0B0B0D] leading-tight text-balance">
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
                    className="min-h-[44px] px-6 py-2.5 text-sm font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] cursor-pointer"
                  >
                    Shop the Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('contact')}
                    className="min-h-[44px] px-6 py-2.5 text-sm font-medium border border-[#0B0B0D] text-[#0B0B0D] hover:bg-white cursor-pointer"
                  >
                    Book a Fitting
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="aspect-[4/3] overflow-hidden border border-[#E5DFD3] bg-[#151519]">
                  <ResilientImage
                    src={ATELIER_IMAGE}
                    alt="Wealth Fashion Boutique luxury showroom in Bodija Ibadan"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-[#E5DFD3]">
              <div className="bg-white border border-[#E5DFD3] p-7">
                <p className="font-mono text-xs text-[#9D7B32] font-semibold">01. Apparel</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-[#0B0B0D]">
                  Tailored Clothes
                </h2>
                <p className="mt-2 text-sm text-[#57534E] leading-relaxed">
                  Sizes S through XL crafted in breathable wool, velvet, cashmere, and silk for weddings, boardrooms, and Ibadan evenings.
                </p>
              </div>
              <div className="bg-white border border-[#E5DFD3] p-7">
                <p className="font-mono text-xs text-[#9D7B32] font-semibold">02. Footwear</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-[#0B0B0D]">
                  Signature Shoes
                </h2>
                <p className="mt-2 text-sm text-[#57534E] leading-relaxed">
                  Sizes 40 to 45 spanning double monk-straps, gold-crest loafers, court sneakers, Chelsea boots, and chain-trim heels.
                </p>
              </div>
              <div className="bg-white border border-[#E5DFD3] p-7">
                <p className="font-mono text-xs text-[#9D7B32] font-semibold">03. Headwear</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-[#0B0B0D]">
                  Crowning Caps
                </h2>
                <p className="mt-2 text-sm text-[#57534E] leading-relaxed">
                  Rich Nigerian velvet Fila, bullion wool caps, crisp alabaster snapbacks, and leather-trimmed fedoras in signature colourways.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* CONTACT PAGE */}
        {page === 'contact' && <ContactSection products={products} />}

        {/* ADMIN DASHBOARD */}
        {page === 'admin' && (
          <AdminDashboard products={products} onRefreshProducts={fetchProducts} />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0B0B0D] text-[#FAF8F4] border-t border-[#C6A254]/25">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-3">
            <p className="font-serif text-2xl font-semibold text-[#FAF8F4]">
              Wealth Fashion Boutique
            </p>
            <p className="text-sm text-[#FAF8F4]/70 max-w-sm leading-relaxed">
              Look Rich, Feel Confident. Ibadan destination for luxury clothes, handcrafted footwear, and signature caps for men and women.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2 text-sm">
            <p className="text-xs uppercase tracking-widest text-[#C6A254] font-semibold">
              Navigation
            </p>
            <div className="flex flex-col gap-1.5 text-[#FAF8F4]/75">
              {navItems.map((item) => (
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

          <div className="md:col-span-4 space-y-2 text-sm text-[#FAF8F4]/75">
            <p className="text-xs uppercase tracking-widest text-[#C6A254] font-semibold">
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
        <div className="border-t border-white/10 py-4 px-6 text-center text-xs text-[#FAF8F4]/50">
          © {new Date().getFullYear()} Wealth Fashion Boutique · Ibadan, Nigeria
        </div>
      </footer>

      {/* ALWAYS-VISIBLE FLOATING ACTION PAIR: WEALTH STYLIST AI + WHATSAPP ORDER */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setStylistOpen(true)}
          aria-label="Open Wealth Stylist AI Fashion Assistant"
          className="h-11 px-4 bg-[#0B0B0D] text-[#C6A254] border border-[#C6A254]/60 shadow-xl hover:bg-[#1C1C22] transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
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
          className="h-11 px-4 bg-[#C6A254] text-[#0B0B0D] shadow-xl hover:bg-[#B89242] transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2 text-xs font-semibold whitespace-nowrap"
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

      <OrderModal
        product={orderModalState.product}
        initialOption={orderModalState.option}
        onClose={() => setOrderModalState({ product: null, option: '' })}
      />
    </div>
  );
}
