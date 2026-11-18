import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Menu,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import {
  BUSINESS_INFO,
  HERO_IMAGE,
  INITIAL_PRODUCTS,
} from './data/seedCatalog.ts';
import { HomePage } from './pages/HomePage.tsx';
import {
  CartItem,
  PageView,
  Product,
  ProductCategory,
} from './types.ts';
import { buildWhatsAppUrl, formatNaira } from './utils/format.ts';

// Code-split secondary pages, drawers, modals & private admin portal for maximum LCP speed
const ShopPage = lazy(() =>
  import('./pages/ShopPage.tsx').then((m) => ({ default: m.ShopPage }))
);
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage.tsx').then((m) => ({
    default: m.ProductDetailPage,
  }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage.tsx').then((m) => ({ default: m.AboutPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage.tsx').then((m) => ({ default: m.ContactPage }))
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard.tsx').then((m) => ({
    default: m.AdminDashboard,
  }))
);
const CartDrawer = lazy(() =>
  import('./components/CartDrawer.tsx').then((m) => ({ default: m.CartDrawer }))
);
const OrderModal = lazy(() =>
  import('./components/OrderModal.tsx').then((m) => ({ default: m.OrderModal }))
);
const WealthStylistDrawer = lazy(() =>
  import('./components/WealthStylistDrawer.tsx').then((m) => ({
    default: m.WealthStylistDrawer,
  }))
);

const CART_STORAGE_KEY = 'wfb_shopping_cart_v1';
const PRODUCTS_CACHE_KEY = 'wfb_products_cache_v3';

interface AppRoute {
  page: PageView;
  category: 'All' | ProductCategory;
  productId?: string;
}

