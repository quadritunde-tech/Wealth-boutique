import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, MessageCircle, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductCard } from '../components/ProductCard.tsx';
import { ResilientImage } from '../components/ResilientImage.tsx';
import { Product } from '../types.ts';
import { buildWhatsAppUrl, formatNaira } from '../utils/format.ts';

interface ProductDetailPageProps {
  product: Product | undefined;
  allProducts: Product[];
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product, option: string) => void;
  onOrderNow: (product: Product, option: string) => void;
}

export function ProductDetailPage({
  product,
  allProducts,
  onNavigate,
  onAddToCart,
  onOrderNow,
}: ProductDetailPageProps) {
  const [selectedOption, setSelectedOption] = useState(
    product?.options[0] || 'Standard'
  );
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    if (product?.options.length) {
      setSelectedOption(product.options[0]);
    }
    setAddedFeedback(false);
  }, [product]);

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  const relatedPieces = useMemo(() => {
    if (!product) return [];
    const others = allProducts.filter((p) => p.id !== product.id);
    const crossCategory = others.filter((p) => p.category !== product.category);
    const sameCategory = others.filter((p) => p.category === product.category);
    return [...crossCategory.slice(0, 2), ...sameCategory.slice(0, 1)].slice(0, 3);
  }, [product, allProducts]);

  if (!product) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center space-y-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
          Item Not Found
        </p>
        <h1 className="font-serif text-4xl font-medium text-[#0B0B0D]">
          Sorry, we couldn’t find this item
        </h1>
        <p className="text-sm text-[#57534E]">
          It may be out of stock or removed. Check out our available clothes, shoes, and caps below.
        </p>
        <a
          href="/shop"
          onClick={(e) => handleLink(e, '/shop')}
          className="inline-flex items-center gap-2 min-h-[44px] px-7 py-3 text-xs uppercase tracking-[0.18em] font-semibold bg-[#0B0B0D] text-[#C6A254]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shop</span>
        </a>
      </section>
    );
  }

  const categoryPath = `/shop/${product.category.toLowerCase()}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-16 sm:space-y-20"
    >
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#6B665C] pb-4 border-b border-[#E0D9CA]">
        <a href="/" onClick={(e) => handleLink(e, '/')} className="hover:text-[#0B0B0D]">
          Home
        </a>
        <span aria-hidden="true">/</span>
        <a href="/shop" onClick={(e) => handleLink(e, '/shop')} className="hover:text-[#0B0B0D]">
          Shop
        </a>
        <span aria-hidden="true">/</span>
        <a
          href={categoryPath}
          onClick={(e) => handleLink(e, categoryPath)}
          className="hover:text-[#0B0B0D]"
        >
          {product.category}
        </a>
        <span aria-hidden="true">/</span>
        <span className="text-[#0B0B0D] font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Contiguous Product Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left: Studio Photography */}
        <div className="lg:col-span-7 bg-[#EFECE4] aspect-[4/3] overflow-hidden">
          <ResilientImage
            src={product.image}
            alt={product.name}
            fallbackTitle={product.name}
            priority
            width={1200}
            height={900}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="space-y-3 pb-5 border-b border-[#E0D9CA]">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[#6B665C]">
              <span>
                {product.category} · {product.gender}
              </span>
              {product.isBestSeller && (
                <span className="text-[#9D7B32] font-semibold">Best Seller</span>
              )}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#0B0B0D] leading-tight">
              {product.name}
            </h1>
            <p className="font-mono text-2xl font-semibold text-[#9D7B32] tabular-nums">
              {formatNaira(product.price)}
            </p>
          </div>

          <p className="text-sm sm:text-base text-[#44403C] leading-relaxed">
            {product.description}
          </p>

          {/* Size / Colour Selector */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-[0.16em] font-semibold text-[#0B0B0D]">
                Select {product.optionLabel}
              </span>
              <span className="font-medium text-[#9D7B32]">{selectedOption}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.options.map((opt) => {
                const active = selectedOption === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedOption(opt)}
                    className={`min-h-[44px] min-w-[52px] px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#0B0B0D] text-[#C6A254]'
                        : 'bg-white border border-[#DCD5C7] text-[#292524] hover:border-[#0B0B0D]'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Purchase CTAs */}
          <div className="pt-3 space-y-3">
            <button
              type="button"
              onClick={() => onOrderNow(product, selectedOption)}
              className="w-full min-h-[48px] px-6 py-3 text-xs uppercase tracking-[0.18em] font-semibold bg-[#C6A254] text-[#0B0B0D] hover:bg-[#D4B36A] active:scale-[0.99] transition-all cursor-pointer"
            >
              Order Now
            </button>

            <button
              type="button"
              onClick={() => {
                onAddToCart(product, selectedOption);
                setAddedFeedback(true);
                window.setTimeout(() => setAddedFeedback(false), 1600);
              }}
              className="w-full min-h-[48px] px-6 py-3 text-xs uppercase tracking-[0.18em] font-semibold bg-[#0B0B0D] text-[#FAF8F4] hover:bg-[#1E1E24] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {addedFeedback ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#C6A254]" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <a
              href={buildWhatsAppUrl(
                `Hello Wealth Fashion Boutique! I want to ask about ${product.name} (${product.optionLabel}: ${selectedOption}) priced at ${formatNaira(product.price)}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] px-6 py-2.5 text-xs font-medium border border-[#DCD5C7] text-[#0B0B0D] hover:border-[#0B0B0D] transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-[#9D7B32]" />
              <span>Ask About Size or Price on WhatsApp</span>
            </a>
          </div>

          {/* Delivery & Quality Guarantees */}
          <div className="pt-5 border-t border-[#E0D9CA] space-y-3 text-xs text-[#57534E]">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-[#9D7B32] shrink-0" />
              <span>Same-day delivery in Bodija, Jericho, Oluyole &amp; Akobo, Ibadan.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#9D7B32] shrink-0" />
              <span>Checked carefully at our Ibadan shop before we send it out.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Category Recommendations */}
      {relatedPieces.length > 0 && (
        <div className="pt-12 border-t border-[#E0D9CA] space-y-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
                Goes Well With This
              </p>
              <h2 className="mt-1 font-serif text-3xl font-medium text-[#0B0B0D]">
                You May Also Like
              </h2>
            </div>
            <a
              href="/shop"
              onClick={(e) => handleLink(e, '/shop')}
              className="text-xs uppercase tracking-[0.16em] font-semibold text-[#0B0B0D] hover:text-[#9D7B32]"
            >
              See All
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {relatedPieces.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onAddToCart={onAddToCart}
                onOrderNow={onOrderNow}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}
