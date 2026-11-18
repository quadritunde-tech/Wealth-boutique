import { FormEvent, useState } from 'react';
import { CheckCircle2, Instagram, MapPin, MessageCircle, Phone } from 'lucide-react';
import { BUSINESS_INFO } from '../data/seedCatalog.ts';
import { Product } from '../types.ts';
import { buildWhatsAppUrl } from '../utils/format.ts';

interface ContactSectionProps {
  products: Product[];
}

export function ContactSection({ products }: ContactSectionProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [productName, setProductName] = useState(
    products[0]?.name || 'General Boutique Enquiry'
  );
  const [selectedOption, setSelectedOption] = useState('M');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [whatsappFollowupUrl, setWhatsappFollowupUrl] = useState('');

  const selectedProductObj = products.find((p) => p.name === productName);
  const availableOptions = selectedProductObj?.options || [
    'S',
    'M',
    'L',
    'XL',
    '40–45',
    'Black/Gold',
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please provide your name and WhatsApp / phone number.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          productName,
          selectedOption,
          message:
            message.trim() ||
            `Enquiry regarding ${productName} (${selectedOption}).`,
          source: 'Contact Form',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit enquiry.');
      }

      setSuccessMsg(
        data.confirmationMessage ||
          'Thank you, Wealth Fashion Boutique will reply you on WhatsApp shortly'
      );

      const waText = [
        `Hello Wealth Fashion Boutique! My name is ${customerName.trim()}.`,
        `Product: ${productName} (${selectedOption})`,
        `Phone: ${customerPhone.trim()}`,
        message.trim() ? `Message: ${message.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      setWhatsappFollowupUrl(buildWhatsAppUrl(waText));
      setCustomerName('');
      setCustomerPhone('');
      setMessage('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Atelier Details */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#9D7B32] font-semibold">
              Ibadan Concierge
            </p>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-medium text-[#0B0B0D] leading-[1.08]">
              Visit or Message Our Ibadan Atelier
            </h1>
            <p className="mt-4 text-base text-[#57534E] leading-relaxed">
              Need custom measurements for an Agbada, size guidance on our Italian calfskin footwear, or same-day delivery within Ibadan? Reach our stylists directly.
            </p>
          </div>

          <div className="space-y-6 pt-6 border-t border-[#E0D9CA]">
            <div className="flex items-start gap-3.5">
              <MapPin className="w-5 h-5 text-[#9D7B32] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#0B0B0D]">
                  Boutique Address
                </p>
                <p className="mt-1 text-sm text-[#57534E]">
                  {BUSINESS_INFO.location}
                </p>
                <p className="mt-0.5 text-xs text-[#78716C]">
                  {BUSINESS_INFO.hours}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Phone className="w-5 h-5 text-[#9D7B32] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#0B0B0D]">
                  WhatsApp Concierge
                </p>
                <a
                  href={buildWhatsAppUrl('Hello Wealth Fashion Boutique, I have a styling or order enquiry.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-mono text-sm text-[#0B0B0D] hover:text-[#9D7B32] underline underline-offset-4"
                >
                  {BUSINESS_INFO.whatsappDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Instagram className="w-5 h-5 text-[#9D7B32] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#0B0B0D]">
                  Instagram Lookbook
                </p>
                <a
                  href={BUSINESS_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm text-[#0B0B0D] hover:text-[#9D7B32] underline underline-offset-4"
                >
                  {BUSINESS_INFO.instagramHandle}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Customer Enquiry Form */}
        <div className="lg:col-span-7 bg-white border border-[#E0D9CA] p-7 sm:p-10">
          <h2 className="font-serif text-3xl font-medium text-[#0B0B0D]">
            Send a Styling or Order Enquiry
          </h2>
          <p className="mt-2 text-sm text-[#57534E]">
            Your enquiry is logged immediately for our Ibadan showroom team and receives a personal WhatsApp reply.
          </p>

          {successMsg ? (
            <div className="mt-6 p-6 bg-[#FAF8F4] border border-[#E5DFD3] text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#0B0B0D] text-[#C6A254]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#0B0B0D]">
                {successMsg}
              </h3>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {whatsappFollowupUrl && (
                  <a
                    href={whatsappFollowupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message Now on WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSuccessMsg('')}
                  className="px-5 py-2.5 text-xs font-medium border border-[#DCD5C7] text-[#0B0B0D] hover:bg-white cursor-pointer"
                >
                  Send Another Enquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tunde Adebayo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-[#FAF8F4] border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                    WhatsApp / Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+234 803 000 0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-[#FAF8F4] border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                    Product of Interest
                  </label>
                  <select
                    value={productName}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setProductName(nextName);
                      const prod = products.find((p) => p.name === nextName);
                      if (prod && prod.options.length > 0) {
                        setSelectedOption(prod.options[0]);
                      }
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-[#FAF8F4] border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                  >
                    <option value="General Boutique Enquiry">General Boutique Enquiry</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                    Preferred Size / Colour
                  </label>
                  <select
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-[#FAF8F4] border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                  >
                    {availableOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                  Message or Custom Tailoring Request
                </label>
                <textarea
                  rows={4}
                  placeholder="Share your preferred delivery location, event date, or fit notes..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-[#FAF8F4] border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
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
                className="w-full sm:w-auto min-h-[46px] px-8 py-3 text-sm font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Submitting Enquiry...' : 'Submit Enquiry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
