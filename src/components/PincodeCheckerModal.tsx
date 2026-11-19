import React, { useState, useEffect } from 'react';
import { X, MapPin, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Territory } from '../types.ts';
import { lockScroll, unlockScroll } from '../utils/scrollLock.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  territories: Territory[];
  onSelectTerritory: (territory: Territory) => void;
}

export const PincodeCheckerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  territories,
  onSelectTerritory
}) => {
  const [query, setQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('All');

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      lockScroll();
      return () => {
        unlockScroll();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cities = ['All', 'Delhi', 'Gurugram', 'Noida', 'Greater Noida', 'Ghaziabad', 'Faridabad'];

  const filteredTerritories = territories.filter(t => {
    if (selectedCityFilter !== 'All' && t.city !== selectedCityFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return t.pincode.includes(q) || t.areaName.toLowerCase().includes(q) || t.city.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8DDD3] p-6 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD3]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
              <span>Coverage Directory</span>
              <span aria-hidden="true">·</span>
              <span>Delhi NCR</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#1F1A1C] mt-0.5">
              Serviceable Localities & Hubs
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#6B5A5C] hover:text-[#1F1A1C] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Locality Explanation */}
        <div className="mt-4 p-3.5 bg-[#FAF7F2] border border-[#C5A880]/30 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#4A0417]">
            <Info className="w-4 h-4 shrink-0" />
            <span>Doorstep Service Area Guide</span>
          </div>
          <p className="text-[#554749] leading-relaxed">
            These are the neighbourhoods where BeautyDoor currently provides doorstep services. Listed localities (such as Saket, Malviya Nagar, Sainik Farm, DLF, Indirapuram, etc.) are standard residential neighbourhood names mapped to regional hubs, not separate packages or extra charges.
          </p>
          <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 font-semibold text-[11px] text-[#1F1A1C]">
            <span>Delhi Minimum Order: <strong className="text-[#4A0417]">₹1,000</strong></span>
            <span>NCR / Haryana / Noida Minimum Order: <strong className="text-[#4A0417]">₹1,500</strong></span>
            <span>Zero Doorstep Visiting Charge: <strong className="text-emerald-700">₹0 Free</strong></span>
          </div>
        </div>

        {/* Search & City Filter */}
        <div className="pt-3 space-y-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by 6-digit pincode or neighbourhood name (e.g. Saket, 110017, DLF, Indirapuram)..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
          />

          <div className="flex flex-wrap gap-1 text-xs">
            {cities.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCityFilter(c)}
                className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  selectedCityFilter === c
                    ? 'bg-[#4A0417] text-white font-semibold'
                    : 'bg-[#F4EFEA] text-[#554749] hover:bg-[#EAE2D8]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-[#F4EFEA] border-t border-[#F0E6DE]">
          {filteredTerritories.length === 0 ? (
            <p className="text-xs text-[#8C7A7C] italic py-8 text-center">
              No matching active sectors found for "{query}". Contact concierge for custom bookings outside standard sectors.
            </p>
          ) : (
            filteredTerritories.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  onSelectTerritory(t);
                  onClose();
                }}
                className="py-3 px-2 hover:bg-[#FAF7F2] rounded cursor-pointer transition-colors flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#4A0417] tabular-nums">{t.pincode}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#1F1A1C]">{t.city}</span>
                    <span className="text-[10px] bg-[#FAF7F2] border border-[#E8DDD3] px-1.5 py-0.5 rounded text-[#554749]">
                      Min: ₹{t.minOrderAmount}
                    </span>
                  </div>
                  <p className="text-[#6B5A5C] mt-0.5">{t.areaName}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    t.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.isActive ? 'Active Doorstep Service' : 'Coming Soon'}
                  </span>
                  <p className="text-[10px] text-[#8C7A7C] mt-0.5">
                    {t.deliveryFee === 0 ? 'Zero Visiting Charge (Free)' : `₹${t.deliveryFee} fee`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[#F0E6DE] text-xs text-[#7A6B6D] flex justify-between items-center">
          <span>Click any neighbourhood to set as your active booking location.</span>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#4A0417] hover:bg-[#36020F] text-white rounded text-xs font-semibold cursor-pointer">
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
