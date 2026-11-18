import { FormEvent, useState } from 'react';
import { CheckCircle2, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { CartItem } from '../types.ts';
import { buildWhatsAppUrl, formatNaira } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOrderSaved?: () => void;
}

export function CartDrawer({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSaved,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkoutDone, setCheckoutDone] = useState<{
    orderNumber: string;
    message: string;
    whatsappUrl: string;
    summaryText: string;
  } | null>(null);

  if (!isOpen) return null;

  const totalNaira = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please enter your name and WhatsApp phone number to checkout.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddress: deliveryAddress.trim() || 'Ibadan Delivery / Pickup',
          source: 'Cart Checkout',
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            selectedOption: item.selectedOption,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not complete checkout.');
      }

      const itemLines = items
        .map(
          (item, idx) =>
            `${idx + 1}. ${item.name} (${item.optionLabel}: ${item.selectedOption}) x${item.quantity} — ${formatNaira(item.price * item.quantity)}`
        )
        .join('\n');

      const summaryText = [
        `Hello Wealth Fashion Boutique! New Cart Order (${data.order.orderNumber}):`,
        '',
        itemLines,
        '',
        `Total: ${formatNaira(totalNaira)}`,
        `Name: ${customerName.trim()}`,
        `WhatsApp Phone: ${customerPhone.trim()}`,
        `Delivery Location: ${deliveryAddress.trim() || 'Ibadan'}`,
      ].join('\n');

      setCheckoutDone({
        orderNumber: data.order.orderNumber,
        message:
          data.confirmationMessage ||
          'Thank you, Wealth Fashion Boutique will reply you on WhatsApp shortly',
        whatsappUrl: buildWhatsAppUrl(summaryText),
        summaryText,
      });

      onClearCart();
      onOrderSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save order.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setCheckoutDone(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label="Shopping Bag">
      <div className="flex h-[100dvh] w-full max-w-md flex-col bg-white shadow-2xl border-l border-[#E5DFD3]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-[#0B0B0D] text-[#FAF8F4]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-[#C6A254]" aria-hidden="true" />
            <h2 className="font-serif text-lg font-semibold">
              Shopping Bag ({totalCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Close shopping bag"
            className="h-11 w-11 flex items-center justify-center text-[#FAF8F4]/70 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {checkoutDone ? (
            <div className="py-6 space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center bg-[#0B0B0D] text-[#C6A254]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-wider text-[#9D7B32]">
                  Order {checkoutDone.orderNumber} Confirmed
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#0B0B0D]">
                  {checkoutDone.message}
                </h3>
                <p className="text-sm text-[#57534E]">
                  All items in your bag are saved. Tap below to send your full order list to our Ibadan shop on WhatsApp.
                </p>
              </div>

              <div className="text-left p-4 bg-[#FAF8F4] border border-[#E5DFD3] text-xs text-[#292524] whitespace-pre-line font-mono leading-relaxed">
                {checkoutDone.summaryText}
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <a
                  href={checkoutDone.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full min-h-[46px] px-5 py-3 text-sm font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send All Items on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full min-h-[42px] px-4 py-2 text-xs font-medium border border-[#DCD5C7] text-[#0B0B0D] hover:bg-[#FAF8F4] cursor-pointer"
                >
                  Back to Shop
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <ShoppingBag className="w-10 h-10 text-[#C6A254] mb-3 opacity-75" />
              <p className="font-serif text-xl text-[#0B0B0D]">Your bag is empty</p>
              <p className="mt-1.5 text-sm text-[#57534E] max-w-xs">
                Check out our Agbada, Senator suits, leather shoes, and clean caps to add items here.
              </p>
              <button
                type="button"
                onClick={resetAndClose}
                className="mt-6 px-6 py-2.5 text-xs font-semibold bg-[#0B0B0D] text-[#FAF8F4] hover:bg-[#232329] cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#EFEAE0]">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  <div className="w-20 h-20 shrink-0 overflow-hidden bg-[#F3EFE6]">
                    <ResilientImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-[#0B0B0D] leading-snug">
                        {item.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="p-1 text-[#78716C] hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-[#6B665C]">
                      {item.optionLabel}: <span className="text-[#0B0B0D] font-medium">{item.selectedOption}</span>
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-[#DCD5C7]">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          aria-label="Decrease quantity"
                          className="p-1.5 text-[#0B0B0D] hover:bg-[#FAF8F4] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-mono font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          aria-label="Increase quantity"
                          className="p-1.5 text-[#0B0B0D] hover:bg-[#FAF8F4] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-mono text-sm font-semibold text-[#0B0B0D] tabular-nums">
                        {formatNaira(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Checkout Form */}
        {!checkoutDone && items.length > 0 && (
          <form
            onSubmit={handleCheckout}
            className="border-t border-[#E5DFD3] bg-[#FAF8F4] px-6 py-5 space-y-3"
          >
            <div className="flex items-baseline justify-between pb-2 border-b border-[#E5DFD3]">
              <span className="text-sm font-medium text-[#44403C]">Subtotal</span>
              <span className="font-mono text-xl font-semibold text-[#0B0B0D] tabular-nums">
                {formatNaira(totalNaira)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <input
                type="text"
                required
                placeholder="Your Full Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-sm bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
              />
              <input
                type="tel"
                required
                placeholder="WhatsApp Phone Number (e.g. +234 803...) *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-sm bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Delivery Address (Ibadan / Nationwide)"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-base sm:text-sm bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] px-5 py-3 text-sm font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Processing Checkout...'
                  : `Checkout via WhatsApp · ${formatNaira(totalNaira)}`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
