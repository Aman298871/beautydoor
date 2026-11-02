import React, { useState } from 'react';
import { Star, CheckCircle2, MessageSquare, ExternalLink, Sparkles } from 'lucide-react';
import { CustomerReview } from '../types.ts';

interface Props {
  reviews: CustomerReview[];
  onOpenWriteReview: () => void;
}

export const GoogleReviewsSection: React.FC<Props> = ({
  reviews,
  onOpenWriteReview
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'google' | 'verified'>('all');

  const filteredReviews = reviews.filter(r => {
    if (activeFilter === 'google') return r.source === 'google_places';
    if (activeFilter === 'verified') return r.source === 'verified_customer';
    return true;
  });

  return (
    <section id="reviews" className="py-16 sm:py-20 bg-[#FAF7F2] border-b border-[#E8DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Overall Rating Badge */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Genuine Google Reviews & Verified Feedback</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#1F1A1C] tracking-tight">
              Loved by discerning clients across <span className="italic font-medium text-[#4A0417]">Delhi NCR.</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#5C4D4F] font-light">
              Read authentic feedback from working women, homemakers, and brides who trust BeautyDoor for hospital-grade hygiene and five-star salon care at home.
            </p>
          </div>

          {/* Google Rating Pillar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DDD3] shadow-xs flex items-center gap-4 shrink-0">
            <div className="text-center pr-4 border-r border-[#E8DDD3]">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C] tabular-nums">
                4.9
              </span>
              <div className="flex items-center gap-0.5 text-amber-500 mt-1 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F1A1C]">
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png"
                  alt="Google"
                  className="w-4 h-4 object-contain"
                  referrerPolicy="no-referrer"
                />
                <span>Google Business Profile</span>
              </div>
              <p className="text-xs text-[#7A6B6D]">
                Based on 850+ verified customer reviews
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={onOpenWriteReview}
                  className="text-xs font-semibold text-[#4A0417] hover:underline flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Write a Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls (Segmented clean control) */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1 p-1 bg-[#F4EFEA] rounded-lg border border-[#E8DDD3] text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 font-medium rounded transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white text-[#4A0417] shadow-xs font-semibold'
                  : 'text-[#6B5A5C] hover:text-[#1F1A1C]'
              }`}
            >
              All Reviews ({reviews.length})
            </button>
            <button
              onClick={() => setActiveFilter('google')}
              className={`px-3 py-1.5 font-medium rounded transition-colors ${
                activeFilter === 'google'
                  ? 'bg-white text-[#4A0417] shadow-xs font-semibold'
                  : 'text-[#6B5A5C] hover:text-[#1F1A1C]'
              }`}
            >
              Google Reviews
            </button>
            <button
              onClick={() => setActiveFilter('verified')}
              className={`px-3 py-1.5 font-medium rounded transition-colors ${
                activeFilter === 'verified'
                  ? 'bg-white text-[#4A0417] shadow-xs font-semibold'
                  : 'text-[#6B5A5C] hover:text-[#1F1A1C]'
              }`}
            >
              Verified Home Bookings
            </button>
          </div>

          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs text-[#6B5A5C] hover:text-[#4A0417] font-medium transition-colors"
          >
            <span>View Profile on Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 rounded-2xl border border-[#E8DDD3] hover:border-[#C5A880] transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Reviewer Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[#1F1A1C]">
                      {rev.customerName}
                    </h4>
                    <p className="text-xs text-[#7A6B6D]">{rev.city}</p>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                {/* Review Prose */}
                <p className="text-xs sm:text-sm text-[#4A3E3D] leading-relaxed italic">
                  “{rev.comment}”
                </p>
              </div>

              {/* Card Footer: Metadata (Unboxed text with ·) */}
              <div className="mt-4 pt-3 border-t border-[#F4EFEA] flex items-center justify-between text-xs text-[#8C7A7C]">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-[#4A0417] truncate max-w-[200px]">
                    {rev.serviceName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{rev.date}</span>
                </div>

                <div className="flex items-center gap-1 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="capitalize">{rev.source.replace('_', ' ')}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
