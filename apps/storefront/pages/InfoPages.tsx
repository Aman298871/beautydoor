import React from 'react';
import { ShieldCheck, Phone, Mail, MapPin, Clock, Heart } from 'lucide-react';
import { useRouter } from '../router.tsx';

export const AboutPage: React.FC = () => {
  const { navigate } = useRouter();
  return (
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <p className="text-xs text-[#8C7A7C] mb-1">
            <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer">Home</span> / About BeautyDoor
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
            Redefining Doorstep Salon Luxury in India
          </h1>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-4 text-sm text-[#4A3E3D] leading-relaxed">
          <p>
            BeautyDoor was established with a singular conviction: clients should not have to choose between clinical hygiene and the supreme convenience of an at-home salon visit.
          </p>
          <p>
            Traditional salons often rush procedures and utilize shared multi-use wax pots or unsterilized manicure tools. BeautyDoor reimagines the entire model by arming rigorously vetted, certified female specialists with single-use, sterile disposable kits and genuine branded cosmetics.
          </p>
          <p>
            Headquartered in Delhi NCR, our network covers South, Central, West and East Delhi, Gurugram, Noida, Greater Noida, Ghaziabad, and Faridabad.
          </p>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { navigate } = useRouter();
  return (
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <p className="text-xs text-[#8C7A7C] mb-1">
            <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer">Home</span> / Contact & Concierge
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
            BeautyDoor Client Concierge
          </h1>
          <p className="text-sm text-[#5C4D4F] mt-1 font-light">
            Our dispatch specialists are available 7 days a week from 08:00 AM to 08:00 PM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-2">
            <Phone className="w-5 h-5 text-[#4A0417]" />
            <h3 className="font-bold text-sm text-[#1F1A1C]">Concierge Hotline</h3>
            <p className="text-xs text-[#6B5A5C] tabular-nums">+91 99991 23456</p>
            <p className="text-[11px] text-[#8C7A7C]">Instant telephone booking support</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-2">
            <Mail className="w-5 h-5 text-[#4A0417]" />
            <h3 className="font-bold text-sm text-[#1F1A1C]">Email Support</h3>
            <p className="text-xs text-[#6B5A5C]">concierge@beautydoor.in</p>
            <p className="text-[11px] text-[#8C7A7C]">Responses within 2 business hours</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-2">
            <MapPin className="w-5 h-5 text-[#4A0417]" />
            <h3 className="font-bold text-sm text-[#1F1A1C]">Delhi NCR Cluster</h3>
            <p className="text-xs text-[#6B5A5C]">DLF Phase 2, Gurugram & GK II, Delhi</p>
            <p className="text-[11px] text-[#8C7A7C]">Central Hub & Logistics Center</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FAQPage: React.FC = () => {
  const { navigate } = useRouter();
  const faqs = [
    {
      q: 'How does BeautyDoor maintain hospital-grade hygiene?',
      a: 'We use 100% single-use disposable bed sheets, towels, aprons, and spatulas. Cuticle pushers and metallic tools undergo hospital-grade autoclave sterilization sealed in pouches that are cut open in your sight.'
    },
    {
      q: 'Do I need to arrange hot water, chairs, or sheets?',
      a: 'No. Our specialists arrive completely self-sufficient with portable wax heaters, sterile sheets, disposable ground liners, and waste receptacles. We only require a standard electrical outlet.'
    },
    {
      q: 'Can I pay via Cash or UPI after the service?',
      a: 'Yes. BeautyDoor supports Cash on Delivery (Pay After Treatment). You may hand cash or scan the beautician’s verified UPI QR code once you are fully satisfied.'
    },
    {
      q: 'What is your cancellation policy?',
      a: 'Cancellations and rescheduling are 100% complimentary up to 4 hours prior to your scheduled appointment. Within 4 hours, our dispatch team can assist you with flexible rescheduling.'
    }
  ];

  return (
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <p className="text-xs text-[#8C7A7C] mb-1">
            <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer">Home</span> / FAQ & Hygiene Standard
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
            Frequently Asked Questions
          </h1>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-[#1F1A1C]">{f.q}</h3>
              <p className="text-xs sm:text-sm text-[#554749] leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PolicyPage: React.FC<{ type: 'privacy' | 'terms' | 'cancellation' }> = ({ type }) => {
  const titles = {
    privacy: 'Privacy & Data Protection Policy',
    terms: 'Terms of Service',
    cancellation: 'Doorstep Cancellation & Rescheduling Policy'
  };

  return (
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
          {titles[type]}
        </h1>
        <div className="bg-white p-8 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-4 text-xs sm:text-sm text-[#4A3E3D] leading-relaxed">
          <p>
            Effective Date: November 2026. This policy governs appointments booked on the BeautyDoor platform across Delhi, Gurugram, Noida, Greater Noida, Ghaziabad, and Faridabad.
          </p>
          <p>
            <strong>Doorstep Safety & Vetting:</strong> All female beauticians are certified cosmetology professionals who have passed background checks, identity verification, and monthly hygiene assessments.
          </p>
          <p>
            <strong>Payment & Refund Terms:</strong> Charges are payable at home via Cash or UPI, or online via Razorpay. Any pre-paid cancellation initiated more than 4 hours before the appointment is processed back to the original payment source within 24–48 hours.
          </p>
        </div>
      </div>
    </div>
  );
};
