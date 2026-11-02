import React from 'react';
import { Calendar, ShieldCheck, HeartHandshake, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter } from '../router.tsx';

export const HowItWorksPage: React.FC = () => {
  const { navigate } = useRouter();

  const steps = [
    {
      num: '01',
      title: 'Select Rituals & Schedule Slot',
      desc: 'Browse our specialized menu—from Italian Rica waxing to clinical Hydra facials. Enter your Delhi NCR pincode and choose a convenient time slot (09:00 AM – 07:00 PM).'
    },
    {
      num: '02',
      title: 'Punctual Doorstep Arrival',
      desc: 'Your certified female specialist arrives 10 minutes prior with sanitized equipment, hospital-grade single-use disposables, and sterile products.'
    },
    {
      num: '03',
      title: 'Sterile Unsealing in Your Presence',
      desc: 'Bed sheets, towels, aprons, and autoclave-sterilized stainless steel instruments are unsealed in indicator pouches before your eyes. Zero cross-contamination.'
    },
    {
      num: '04',
      title: 'Zero Mess & Pay After Service',
      desc: 'After your relaxing treatment, the beautician disposes of all service waste, leaving your living room or bedroom pristine. Pay securely via Cash or UPI on completion.'
    }
  ];

  return (
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="max-w-2xl">
          <p className="text-xs text-[#8C7A7C] mb-1">
            <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer">Home</span> / How It Works
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>The Doorstep Experience</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
            How BeautyDoor Works
          </h1>
          <p className="text-sm text-[#5C4D4F] mt-1 font-light">
            A frictionless at-home beauty journey designed for Delhi NCR residents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((st) => (
            <div
              key={st.num}
              className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#4A0417]">
                <span className="w-7 h-7 rounded-full bg-[#FAF7F2] text-[#4A0417] border border-[#E8DDD3] flex items-center justify-center font-mono text-xs">
                  {st.num}
                </span>
                <span className="uppercase tracking-wider">Step</span>
              </div>

              <h3 className="text-base font-semibold text-[#1F1A1C]">
                {st.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#5C4D4F] leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="p-8 rounded-2xl bg-gradient-to-r from-[#4A0417] to-[#1F1A1C] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-serif font-bold">Ready to Experience BeautyDoor?</h3>
            <p className="text-xs text-[#E8DDD3] font-light">
              Book online today with code BEAUTYFIRST for flat ₹200 savings.
            </p>
          </div>

          <button
            onClick={() => navigate('/services')}
            className="px-6 py-3 bg-white text-[#4A0417] hover:bg-[#FAF7F2] text-xs font-semibold rounded-md shadow-xs transition-colors shrink-0"
          >
            Explore Services Catalog
          </button>
        </div>

      </div>
    </div>
  );
};
