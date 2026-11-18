import { motion } from 'motion/react';
import { ContactSection } from '../components/ContactSection.tsx';
import { Product } from '../types.ts';

interface ContactPageProps {
  products: Product[];
  onNavigate: (path: string) => void;
}

export function ContactPage({ products, onNavigate }: ContactPageProps) {
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-[#6B665C] pb-4 border-b border-[#E0D9CA]"
        >
          <a href="/" onClick={(e) => handleLink(e, '/')} className="hover:text-[#0B0B0D]">
            Home
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-[#0B0B0D] font-medium">Contact</span>
        </nav>
      </div>
      <ContactSection products={products} />
    </motion.div>
  );
}
