import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview: (review: { customerName: string; city: string; rating: number; comment: string; serviceName: string }) => Promise<void>;
}

export const WriteReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmitReview
}) => {
  const [customerName, setCustomerName] = useState('');
  const [city, setCity] = useState('South Delhi');
  const [rating, setRating] = useState(5);
  const [serviceName, setServiceName] = useState('O3+ Bridal Radiance & Oxygen Glow Facial');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !comment) return;
    setLoading(true);
    try {
      await onSubmitReview({
        customerName,
        city,
        rating,
        serviceName,
        comment
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8DDD3] p-6 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD3]">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
              Share Your BeautyDoor Experience
            </h3>
            <p className="text-xs text-[#7A6B6D] mt-0.5">
              Verified review for our certified beauticians and treatments
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-[#6B5A5C] hover:text-[#1F1A1C]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-[#1F1A1C]">Thank you for your review!</h4>
            <p className="text-xs text-[#6B5A5C]">Your feedback helps us maintain hospital-grade standards.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-semibold text-[#1F1A1C] block mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ananya Mehra"
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#1F1A1C] block mb-1">NCR Territory / City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
                >
                  <option value="South Delhi">South Delhi</option>
                  <option value="Central Delhi">Central Delhi</option>
                  <option value="West Delhi">West Delhi</option>
                  <option value="DLF Gurugram">DLF Gurugram</option>
                  <option value="Golf Course Road">Golf Course Road</option>
                  <option value="Noida Sector 50/128">Noida Sector 50/128</option>
                  <option value="Greater Noida">Greater Noida</option>
                  <option value="Ghaziabad">Ghaziabad</option>
                  <option value="Faridabad">Faridabad</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F1A1C] block mb-1">Star Rating</label>
                <div className="flex items-center gap-1 py-1.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-5 h-5 ${star <= rating ? 'fill-current' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1F1A1C] block mb-1">Service Received</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Rica Waxing + Hydra Facial"
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1F1A1C] block mb-1">Your Detailed Experience *</label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the hygiene, punctuality, and quality of the treatment?"
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F0E6DE]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#6B5A5C] hover:bg-[#FAF7F2] rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
