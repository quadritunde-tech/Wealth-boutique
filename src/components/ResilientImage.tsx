import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  priority = false,
  width = 800,
  height = 600,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#151519] via-[#1C1A16] to-[#0B0B0D] text-[#C6A254] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="w-6 h-6 mb-2 opacity-80" aria-hidden="true" />
        <span className="font-serif text-sm text-[#FAF8F4]/90 line-clamp-2">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  );
}
