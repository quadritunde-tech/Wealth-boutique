import { useEffect, useState } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { Product } from '../types.ts';
import { formatNaira } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductQuickViewModalProps {
  product: Product | null;
  initialOption: string;
  onClose: () => void;
  onAddToCart: (product: Product, selectedOption: string) => void;
  onOrderNow: (product: Product, selectedOption: string) => void;
}

export function ProductQuickViewModal({
  product,
  initialOption,
  onClose,
  onAddToCart,
  onOrderNow,
}: ProductQuickViewModalProps) {
  const [selectedOption, setSelectedOption] = useState(initialOption);

  useEffect(() => {
    if (product) {
      setSelectedOption(initialOption || product.options[0] || 'Standard');
    }
  }, [product, initialOption]);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
    >
      <div className="relative w-full max-w-4xl bg-[#FAF8F4] border border-[#DED7C8] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[92vh]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product view"
          className="absolute top-4 right-4 z-10 h-9 w-9 flex items-center justify-center bg-[#0B0B0D]/80 text-[#FAF8F4] hover:bg-[#0B0B0D] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left: Studio Photography */}
        <div className="md:col-span-7 bg-[#EFECE4] aspect-[4/3] md:aspect-auto md:min-h-[440px]">
          <ResilientImage
            src={product.image}
            alt={product.name}
            fallbackTitle={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="md:col-span-5 p-7 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs text-[#6B665C] uppercase tracking-widest">
              <span>{product.category}</span>
              <span aria-hidden="true">·</span>
              <span>{product.gender}</span>
            </div>

            <div>
              <h2
                id="quick-view-title"
                className="font-serif text-3xl font-semibold text-[#0B0B0D] leading-tight"
              >
                {product.name}
              </h2>
              <p className="mt-2 font-mono text-xl font-medium text-[#9D7B32] tabular-nums">
                {formatNaira(product.price)}
              </p>
            </div>

            <p className="text-sm text-[#44403C] leading-relaxed">
              {product.description}
            </p>

            <div className="pt-4 border-t border-[#E5DFD3]">
              <div className="flex items-center justify-between mb-2.5 text-xs">
                <span className="uppercase tracking-wider font-semibold text-[#0B0B0D]">
                  Select {product.optionLabel}
                </span>
                <span className="text-[#9D7B32] font-medium">{selectedOption}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.options.map((opt) => {
                  const active = selectedOption === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`min-h-[38px] px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
          </div>

          <div className="pt-6 mt-6 border-t border-[#E5DFD3] space-y-2.5">
            <button
              type="button"
              onClick={() => {
                onOrderNow(product, selectedOption);
                onClose();
              }}
              className="w-full min-h-[46px] px-5 py-3 text-xs font-semibold uppercase tracking-widest bg-[#C6A254] text-[#0B0B0D] hover:bg-[#B89242] transition-colors cursor-pointer"
            >
              Order Now · Direct Concierge
            </button>
            <button
              type="button"
              onClick={() => {
                onAddToCart(product, selectedOption);
                onClose();
              }}
              className="w-full min-h-[46px] px-5 py-3 text-xs font-semibold uppercase tracking-widest bg-[#0B0B0D] text-[#FAF8F4] hover:bg-[#1E1E24] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add to Bag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
