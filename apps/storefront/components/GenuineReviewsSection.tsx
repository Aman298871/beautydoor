import React, { useState } from 'react';
import { Star, MessageSquare, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Review {
  id: string;
  customer_name: string;
  city: string;
  rating: number;
  comment: string;
  service_name: string;
  created_at: string;
  source: string;
  is_approved: number;
}

interface Props {
  reviews: Review[];
  googlePlaceId?: string;
  onOpenWriteReview: () => void;
}

export const GenuineReviewsSection: React.FC<Props> = ({
  reviews,
  googlePlaceId,
  onOpenWriteReview
}) => {
  // Filter for approved customer feedback from verified bookings
  const verifiedReviews = reviews.filter(r => r.is_approved === 1);

  return (
    <section id="reviews" className="py-14 sm:py-18 bg-[#FAF7F2] border-b border-[#E8DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Verified Client Feedback & Standards</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#1F1A1C] tracking-tight">
              Genuine experiences from our <span className="italic font-medium text-[#4A0417]">doorstep clients.</span>
            </h2>
            <p className="mt-1 text-sm text-[#5C4D4F] font-light">
              We uphold transparency. Feedback is submitted by customers following completed appointments and moderated for authenticity.
            </p>
          </div>

          {/* Genuine Action Card: Write or View Official Google Listing */}
          <div className="bg-white p-4 rounded-xl border border-[#E8DDD3] shadow-xs flex items-center gap-4 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F1A1C]">
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/googleg_32dp.png"
                  alt="Google"
                  className="w-4 h-4 object-contain"
                  referrerPolicy="no-referrer"
                />
                <span>Official Google Business Profile</span>
              </div>
              <p className="text-[11px] text-[#7A6B6D]">
                {googlePlaceId ? 'Official Google listing connected.' : 'Google Business Profile integration available.'}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={onOpenWriteReview}
                  className="text-xs font-semibold text-[#4A0417] hover:underline flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Leave Feedback</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        {verifiedReviews.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-[#E8DDD3] text-center max-w-lg mx-auto space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5 text-[#C5A880]" />
            </div>
            <h4 className="text-base font-semibold text-[#1F1A1C]">
              Be Among the First to Share Your Experience
            </h4>
            <p className="text-xs text-[#6B5A5C] leading-relaxed">
              We never fabricate ratings or publish unverified reviews. Book an appointment today and your feedback will be featured here following completion.
            </p>
            <button
              onClick={onOpenWriteReview}
              className="px-4 py-2 bg-[#4A0417] text-white text-xs font-semibold rounded-md hover:bg-[#36020F] transition-colors"
            >
              Write Client Feedback
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {verifiedReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[#1F1A1C]">
                        {rev.customer_name}
                      </h4>
                      <p className="text-[11px] text-[#7A6B6D]">{rev.city}</p>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#4A3E3D] italic leading-relaxed">
                    “{rev.comment}”
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F4EFEA] flex items-center justify-between text-xs text-[#8C7A7C]">
                  <span className="font-medium text-[#4A0417] truncate max-w-[180px]">
                    {rev.service_name}
                  </span>
                  <div className="flex items-center gap-1 text-emerald-800 font-medium text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>Verified Booking</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
