import { ArrowRight, Instagram, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductCard } from '../components/ProductCard.tsx';
import { ResilientImage } from '../components/ResilientImage.tsx';
import { BUSINESS_INFO, HERO_IMAGE, TESTIMONIALS } from '../data/seedCatalog.ts';
import { Product, ProductCategory } from '../types.ts';

interface HomePageProps {
  products: Product[];
  bestSellers: Product[];
  categoryPreviews: Array<{
    index: string;
    title: ProductCategory;
    subtitle: string;
    count: number;
    image: string;
  }>;
  onNavigate: (path: string) => void;
  onOpenStylist: () => void;
  onAddToCart: (product: Product, option: string) => void;
  onOrderNow: (product: Product, option: string) => void;
}

export function HomePage({
  products,
  bestSellers,
  categoryPreviews,
  onNavigate,
  onOpenStylist,
  onAddToCart,
  onOrderNow,
}: HomePageProps) {
  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <>
      {/* HERO SECTION */}
      <section className="relative bg-[#0B0B0D] text-[#FAF8F4] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-10 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[460px] lg:min-h-[620px]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:col-span-5 flex flex-col justify-center py-6 sm:py-8 lg:py-20 lg:pr-10 z-10 order-2 lg:order-1"
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#C6A254] font-semibold">
                Bodija, Ibadan · Men &amp; Women
              </p>
              <h1 className="mt-3 sm:mt-4 font-serif text-[clamp(2.35rem,6vw,4.75rem)] font-medium leading-[1.04] tracking-tight text-balance">
                Look Rich,{' '}
                <span className="italic text-[#D8B973] font-normal">
                  Feel Confident
                </span>
              </h1>
              <p className="mt-4 sm:mt-6 text-sm sm:text-[15px] text-[#FAF8F4]/75 leading-relaxed max-w-md">
                Quality black-and-gold Agbada, Senator suits, Italian leather shoes, and clean caps for men and women—ready in Bodija, Ibadan or delivered anywhere in Nigeria.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
                <a
                  href="/shop"
                  onClick={(e) => handleAnchor(e, '/shop')}
                  className="min-h-[46px] px-7 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold bg-[#C6A254] text-[#0B0B0D] hover:bg-[#D4B36A] active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2.5 whitespace-nowrap"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={onOpenStylist}
                  className="min-h-[46px] px-5 py-3 text-[11px] uppercase tracking-[0.16em] font-medium text-[#FAF8F4]/90 border border-[#C6A254]/35 sm:border-0 sm:border-b sm:border-[#C6A254]/50 hover:text-[#C6A254] hover:border-[#C6A254] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C6A254]" />
                  <span>Ask Wealth Stylist</span>
                </button>
              </div>
            </motion.div>

            <div className="lg:col-span-7 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:min-h-[620px] order-1 lg:order-2">
              <ResilientImage
                src={HERO_IMAGE}
                alt="Wealth Fashion Boutique Ibadan black and gold luxury outfits"
                priority
                width={1280}
                height={720}
                className="w-full h-full object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none hidden lg:block absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-[#0B0B0D] to-transparent"
              />
            </div>
          </div>
        </div>

        {/* 4-Column Store Highlights Strip */}
        <div className="border-t border-white/10 bg-[#101014]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:divide-x lg:divide-white/10">
            <div className="lg:pr-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#C6A254]">
                Visit Our Shop
              </p>
              <p className="mt-1 text-xs text-[#FAF8F4]/75">
                Awolowo Avenue, Bodija, Ibadan
              </p>
            </div>
            <div className="lg:px-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#C6A254]">
                What We Sell
              </p>
              <p className="mt-1 text-xs text-[#FAF8F4]/75">
                Clothes, Shoes &amp; Caps
              </p>
            </div>
            <div className="lg:px-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#C6A254]">
                Fast Delivery
              </p>
              <p className="mt-1 text-xs text-[#FAF8F4]/75">
                Same-Day in Ibadan &amp; Nationwide
              </p>
            </div>
            <div className="lg:pl-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#C6A254]">
                Order on WhatsApp
              </p>
              <p className="mt-1 text-xs text-[#FAF8F4]/75 font-mono">
                {BUSINESS_INFO.whatsappDisplay}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 sm:pb-8 border-b border-[#E0D9CA]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
              Shop By Category
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#0B0B0D]">
              Clothes, Shoes &amp; Caps
            </h2>
          </div>
          <a
            href="/shop"
            onClick={(e) => handleAnchor(e, '/shop')}
            className="min-h-[40px] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B0B0D] hover:text-[#9D7B32] inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <span>See All {products.length} Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* Clothes */}
          <a
            href={`/shop/${categoryPreviews[0].title.toLowerCase()}`}
            onClick={(e) =>
              handleAnchor(e, `/shop/${categoryPreviews[0].title.toLowerCase()}`)
            }
            className="group lg:col-span-6 relative aspect-[4/3] lg:aspect-auto lg:min-h-[460px] overflow-hidden bg-[#151519] text-left block"
          >
            <ResilientImage
              src={categoryPreviews[0].image}
              alt="Clothes at Wealth Fashion Boutique"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex items-end justify-between gap-4 text-[#FAF8F4]">
              <div>
                <p className="font-serif italic text-sm text-[#C6A254]">
                  {categoryPreviews[0].index} · {categoryPreviews[0].count} Items
                </p>
                <h3 className="mt-1 font-serif text-2xl sm:text-3xl font-medium">
                  {categoryPreviews[0].title}
                </h3>
                <p className="mt-1 text-xs text-[#FAF8F4]/75 max-w-sm">
                  {categoryPreviews[0].subtitle}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-[#C6A254] shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </a>

          {/* Shoes & Caps */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5 sm:gap-6">
            {categoryPreviews.slice(1).map((cat) => {
              const catPath = `/shop/${cat.title.toLowerCase()}`;
              return (
                <a
                  key={cat.title}
                  href={catPath}
                  onClick={(e) => handleAnchor(e, catPath)}
                  className="group relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[218px] overflow-hidden bg-[#151519] text-left block"
                >
                  <ResilientImage
                    src={cat.image}
                    alt={`${cat.title} at Wealth Fashion Boutique`}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-end justify-between gap-4 text-[#FAF8F4]">
                    <div>
                      <p className="font-serif italic text-sm text-[#C6A254]">
                        {cat.index} · {cat.count} Items
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
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 lg:pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 sm:pb-8 border-b border-[#E0D9CA]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
              Customer Favourites
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#0B0B0D]">
              Best Sellers
            </h2>
          </div>
          <a
            href="/shop"
            onClick={(e) => handleAnchor(e, '/shop')}
            className="min-h-[44px] inline-flex items-center px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            See All Products
          </a>
        </div>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 sm:gap-y-12">
          {bestSellers.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onOrderNow={onOrderNow}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>

      {/* WHY SHOP WITH US */}
      <section className="bg-[#0B0B0D] text-[#FAF8F4] py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-28">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#C6A254] font-semibold">
              Why Shop With Us
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.08] text-balance">
              Rich Look,{' '}
              <span className="italic text-[#D8B973] font-normal">
                Fair Price
              </span>
            </h2>
            <p className="text-sm text-[#FAF8F4]/70 leading-relaxed max-w-md">
              Everything in our Bodija, Ibadan shop is made to look classy, fit properly, and last long without costing too much.
            </p>
          </div>

          <div className="lg:col-span-7 divide-y divide-white/12 border-t border-b border-white/12">
            {[
              {
                num: '01',
                title: 'Neat Tailoring & Strong Fabrics',
                body: 'Our Agbada, Senator suits, blazers, and kaftans are sewn with clean stitches, breathable fabrics, and neat gold details.',
              },
              {
                num: '02',
                title: 'Luxury You Can Afford',
                body: 'Clear prices in Naira for both men and women—clothes in sizes S to XL, shoes in sizes 40 to 45, and caps in sharp colours.',
              },
              {
                num: '03',
                title: 'Fast Ibadan & Nationwide Delivery',
                body: 'Same-day delivery around Bodija, Jericho, Oluyole, and Akobo, plus fast 2–3 day delivery to Lagos, Abuja, and every state.',
              },
              {
                num: '04',
                title: 'Free AI Stylist + WhatsApp Support',
                body: 'Not sure what to wear? Chat with Wealth Stylist for 3 instant outfit ideas, or message us on +234 904 755 2985.',
              },
            ].map((pillar) => (
              <div
                key={pillar.num}
                className="py-6 sm:py-7 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline"
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

      {/* CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 sm:pb-8 border-b border-[#E0D9CA]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
              Customer Reviews
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#0B0B0D]">
              What Our Customers Say
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

        <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#E0D9CA]">
          {TESTIMONIALS.map((t, idx) => (
            <blockquote
              key={t.name}
              className={`flex flex-col justify-between gap-5 pt-6 first:pt-0 md:pt-0 ${
                idx === 0 ? 'md:pr-8' : idx === 1 ? 'md:px-8' : 'md:pl-8'
              }`}
            >
              <p className="font-serif text-xl italic text-[#1C1917] leading-relaxed">
                “{t.quote}”
              </p>
              <footer>
                <p className="text-sm font-semibold text-[#0B0B0D]">{t.name}</p>
                <p className="text-xs text-[#6B665C]">{t.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </>
  );
}
