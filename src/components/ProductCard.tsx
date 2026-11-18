import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product } from '../types.ts';
import { formatNaira } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedOption: string) => void;
  onOrderNow: (product: Product, selectedOption: string) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  onOrderNow,
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

  const handleAdd = () => {
    onAddToCart(product, selectedOption);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <article className="group flex flex-col bg-white border border-[#E5DFD3] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-14px_rgba(11,11,13,0.18)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3EFE6]">
        <ResilientImage
          src={product.image}
          alt={product.name}
          fallbackTitle={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Clean unboxed metadata row */}
        <div className="flex items-center justify-between gap-2 text-xs text-[#6B665C]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="uppercase tracking-wider">{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>{product.gender}</span>
          </div>
          {product.isBestSeller && (
            <span className="text-[11px] font-medium text-[#9D7B32] whitespace-nowrap shrink-0">
              Best Seller
            </span>
          )}
        </div>

        <h3 className="mt-2 font-sans text-base font-semibold text-[#0B0B0D] leading-snug line-clamp-1">
          {product.name}
        </h3>

        <p className="mt-1.5 text-sm text-[#57534E] leading-relaxed line-clamp-2">
          {product.description}
        </p>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-mono text-[15px] font-medium text-[#0B0B0D] tabular-nums">
            {formatNaira(product.price)}
          </span>
          <span className="text-xs text-[#6B665C]">
            {product.inStock ? 'In Stock' : 'Made to Order'}
          </span>
        </div>

        {/* Size or Colour Selector */}
        <div className="mt-4 pt-4 border-t border-[#EFEAE0]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#44403C]">
              Select {product.optionLabel}
            </span>
            <span className="text-xs text-[#9D7B32] font-medium truncate max-w-[130px]">
              {selectedOption}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {product.options.map((opt) => {
              const active = selectedOption === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  className={`min-h-[34px] px-2.5 py-1 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A254] ${
                    active
                      ? 'bg-[#0B0B0D] text-[#FAF8F4] border-[#0B0B0D]'
                      : 'bg-[#FAF8F4] text-[#292524] border-[#DCD5C7] hover:border-[#0B0B0D]'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onOrderNow(product, selectedOption)}
            className="min-h-[42px] px-3 py-2 text-xs font-semibold tracking-wide bg-[#C6A254] text-[#0B0B0D] hover:bg-[#B89242] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B0D]"
          >
            Order Now
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="min-h-[42px] px-3 py-2 text-xs font-semibold tracking-wide bg-[#0B0B0D] text-[#FAF8F4] hover:bg-[#232329] transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A254]"
          >
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{justAdded ? 'Added' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
