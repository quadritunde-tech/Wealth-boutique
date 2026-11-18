import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, MessageCircle, X } from 'lucide-react';
import { Product } from '../types.ts';
import { buildWhatsAppUrl, formatNaira } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface OrderModalProps {
  product: Product | null;
  initialOption: string;
  onClose: () => void;
  onOrderSuccess?: () => void;
}

export function OrderModal({
  product,
  initialOption,
  onClose,
  onOrderSuccess,
}: OrderModalProps) {
  const [selectedOption, setSelectedOption] = useState(initialOption);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<{
    text: string;
    orderNumber: string;
    whatsappUrl: string;
  } | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedOption(initialOption || product.options[0] || 'Standard');
      setQuantity(1);
      setError('');
      setConfirmation(null);
    }
  }, [product, initialOption]);

  if (!product) return null;

  const totalAmount = product.price * quantity;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please enter your full name and WhatsApp phone number.');
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
          note: message.trim(),
          source: 'Quick Order',
          items: [
            {
              productId: product.id,
              name: product.name,
              price: product.price,
              selectedOption,
              quantity,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not place order. Please try again.');
      }

      const waText = [
        `Hello Wealth Fashion Boutique! I would like to complete my order (${data.order.orderNumber}):`,
        `• Item: ${product.name}`,
        `• ${product.optionLabel}: ${selectedOption}`,
        `• Quantity: ${quantity}`,
        `• Total: ${formatNaira(totalAmount)}`,
        `• Name: ${customerName.trim()}`,
        `• Phone: ${customerPhone.trim()}`,
        deliveryAddress.trim() ? `• Delivery Location: ${deliveryAddress.trim()}` : '',
        message.trim() ? `• Note: ${message.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      setConfirmation({
        text:
          data.confirmationMessage ||
          'Thank you, Wealth Fashion Boutique will reply you on WhatsApp shortly',
        orderNumber: data.order.orderNumber,
        whatsappUrl: buildWhatsAppUrl(waText),
      });

      onOrderSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white border border-[#E5DFD3] shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFEAE0] bg-[#0B0B0D] text-[#FAF8F4]">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#C6A254]">
              Direct Boutique Order
            </p>
            <h2 id="order-modal-title" className="font-serif text-xl font-semibold">
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order modal"
            className="p-2 text-[#FAF8F4]/70 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {confirmation ? (
            <div className="py-4 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center bg-[#0B0B0D] text-[#C6A254]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-wider text-[#9D7B32]">
                  Order {confirmation.orderNumber} Saved
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#0B0B0D]">
                  {confirmation.text}
                </h3>
                <p className="text-sm text-[#57534E]">
                  Your request has been logged with our Bodija atelier. Tap below to send your order details directly on WhatsApp for priority dispatch.
                </p>
              </div>
              <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={confirmation.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open WhatsApp Chat</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 text-sm font-medium border border-[#DCD5C7] text-[#0B0B0D] hover:bg-[#FAF8F4] cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-[#FAF8F4] border border-[#EFEAE0]">
                <div className="w-20 h-16 shrink-0 overflow-hidden bg-[#F3EFE6]">
                  <ResilientImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#6B665C]">
                    {product.category} · {product.gender}
                  </p>
                  <p className="font-semibold text-sm text-[#0B0B0D] truncate">
                    {product.name}
                  </p>
                  <p className="font-mono text-sm font-medium text-[#9D7B32] tabular-nums">
                    {formatNaira(product.price)} each
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                    {product.optionLabel}
                  </label>
                  <select
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                  >
                    {product.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#DCD5C7] tabular-nums focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chinedu Okafor"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                  WhatsApp / Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +234 803 000 0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                  Delivery Location (Ibadan / Nationwide)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bodija, Jericho, Oluyole Estate, or Lagos"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                  Styling Note or Fit Request (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Any preferred delivery time or custom tailoring request..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-2">
                  {error}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-[#EFEAE0]">
                <div>
                  <p className="text-xs text-[#6B665C]">Order Total</p>
                  <p className="font-mono text-lg font-semibold text-[#0B0B0D] tabular-nums">
                    {formatNaira(totalAmount)}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[44px] px-6 py-2.5 text-sm font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Saving Order...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