function parseRoute(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const lower = clean.toLowerCase();

  if (lower === '/admin') {
    return { page: 'admin', category: 'All' };
  }
  if (lower === '/about') {
    return { page: 'about', category: 'All' };
  }
  if (lower === '/contact') {
    return { page: 'contact', category: 'All' };
  }
  if (lower === '/shop') {
    return { page: 'shop', category: 'All' };
  }
  if (lower === '/shop/clothes') {
    return { page: 'shop', category: 'Clothes' };
  }
  if (lower === '/shop/shoes') {
    return { page: 'shop', category: 'Shoes' };
  }
  if (lower === '/shop/caps') {
    return { page: 'shop', category: 'Caps' };
  }
  if (lower.startsWith('/product/')) {
    const id = decodeURIComponent(clean.slice('/product/'.length));
    if (id) {
      return { page: 'product', category: 'All', productId: id };
    }
  }
  return { page: 'home', category: 'All' };
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseRoute(window.location.pathname)
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

  const [cartOpen, setCartOpen] = useState(false);
  const [stylistOpen, setStylistOpen] = useState(false);
  const [orderModalState, setOrderModalState] = useState<{
    product: Product | null;
    option: string;
  }>({ product: null, option: '' });

  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseRoute(window.location.pathname));
      setMobileMenuOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
    }
    setRoute(parseRoute(normalized));
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAnchorNav = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string
  ) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault();
      navigate(path);
    }
  };

  const activeProduct = useMemo(() => {
    if (route.page !== 'product' || !route.productId) return undefined;
    return products.find((p) => p.id === route.productId);
  }, [route, products]);

  // Sync dynamic per-page & per-product SEO tags, OpenGraph, Twitter & Canonical URL
  useEffect(() => {
    let title = 'Wealth Fashion Boutique – Quality Clothes, Shoes & Caps in Ibadan';
    let description =
      'Shop affordable luxury clothes, leather shoes, and clean caps for men and women in Bodija, Ibadan. Order online or on WhatsApp.';
    let robots = 'index, follow';
    let ogImage = window.location.origin + HERO_IMAGE;

    if (route.page === 'shop') {
      if (route.category === 'All') {
        title = 'Shop Clothes, Shoes & Caps – Wealth Fashion Boutique Ibadan';
        description =
          'Browse Agbada, Senator suits, dinner blazers, leather shoes, and Fila caps in Naira. Same-day delivery in Ibadan and fast delivery across Nigeria.';
      } else {
        title = `Shop ${route.category} – Wealth Fashion Boutique Ibadan`;
        description = `Shop our quality ${route.category} collection in Naira at Wealth Fashion Boutique, Bodija, Ibadan. Order online or on WhatsApp.`;
      }
    } else if (route.page === 'product') {
      if (activeProduct) {
        title = `${activeProduct.name} (${formatNaira(activeProduct.price)}) – Wealth Fashion Boutique`;
        description = activeProduct.description;
        ogImage = activeProduct.image.startsWith('http')
          ? activeProduct.image
          : window.location.origin + activeProduct.image;
      } else {
        title = 'Item Not Found – Wealth Fashion Boutique';
        description = 'Browse our available clothes, shoes, and caps in Ibadan.';
      }
    } else if (route.page === 'about') {
      title = 'About Us – Wealth Fashion Boutique Ibadan';
      description =
        'Learn about Wealth Fashion Boutique in Bodija, Ibadan: affordable luxury clothes, shoes, and caps for men and women.';
    } else if (route.page === 'contact') {
      title = 'Contact & Visit Us in Ibadan – Wealth Fashion Boutique';
      description =
        'Visit Plot 14 Awolowo Avenue, Bodija, Ibadan or message us on WhatsApp (+234 904 755 2985) to place an order or ask about sizes.';
    } else if (route.page === 'admin') {
      title = 'Owner Portal – Wealth Fashion Boutique';
      description = 'Private owner management dashboard for Wealth Fashion Boutique.';
      robots = 'noindex, nofollow';
    }

    document.title = title;

    const currentUrl = window.location.origin + window.location.pathname;
    const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', robots);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);
  }, [route, activeProduct]);

  // Inject dynamic Product or ItemList JSON-LD for rich e-commerce search snippets
  useEffect(() => {
    if (route.page === 'admin' || products.length === 0) return;
    const scriptId = 'wfb-catalog-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    if (route.page === 'product' && activeProduct) {
      scriptEl.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: activeProduct.name,
        description: activeProduct.description,
        category: activeProduct.category,
        image: activeProduct.image.startsWith('http')
          ? activeProduct.image
          : window.location.origin + activeProduct.image,
        brand: {
          '@type': 'Brand',
          name: 'Wealth Fashion Boutique',
        },
        offers: {
          '@type': 'Offer',
          url: window.location.origin + `/product/${activeProduct.id}`,
          priceCurrency: 'NGN',
          price: String(activeProduct.price),
          availability: activeProduct.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/PreOrder',
        },
      });
      return;
    }

    const itemList = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Wealth Fashion Boutique Catalogue',
      itemListElement: products.slice(0, 15).map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: window.location.origin + `/product/${p.id}`,
        item: {
          '@type': 'Product',
          name: p.name,
          description: p.description,
          category: p.category,
          image: p.image.startsWith('http')
            ? p.image
            : window.location.origin + p.image,
          brand: {
            '@type': 'Brand',
            name: 'Wealth Fashion Boutique',
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'NGN',
            price: String(p.price),
            availability: p.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/PreOrder',
          },
        },
      })),
    };
    scriptEl.text = JSON.stringify(itemList);
  }, [products, route.page, activeProduct]);

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

  const handleAddToCart = useCallback(
    (product: Product, selectedOption: string) => {
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
    },
    [showToast]
  );

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

  const handleOpenOrderNow = useCallback((product: Product, option: string) => {
    setOrderModalState({ product, option });
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const bestSellers = useMemo(() => {
    const featured = products.filter((p) => p.isBestSeller);
    return (featured.length >= 6 ? featured : products).slice(0, 6);
  }, [products]);

  const categoryPreviews = useMemo(() => {
    const findRep = (cat: ProductCategory, fallbackImg: string) =>
      products.find((p) => p.category === cat)?.image || fallbackImg;
    return [
      {
        index: '01',
        title: 'Clothes' as ProductCategory,
        subtitle: 'Agbada, Senator suits, blazers, kaftans & two-piece sets',
        count: products.filter((p) => p.category === 'Clothes').length,
        image: findRep(
          'Clothes',
          '/src/assets/images/cloth_agbada_black_gold_1794943007631.jpg'
        ),
      },
      {
        index: '02',
        title: 'Shoes' as ProductCategory,
        subtitle: 'Leather dress shoes, suede loafers, sneakers & heels',
        count: products.filter((p) => p.category === 'Shoes').length,
        image: findRep(
          'Shoes',
          '/src/assets/images/shoe_monk_loafers_1794943009993.jpg'
        ),
      },
      {
        index: '03',
        title: 'Caps' as ProductCategory,
        subtitle: 'Velvet Fila caps, wool face caps, snapbacks & fedoras',
        count: products.filter((p) => p.category === 'Caps').length,
        image: findRep(
          'Caps',
          '/src/assets/images/cap_fila_velvet_1794943012304.jpg'
        ),
      },
    ];
  }, [products]);

  // Public storefront navigation strictly excludes Admin
  const publicNavItems: Array<{ label: string; href: string; match: PageView }> = [
    { label: 'Home', href: '/', match: 'home' },
    { label: 'Shop', href: '/shop', match: 'shop' },
    { label: 'About', href: '/about', match: 'about' },
    { label: 'Contact', href: '/contact', match: 'contact' },
  ];

  const anyOverlayOpen =
    cartOpen || stylistOpen || Boolean(orderModalState.product);

  // Dedicated /admin URL View — completely separate from end-user storefront UI
  if (route.page === 'admin') {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#FAF8F4] text-[#0B0B0D]">
        <header className="bg-[#0B0B0D] text-[#FAF8F4] border-b border-[#C6A254]/25">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between gap-4">
            <span className="font-serif text-lg sm:text-xl font-semibold tracking-wide text-[#FAF8F4] whitespace-nowrap truncate">
              Wealth Fashion · Owner Portal
            </span>
            <a
              href="/"
              onClick={(e) => handleAnchorNav(e, '/')}
              className="min-h-[44px] inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-[#C6A254] hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </a>
          </div>
        </header>
        <main className="flex-1">
          <Suspense
            fallback={
              <div className="max-w-7xl mx-auto px-6 py-24 text-center text-sm text-[#6B665C]">
                Loading owner dashboard...
              </div>
            }
          >
            <AdminDashboard products={products} onRefreshProducts={fetchProducts} />
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FAF8F4] text-[#0B0B0D]">
      {/* TOP NAVIGATION BAR — Real Anchor Links, Zero Admin Link */}
      <header className="sticky top-0 z-40 bg-[#0B0B0D]/95 backdrop-blur-md text-[#FAF8F4] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[74px] flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Single-line Wordmark */}
          <a
            href="/"
            onClick={(e) => handleAnchorNav(e, '/')}
            className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#FAF8F4] hover:text-[#C6A254] transition-colors whitespace-nowrap shrink-0"
          >
            Wealth Fashion
          </a>

          {/* Zone 2: Clean single-line page anchor links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-9 text-[11px] uppercase tracking-[0.18em] font-medium text-[#FAF8F4]/75"
          >
            {publicNavItems.map((item) => {
              const active =
                route.page === item.match ||
                (item.match === 'shop' && route.page === 'product');
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleAnchorNav(e, item.href)}
                  className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b ${
                    active
                      ? 'text-[#C6A254] border-[#C6A254]'
                      : 'border-transparent hover:text-white hover:border-[#C6A254]/40'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Shopping Bag + Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="min-h-[42px] px-3.5 sm:px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-semibold bg-[#C6A254] text-[#0B0B0D] hover:bg-[#D4B36A] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="tabular-nums">Bag ({cartCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden h-11 w-11 flex items-center justify-center text-[#FAF8F4] hover:text-[#C6A254] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Nav */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-t border-white/10 bg-[#0B0B0D] px-4 py-3 flex flex-col"
          >
            {publicNavItems.map((item) => {
              const active =
                route.page === item.match ||
                (item.match === 'shop' && route.page === 'product');
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleAnchorNav(e, item.href)}
                  className={`min-h-[46px] flex items-center px-2 text-xs uppercase tracking-[0.18em] font-medium border-b border-white/5 ${
                    active ? 'text-[#C6A254]' : 'text-[#FAF8F4]/85'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="pt-2 pb-1 px-2 flex items-center gap-4 text-[11px] uppercase tracking-[0.15em] text-[#FAF8F4]/60">
              <a
                href="/shop/clothes"
                onClick={(e) => handleAnchorNav(e, '/shop/clothes')}
                className="py-2 hover:text-[#C6A254]"
              >
                Clothes
              </a>
              <a
                href="/shop/shoes"
                onClick={(e) => handleAnchorNav(e, '/shop/shoes')}
                className="py-2 hover:text-[#C6A254]"
              >
                Shoes
              </a>
              <a
                href="/shop/caps"
                onClick={(e) => handleAnchorNav(e, '/shop/caps')}
                className="py-2 hover:text-[#C6A254]"
              >
                Caps
              </a>
            </div>
          </nav>
        )}
      </header>

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-20 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0B0B0D] text-[#C6A254] border border-[#C6A254]/40 shadow-xl text-xs font-medium max-w-[calc(100vw-2rem)]"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* MULTI-PAGE ROUTE VIEWPORT */}
      <main className="flex-1">
        {route.page === 'home' && (
          <HomePage
            products={products}
            bestSellers={bestSellers}
            categoryPreviews={categoryPreviews}
            onNavigate={navigate}
            onOpenStylist={() => setStylistOpen(true)}
            onAddToCart={handleAddToCart}
            onOrderNow={handleOpenOrderNow}
          />
        )}

        {route.page !== 'home' && (
          <Suspense
            fallback={
              <div className="max-w-7xl mx-auto px-6 py-24 text-center text-sm text-[#6B665C]">
                Loading page...
              </div>
            }
          >
            {route.page === 'shop' && (
              <ShopPage
                products={products}
                selectedCategory={route.category}
                onSelectCategory={(cat) =>
                  navigate(cat === 'All' ? '/shop' : `/shop/${cat.toLowerCase()}`)
                }
                onNavigate={navigate}
                onOpenStylist={() => setStylistOpen(true)}
                onAddToCart={handleAddToCart}
                onOrderNow={handleOpenOrderNow}
              />
            )}

            {route.page === 'product' && (
              <ProductDetailPage
                product={activeProduct}
                allProducts={products}
                onNavigate={navigate}
                onAddToCart={handleAddToCart}
                onOrderNow={handleOpenOrderNow}
              />
            )}

            {route.page === 'about' && <AboutPage onNavigate={navigate} />}

            {route.page === 'contact' && (
              <ContactPage products={products} onNavigate={navigate} />
            )}
          </Suspense>
        )}
      </main>

      {/* FOOTER — Public Page & Category Links Only, Zero Admin Exposure */}
      <footer className="bg-[#0B0B0D] text-[#FAF8F4] border-t border-[#C6A254]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-14 grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
          <div className="md:col-span-4 space-y-3">
            <p className="font-serif text-2xl sm:text-3xl font-medium text-[#FAF8F4]">
              Wealth Fashion Boutique
            </p>
            <p className="text-sm text-[#FAF8F4]/68 max-w-sm leading-relaxed">
              Look Rich, Feel Confident. Your Ibadan shop for quality clothes, leather shoes, and clean caps for men and women.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C6A254] font-semibold">
              Pages
            </p>
            <div className="flex flex-col gap-1 text-[#FAF8F4]/75">
              {publicNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleAnchorNav(e, item.href)}
                  className="min-h-[38px] flex items-center hover:text-[#C6A254] transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C6A254] font-semibold">
              Categories
            </p>
            <div className="flex flex-col gap-1 text-[#FAF8F4]/75">
              <a
                href="/shop/clothes"
                onClick={(e) => handleAnchorNav(e, '/shop/clothes')}
                className="min-h-[38px] flex items-center hover:text-[#C6A254] transition-colors"
              >
                Clothes
              </a>
              <a
                href="/shop/shoes"
                onClick={(e) => handleAnchorNav(e, '/shop/shoes')}
                className="min-h-[38px] flex items-center hover:text-[#C6A254] transition-colors"
              >
                Shoes
              </a>
              <a
                href="/shop/caps"
                onClick={(e) => handleAnchorNav(e, '/shop/caps')}
                className="min-h-[38px] flex items-center hover:text-[#C6A254] transition-colors"
              >
                Caps
              </a>
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
                href={buildWhatsAppUrl(
                  'Hello Wealth Fashion Boutique, I would like to place an order.'
                )}
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
        <div className="border-t border-white/10 pt-5 pb-20 sm:pb-5 px-6 text-center text-xs text-[#FAF8F4]/45">
          © {new Date().getFullYear()} Wealth Fashion Boutique · Ibadan, Nigeria
        </div>
      </footer>

      {/* ALWAYS-VISIBLE FLOATING ACTION PAIR */}
      {!anyOverlayOpen && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStylistOpen(true)}
            aria-label="Open Wealth Stylist AI Fashion Assistant"
            className="h-11 px-3.5 sm:px-4 bg-[#0B0B0D] text-[#C6A254] border border-[#C6A254]/50 shadow-2xl hover:bg-[#1C1C22] active:scale-[0.98] transition-all inline-flex items-center gap-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
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
            className="h-11 px-3.5 sm:px-4 bg-[#C6A254] text-[#0B0B0D] shadow-2xl hover:bg-[#D4B36A] active:scale-[0.98] transition-all inline-flex items-center gap-2 text-xs font-semibold whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">WhatsApp Order</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      )}

      {/* LAZY-LOADED DRAWERS & MODALS */}
      <Suspense fallback={null}>
        {cartOpen && (
          <CartDrawer
            isOpen={cartOpen}
            items={cart}
            onClose={() => setCartOpen(false)}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
          />
        )}

        {stylistOpen && (
          <WealthStylistDrawer
            isOpen={stylistOpen}
            onClose={() => setStylistOpen(false)}
            onAddToCart={handleAddToCart}
            onOrderNow={(prod, opt) => {
              setStylistOpen(false);
              handleOpenOrderNow(prod, opt);
            }}
          />
        )}

        {orderModalState.product && (
          <OrderModal
            product={orderModalState.product}
            initialOption={orderModalState.option}
            onClose={() => setOrderModalState({ product: null, option: '' })}
          />
        )}
      </Suspense>
    </div>
  );
}
