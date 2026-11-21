import React from 'react';
import { useRouter } from '../router.tsx';
import { BUSINESS_CONFIG } from '../../../src/config/businessConfig.ts';

// Re-export dedicated compliance pages
export { AboutUsPage } from './compliance/AboutUsPage.tsx';
export { ContactUsPage } from './compliance/ContactUsPage.tsx';
export { PricingPage } from './compliance/PricingPage.tsx';
export { TermsPage } from './compliance/TermsPage.tsx';
export { PrivacyPage } from './compliance/PrivacyPage.tsx';
export { RefundCancellationPage } from './compliance/RefundCancellationPage.tsx';

// Backwards-compatible aliases
export { AboutUsPage as AboutPage } from './compliance/AboutUsPage.tsx';
export { ContactUsPage as ContactPage } from './compliance/ContactUsPage.tsx';
export { TermsPage as TermsAndConditionsPage } from './compliance/TermsPage.tsx';
export { RefundCancellationPage as CancellationPolicyPage } from './compliance/RefundCancellationPage.tsx';

export const FAQPage: React.FC = () => {
  const { navigate } = useRouter();
  const [faqs, setFaqs] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/storefront/faqs?audience=customer')
      .then(res => res.json())
      .then(data => {
        if (data.faqs) setFaqs(data.faqs);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <p className="text-xs text-[#8C7A7C] mb-1">
            <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer">Home</span> / Frequently Asked Questions
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-[#5C4D4F] mt-1 font-light">
            Answers to common questions regarding doorstep hygiene, certified specialists, minimum booking thresholds, and cancellation.
          </p>
        </div>

        <div className="space-y-4">
          {(faqs.length > 0 ? faqs : [
            {
              question: 'How does BeautyDoor ensure salon hygiene at my doorstep?',
              answer: 'We utilize sealed, mono-dose sanitized kits, disposable sheets and headbands, and medical-grade sanitized implements for every single customer.'
            },
            {
              question: 'What is the minimum booking order for my city?',
              answer: 'Delhi: ₹1,000 · Haryana (Gurugram, Faridabad): ₹1,500 · Noida & Greater Noida: ₹1,500.'
            },
            {
              question: 'What is BeautyDoor\'s cancellation and refund policy?',
              answer: 'Cancellations made 2 hours or more before the appointment slot are 100% free with zero fee. Late cancellations within 2 hours incur a ₹200 convenience fee.'
            },
            {
              question: 'How do I pay for my appointment?',
              answer: 'Payment is Cash on Delivery / Pay After Service. You can pay via Cash or UPI QR scan directly to your beautician after the service is complete.'
            }
          ]).map((faq, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-[#E8DDD3] shadow-xs space-y-2">
              <h3 className="font-bold text-sm text-[#4A0417]">{faq.question}</h3>
              <p className="text-xs sm:text-sm text-[#554749] leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const GenericPolicyPage: React.FC<{ type: 'hygiene' | 'privacy' | 'terms' | 'cancellation' }> = ({ type }) => {
  const { navigate } = useRouter();

  if (type === 'privacy') {
    const { PrivacyPage } = require('./compliance/PrivacyPage.tsx');
    return <PrivacyPage />;
  }
  if (type === 'terms') {
    const { TermsPage } = require('./compliance/TermsPage.tsx');
    return <TermsPage />;
  }
  if (type === 'cancellation') {
    const { RefundCancellationPage } = require('./compliance/RefundCancellationPage.tsx');
    return <RefundCancellationPage />;
  }

  return (
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
          Hygiene & Sanitization Protocols
        </h1>
        <div className="bg-white p-8 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-5 text-xs sm:text-sm text-[#4A3E3D] leading-relaxed">
          <p>
            Effective Date: November 2026. This policy governs appointments booked on the BeautyDoor platform across Delhi NCR.
          </p>
          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-2">
            <h4 className="font-bold text-sm text-[#4A0417]">Mono-Dose Disposable Guarantee</h4>
            <p className="text-xs text-[#554749]">
              • Single-use sealed wax cartridges & disposable strips.<br />
              • Sanitized and sterilized manicure and pedicure toolsets.<br />
              • Fresh disposable bedsheets, headbands, and gowns for every client.<br />
              • Background-verified, certified female specialists equipped with PPE and sanitized kits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
