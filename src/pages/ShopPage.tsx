import { useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductCard } from '../components/ProductCard.tsx';
import { GenderAudience, Product, ProductCategory } from '../types.ts';

interface ShopPageProps {
  products: Product[];
  selectedCategory: 'All' | ProductCategory;
  onSelectCategory: (cat: 'All' | ProductCategory) => void;
  onNavigate: (path: string) => void;
  onOpenStylist: () => void;
  onAddToCart: (product: Product, option: string) => void;
  onOrderNow: (product: Product, option: string) => void;
}

export function ShopPage({
  products,
  selectedCategory,
  onSelectCategory,
  onNavigate,
  onOpenStylist,
  onAddToCart,
  onOrderNow,
}: ShopPageProps) {
  const [selectedGender, setSelectedGender] = useState<'All' | GenderAudience>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const base = products.filter((p) => {
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

    if (sortBy === 'price-asc') {
      return [...base].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return [...base].sort((a, b) => b.price - a.price);
    }
    return base;
  }, [products, selectedCategory, selectedGender, searchQuery, sortBy]);

  const handleCategoryClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    cat: 'All' | ProductCategory
  ) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault();
      onSelectCategory(cat);
      onNavigate(cat === 'All' ? '/shop' : `/shop/${cat.toLowerCase()}`);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 lg:py-16 space-y-8 sm:space-y-10"
    >
      {/* Breadcrumb & Page Title */}
      <div className="space-y-4 pb-6 sm:pb-8 border-b border-[#E0D9CA]">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#6B665C]">
          <a
            href="/"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
                e.preventDefault();
                onNavigate('/');
              }
            }}
            className="hover:text-[#0B0B0D]"
          >
            Home
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-[#0B0B0D] font-medium">
            {selectedCategory === 'All' ? 'Shop' : `Shop · ${selectedCategory}`}
          </span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
              Wealth Fashion Shop
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-5xl font-medium text-[#0B0B0D]">
              {selectedCategory === 'All'
                ? 'All Clothes, Shoes & Caps'
                : `${selectedCategory} Collection`}
            </h1>
          </div>
          <button
            type="button"
            onClick={onOpenStylist}
            className="min-h-[44px] px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] inline-flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Wealth Stylist</span>
          </button>
        </div>
      </div>

      {/* Category Anchor Links + Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E0D9CA]">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {(['All', 'Clothes', 'Shoes', 'Caps'] as const).map((cat) => {
            const active = selectedCategory === cat;
            const count =
              cat === 'All'
                ? products.length
                : products.filter((p) => p.category === cat).length;
            const href = cat === 'All' ? '/shop' : `/shop/${cat.toLowerCase()}`;
            return (
              <a
                key={cat}
                href={href}
                onClick={(e) => handleCategoryClick(e, cat)}
                className={`min-h-[42px] inline-flex items-center px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#0B0B0D] text-[#C6A254]'
                    : 'bg-transparent text-[#57534E] border border-[#DCD5C7] hover:border-[#0B0B0D] hover:text-[#0B0B0D]'
                }`}
              >
                {cat} ({count})
              </a>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedGender}
            onChange={(e) =>
              setSelectedGender(e.target.value as 'All' | GenderAudience)
            }
            aria-label="Filter by Men or Women"
            className="min-h-[44px] px-3 py-2 text-base sm:text-xs font-medium bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
          >
            <option value="All">Men &amp; Women</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Unisex">Unisex</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
            }
            aria-label="Sort items"
            className="min-h-[44px] px-3 py-2 text-base sm:text-xs font-medium bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search
              className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search clothes, shoes, caps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-9 pr-3 py-2 text-base sm:text-xs bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center space-y-3 border-b border-[#E0D9CA]">
          <p className="font-serif text-3xl text-[#0B0B0D]">
            No items matched your search
          </p>
          <p className="text-sm text-[#57534E]">
            Try another word or clear your filters to see all items.
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectCategory('All');
              setSelectedGender('All');
              setSortBy('featured');
              setSearchQuery('');
              onNavigate('/shop');
            }}
            className="mt-2 min-h-[44px] px-6 py-2.5 text-xs uppercase tracking-widest font-semibold bg-[#0B0B0D] text-[#C6A254] cursor-pointer"
          >
            Show All Items
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 sm:gap-y-12">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onOrderNow={onOrderNow}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}
