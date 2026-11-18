import { motion } from 'motion/react';
import { ResilientImage } from '../components/ResilientImage.tsx';
import { ATELIER_IMAGE } from '../data/seedCatalog.ts';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24 space-y-16 sm:space-y-20"
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#6B665C] pb-4 border-b border-[#E0D9CA]">
        <a href="/" onClick={(e) => handleLink(e, '/')} className="hover:text-[#0B0B0D]">
          Home
        </a>
        <span aria-hidden="true">/</span>
        <span className="text-[#0B0B0D] font-medium">About Us</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-6 space-y-5 sm:space-y-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
            About Us · Ibadan, Nigeria
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium text-[#0B0B0D] leading-[1.08] text-balance">
            Affordable Luxury Fashion for Everyone
          </h1>
          <p className="text-base text-[#44403C] leading-relaxed">
            Started in Ibadan, <strong>Wealth Fashion Boutique</strong> was built on one clear promise: everyone deserves to dress rich, feel confident, and turn heads without paying crazy prices.
          </p>
          <p className="text-base text-[#44403C] leading-relaxed">
            From sharp black-and-gold Agbada and clean Senator wear to Italian leather shoes and classic velvet Fila caps, every item in our Bodija shop is picked for men and women who love clean, classy style.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row flex-wrap gap-3">
            <a
              href="/shop"
              onClick={(e) => handleLink(e, '/shop')}
              className="min-h-[46px] inline-flex items-center justify-center px-7 py-2.5 text-xs uppercase tracking-[0.18em] font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24]"
            >
              Shop Now
            </a>
            <a
              href="/contact"
              onClick={(e) => handleLink(e, '/contact')}
              className="min-h-[46px] inline-flex items-center justify-center px-7 py-2.5 text-xs uppercase tracking-[0.18em] font-medium border border-[#0B0B0D] text-[#0B0B0D] hover:bg-white"
            >
              Contact Us
            </a>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="aspect-[4/3] overflow-hidden bg-[#151519]">
            <ResilientImage
              src={ATELIER_IMAGE}
              alt="Wealth Fashion Boutique shop in Bodija Ibadan"
              priority
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#E0D9CA] pt-12 border-t border-[#E0D9CA]">
        <div className="pt-6 first:pt-0 md:pt-0 md:pr-8">
          <p className="font-serif italic text-xl text-[#9D7B32]">01. Clothes</p>
          <h2 className="mt-2 font-serif text-3xl font-medium text-[#0B0B0D]">
            Men &amp; Women Wear
          </h2>
          <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
            Available in sizes S, M, L, and XL for weddings, church, office, and weekend parties.
          </p>
        </div>
        <div className="pt-6 md:pt-0 md:px-8">
          <p className="font-serif italic text-xl text-[#9D7B32]">02. Shoes</p>
          <h2 className="mt-2 font-serif text-3xl font-medium text-[#0B0B0D]">
            Quality Footwear
          </h2>
          <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
            Sizes 40 to 45 including leather dress shoes, suede loafers, sneakers, Chelsea boots, and women’s heels.
          </p>
        </div>
        <div className="pt-6 md:pt-0 md:pl-8">
          <p className="font-serif italic text-xl text-[#9D7B32]">03. Caps</p>
          <h2 className="mt-2 font-serif text-3xl font-medium text-[#0B0B0D]">
            Clean Headwear
          </h2>
          <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
            Rich velvet Fila caps, wool caps, snapbacks, and fedoras in black, white, gold, and more colours.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
