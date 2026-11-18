import { FormEvent, useRef, useState } from 'react';
import { Send, ShoppingBag, Sparkles, X } from 'lucide-react';
import { Product, StylistMessage } from '../types.ts';
import { formatNaira } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface WealthStylistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedOption: string) => void;
  onOrderNow: (product: Product, selectedOption: string) => void;
}

const QUICK_PROMPTS = [
  'I need an outfit for a party',
  'I need shoes to match this shirt',
  'What cap fits me?',
];

export function WealthStylistDrawer({
  isOpen,
  onClose,
  onAddToCart,
  onOrderNow,
}: WealthStylistDrawerProps) {
  const [messages, setMessages] = useState<StylistMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Welcome to Wealth Fashion Boutique! I am Wealth Stylist, your friendly Ibadan fashion helper. Tell me the event you are going to, your style, or your budget in Naira, and I will pick 3 matching items from our shop for you.',
      stylingNote: 'Try asking for a party outfit, shoes to match a shirt, or a nice cap.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const sendMessage = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;

    const userMsg: StylistMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');

    window.setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);

    try {
      const res = await fetch('/api/stylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Wealth Stylist could not respond right now.');
      }

      const assistantMsg: StylistMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.reply,
        stylingNote: data.stylingNote,
        recommendedProducts: data.recommendedProducts || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      window.setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 60);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Wealth Stylist encountered a connection issue.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Wealth Stylist AI Fashion Assistant"
    >
      <div className="flex h-[100dvh] w-full max-w-lg flex-col bg-[#FAF8F4] shadow-2xl border-l border-[#E5DFD3]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-[#0B0B0D] text-[#FAF8F4] border-b border-[#C6A254]/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[#C6A254] text-[#0B0B0D]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold leading-tight">
                Wealth Stylist
              </h2>
              <p className="text-xs text-[#C6A254]">
                Your Friendly Fashion Helper
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Wealth Stylist"
            className="h-11 w-11 flex items-center justify-center text-[#FAF8F4]/70 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Occasion Prompts */}
        <div className="px-5 py-3 bg-white border-b border-[#EFEAE0] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              className="min-h-[36px] px-3 py-1.5 text-xs font-medium bg-[#FAF8F4] border border-[#DCD5C7] text-[#0B0B0D] hover:border-[#C6A254] hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Conversation Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[90%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#0B0B0D] text-[#FAF8F4]'
                    : 'bg-white border border-[#E5DFD3] text-[#1C1917]'
                }`}
              >
                <p>{msg.text}</p>
                {msg.stylingNote && (
                  <p className="mt-2 pt-2 border-t border-[#EFEAE0] text-xs text-[#9D7B32] font-medium">
                    Stylist Tip: {msg.stylingNote}
                  </p>
                )}
              </div>

              {/* 3 Curated Shop Recommendations */}
              {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                <div className="mt-3 w-full space-y-2.5">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#6B665C]">
                    3 Top Picks For You
                  </p>
                  {msg.recommendedProducts.map((product) => {
                    const defaultOpt = product.options[0] || 'Standard';
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 bg-white border border-[#E5DFD3]"
                      >
                        <div className="w-16 h-16 shrink-0 overflow-hidden bg-[#F3EFE6]">
                          <ResilientImage
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-[#6B665C]">
                            {product.category} · {product.gender}
                          </p>
                          <p className="text-sm font-semibold text-[#0B0B0D] truncate">
                            {product.name}
                          </p>
                          <p className="font-mono text-xs font-semibold text-[#9D7B32] tabular-nums">
                            {formatNaira(product.price)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onAddToCart(product, defaultOpt)}
                            className="min-h-[34px] px-2.5 py-1.5 text-[11px] font-semibold bg-[#0B0B0D] text-[#FAF8F4] hover:bg-[#232329] inline-flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOrderNow(product, defaultOpt)}
                            className="min-h-[34px] px-2.5 py-1.5 text-[11px] font-semibold bg-[#C6A254] text-[#0B0B0D] hover:bg-[#B89242] whitespace-nowrap cursor-pointer"
                          >
                            Order Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <span className="mt-1 text-[10px] text-[#78716C]">
                {msg.role === 'user' ? 'You' : 'Wealth Stylist'} · {msg.timestamp}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="bg-white border border-[#E5DFD3] px-4 py-3 text-xs text-[#6B665C]">
                Picking 3 nice items from our shop for you...
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-white border-t border-[#E5DFD3] flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask e.g. 'Outfit for an Ibadan wedding under ₦200k'..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-[#FAF8F4] border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message to Wealth Stylist"
            className="min-h-[44px] px-4 py-2 bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Style Me</span>
          </button>
        </form>
      </div>
    </div>
  );
}
