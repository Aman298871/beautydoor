import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface Props {
  text: string;
  isActive: boolean;
}

export const AnnouncementBar: React.FC<Props> = ({ text, isActive }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isActive || isDismissed || !text) return null;

  return (
    <div className="relative bg-[#4A0417] text-[#FAF7F2] px-4 py-2 text-xs md:text-sm font-medium tracking-wide flex items-center justify-center transition-all border-b border-[#6E0D25]">
      <div className="flex items-center gap-2 text-center truncate max-w-4xl">
        <Sparkles className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
        <span className="truncate">{text}</span>
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute right-3 p-1 text-[#FAF7F2]/70 hover:text-white transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
