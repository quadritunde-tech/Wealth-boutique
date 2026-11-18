import { useEffect, useState } from 'react';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { Product } from '../types.ts';
import { formatNaira } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedOption: string) => void;
  onOrderNow: (product: Product, selectedOption: string) => void;
  onNavigate: (path: string) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  onOrderNow,
  onNavigate,
}: ProductCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>(
    product.options[0] || 'Standard'
  );
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (product.options.length > 0 && !product.options.includes(selectedOption)) {
      setSelectedOption(product.options[0]);
    }
  }, [product.options, selectedOption]);

  const productHref = `/product/${product.id}`;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault();
      onNavigate(productHref);
    }
  };

  const handleAdd = () => {
    onAddToCart(product, selectedOption);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <article className="group flex flex-col">
      {/* Studio Image Frame — Links to dedicated Product Detail Page */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFECE4]">
        <a
          href={productHref}
          onClick={handleLinkClick}
          aria-label={`View ${product.name} details`}
          className="block w-full h-full"
        >
          <ResilientImage
            src={product.image}
            alt={product.name}
            fallbackTitle={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-medium text-[#FAF8F4] opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <span>View Item</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#C6A254]" aria-hidden="true" />
          </span>
        </a>
      </div>

      {/* Editorial Metadata & Controls */}
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-widest text-[#6B665C]">
          <div className="flex items-center gap-1.5 truncate">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>{product.gender}</span>
          </div>
          {product.isBestSeller && (
            <span className="text-[#9D7B32] font-semibold whitespace-nowrap shrink-0">
              Best Seller
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <a
            href={productHref}
            onClick={handleLinkClick}
            className="text-left font-serif text-xl font-semibold text-[#0B0B0D] leading-snug hover:text-[#9D7B32] transition-colors line-clamp-1"
          >
            {product.name}
          </a>
          <span className="font-mono text-sm font-medium text-[#0B0B0D] tabular-nums shrink-0">
            {formatNaira(product.price)}
          </span>
        </div>

        {/* Hairline Size / Colour Selector */}
        <div className="mt-3 flex items-center justify-between gap-2 pb-3 border-b border-[#E5DFD3]">
          <span className="text-[11px] uppercase tracking-wider text-[#78716C] shrink-0">
            {product.optionLabel}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {product.options.map((opt) => {
              const active = selectedOption === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  className={`min-h-[36px] sm:min-h-[30px] px-2.5 py-1 text-xs sm:text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    active
                      ? 'text-[#0B0B0D] border-[#C6A254] font-semibold'
                      : 'text-[#78716C] border-transparent hover:text-[#0B0B0D]'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Pair */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onOrderNow(product, selectedOption)}
            className="min-h-[44px] px-3 py-2 text-[11px] font-semibold uppercase tracking-widest bg-[#C6A254] text-[#0B0B0D] hover:bg-[#B89242] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B0D]"
          >
            Order Now
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="min-h-[44px] px-3 py-2 text-[11px] font-semibold uppercase tracking-widest bg-[#0B0B0D] text-[#FAF8F4] hover:bg-[#232329] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A254]"
          >
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{justAdded ? 'Added' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
