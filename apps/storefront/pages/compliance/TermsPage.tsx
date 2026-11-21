import React, { useEffect } from 'react';
import { ShieldCheck, FileText, AlertCircle, Clock, CheckCircle2, Phone, Mail, HelpCircle } from 'lucide-react';
import { useRouter } from '../../router.tsx';
import { BUSINESS_CONFIG } from '../../../../src/config/businessConfig.ts';

interface Props {
  settings?: Record<string, string> | null;
}

export const TermsPage: React.FC<Props> = ({ settings }) => {
  const { navigate } = useRouter();

  useEffect(() => {
    document.title = 'Terms & Conditions — BeautyDoor At-Home Salon Platform';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Official Terms and Conditions for BeautyDoor appointments, COD payment policies, booking confirmation workflow, and doorstep service rules in Delhi NCR.'
    );
  }, []);

  const lastUpdated = settings?.policies_last_updated || 'November 2026';
  const legalEntity = settings?.legal_business_name && settings.legal_business_name.trim()
    ? settings.legal_business_name.trim()
    : 'BeautyDoor';

  return (
    <div className="py-10 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#8C7A7C]">
          <ol className="flex items-center gap-1.5">
            <li>
              <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer transition-colors font-medium">
                Home
              </span>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#4A0417] font-semibold">Terms & Conditions</li>
          </ol>
        </nav>

        {/* Hero Header */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8DDD3] text-xs font-semibold text-[#4A0417] shadow-xs">
            <FileText className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Legal Agreement & Operating Rules</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F1A1C] tracking-tight">
            Terms & Conditions of Service
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6B6D]">
            Effective Date: {lastUpdated} • Governing Platform: <strong>{legalEntity}</strong> (Operating as <strong>BeautyDoor</strong>)
          </p>
        </header>

        {/* Highlight Summary Notice */}
        <div className="p-5 rounded-2xl bg-white border border-[#E8DDD3] shadow-xs space-y-3 text-xs text-[#554749]">
          <div className="flex items-center gap-2 text-[#4A0417] font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
            <span>Essential Booking Principles Summary</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Confirmation Workflow:</strong> Online orders enter <em>Pending</em> status until dispatch coordination confirms the specialist.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>COD / Pay After Service:</strong> You pay after the service is performed at your home via Cash or UPI QR.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Free Cancellation:</strong> 100% free if requested at least 2 hours prior to your scheduled slot.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Regional Minimum Order:</strong> Delhi ₹1,000 · Haryana ₹1,500 · Noida ₹1,500 with ₹0 visiting fee.</span>
            </li>
          </ul>
        </div>

        {/* Detailed 17 Sections */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-8 text-xs sm:text-sm text-[#4A3E3D] leading-relaxed">

          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              1. Acceptance of Terms & Website Usage
            </h2>
            <p>
              By accessing, browsing, or placing an appointment through <strong>beautydoor.in</strong>, mobile web applications, or related digital touchpoints operated by BeautyDoor ("we", "us", or "our"), you ("Client", "User", or "Customer") agree to be bound by these Terms and Conditions. If you do not accept all provisions outlined herein, please refrain from scheduling appointments.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              2. Customer Account Registration & Eligibility
            </h2>
            <p>
              To book an appointment, customers may browse anonymously or register using their valid Indian mobile phone number. You certify that you are at least 18 years of age and legally competent to enter into binding agreements under the Indian Contract Act, 1872. You are responsible for ensuring that all information submitted (including recipient name, doorstep address, and contact numbers) is complete and accurate.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              3. Phone OTP Authentication & Session Security
            </h2>
            <p>
              Customer identity and booking retrieval may utilize Firebase Phone OTP or transactional one-time passwords delivered via SMS. OTPs are personal and confidential. BeautyDoor representatives will never ask you to disclose your login OTP over phone or email. You agree to immediately notify client support if you suspect unauthorized access to your mobile session.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              4. Booking Placement Workflow
            </h2>
            <p>
              Customers select rituals or packages from our published menu, input delivery address, choose an appointment date within our forward 7-day calendar, and select an available time slot. Upon clicking <em>"Place Booking"</em>, the appointment order is created and assigned a unique reference ID (e.g. <code>BD-NCR-XXXX</code>).
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              5. Appointment Confirmation Policy
            </h2>
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-1">
              <p className="font-bold text-[#4A0417]">Important Confirmation Clarification:</p>
              <p className="text-xs leading-relaxed">
                Submitting an order online places your appointment in <strong>Pending</strong> reservation status. It does not constitute immediate final confirmation. Final appointment confirmation occurs once our dispatch team audits route availability and formally assigns a certified female specialist. You will receive an official confirmation SMS / WhatsApp / Email notification containing your specialist's details once confirmed.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              6. Operating Hours & Time Slot Availability
            </h2>
            <p>
              BeautyDoor appointments are conducted seven (7) days a week between <strong>8:00 AM and 6:00 PM</strong>. Slots are subject to route feasibility and specialist capacity. Appointments for 08:00 AM (early morning) and 06:00 PM (evening) carry a nominal ₹100 specialist surcharge, which is clearly itemized prior to confirmation.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              7. Service Address & Territory Serviceability
            </h2>
            <p>
              BeautyDoor provides services exclusively across verified residential localities in <strong>Delhi NCR</strong> (including South, Central, West, and East Delhi, Gurugram, Noida, Greater Noida, Ghaziabad, and Faridabad). Customers must provide an exact address including flat/house number and landmark. We reserve the right to decline or cancel appointments located in restricted, hazardous, or non-serviceable premises.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              8. Service Pricing & Zero Hidden Travel Fees
            </h2>
            <p>
              All prices displayed on our website are in Indian National Rupees (INR) and represent authoritative pricing from our live database. We do not levy separate traveling fees or fuel charges. Customers must satisfy the minimum qualifying order threshold for their service city:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Delhi:</strong> Minimum qualifying subtotal of <strong>₹1,000</strong>.</li>
              <li><strong>Haryana (Gurugram / Faridabad):</strong> Minimum qualifying subtotal of <strong>₹1,500</strong>.</li>
              <li><strong>Noida & Greater Noida:</strong> Minimum qualifying subtotal of <strong>₹1,500</strong>.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              9. Coupons & Promotional Offers
            </h2>
            <p>
              Coupons (such as <code>BEAUTYFIRST</code>, providing flat ₹100 off on cart orders of ₹1,100+) must be entered before confirming the appointment. Discounts cannot be claimed retrospectively after booking submission. Tiered bundle discounts (5% for 2 items, 10% for 3 items, 15% for 4+ items) are calculated automatically on published service subtotals.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              10. Payment Terms — Cash on Delivery (Pay After Service)
            </h2>
            <p>
              BeautyDoor operates primarily on a <strong>Cash on Delivery (Pay After Service)</strong> model. Customers are not required to pay advance booking deposits. Upon completion of your treatment ritual, payment may be settled directly with your beautician via Cash or by scanning the specialist's verified UPI QR code (Google Pay, PhonePe, Paytm, BHIM, or any banking app).
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              11. Customer Responsibilities
            </h2>
            <p>
              To ensure safety and seamless treatment execution, clients agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Provide a safe, private, well-lit, and ventilated indoor room with a standard 3-pin electrical outlet for wax heaters.</li>
              <li>Provide access to clean running water.</li>
              <li>Ensure male family members or visitors respect specialist privacy and comfort during private treatments.</li>
              <li>Disclose any known dermatological allergies, skin conditions, active infections, or medical concerns before service initiation.</li>
            </ul>
          </section>

          {/* Section 12 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              12. Beautician Standards & Hygiene Protocols
            </h2>
            <p>
              All BeautyDoor specialists are verified female professionals who strictly follow our single-use sanitary commitment: fresh disposable bedsheets, headbands, aprons, wooden spatulas (strict zero double-dipping in wax pots), and sealed mono-dose skincare sachets opened in your presence. Metal tools are sanitized and transported in sealed indicator pouches.
            </p>
          </section>

          {/* Section 13 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              13. Booking Cancellation Policy
            </h2>
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-2">
              <h3 className="font-bold text-[#4A0417] text-xs uppercase tracking-wider">Cancellation Windows & Fees:</h3>
              <p>
                • <strong>Free Cancellation:</strong> You may cancel with <strong>100% free of charge (₹0 fee)</strong> if submitted at least <strong>2 hours</strong> prior to your scheduled appointment slot.<br />
                • <strong>Late Cancellation:</strong> Cancellations made less than 2 hours before the appointment slot breach specialist travel allocation and incur a <strong>₹200 convenience fee</strong>.<br />
                • For Cash on Delivery orders, the ₹200 fee is recorded on your customer ledger. For prepaid orders, the ₹200 fee is deducted from the refund balance.
              </p>
            </div>
          </section>

          {/* Section 14 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              14. Rescheduling Policy
            </h2>
            <p>
              Clients may request a change of date or time slot by contacting our support team via call or WhatsApp at least 2 hours prior to the original appointment. Rescheduling is subject to specialist availability in your locality and carries zero fee if notified on time.
            </p>
          </section>

          {/* Section 15 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              15. Customer Support & Grievance Redressal
            </h2>
            <p>
              For any queries, feedback, or grievances, clients may directly contact our dedicated Customer Support Lead:
            </p>
            <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DDD3] text-xs space-y-1">
              <p><strong>Support Lead:</strong> {BUSINESS_CONFIG.contactPerson}</p>
              <p><strong>Direct Helpline:</strong> <a href={BUSINESS_CONFIG.phoneTel} className="text-[#4A0417] font-bold hover:underline">{BUSINESS_CONFIG.phone}</a></p>
              <p><strong>Official Email:</strong> <a href={BUSINESS_CONFIG.emailMailto} className="text-[#4A0417] font-bold hover:underline">{BUSINESS_CONFIG.email}</a></p>
              <p><strong>Hours of Operation:</strong> 08:00 AM – 06:00 PM (Monday – Sunday)</p>
            </div>
          </section>

          {/* Section 16 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              16. Modifications to Terms
            </h2>
            <p>
              BeautyDoor reserves the right to amend these Terms and Conditions at any time to reflect updates in regulatory requirements, operational policies, or service pricing. Revisions take effect immediately upon publication on this page with an updated effective date.
            </p>
          </section>

          {/* Section 17 */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              17. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, controversy, or claim arising out of or relating to your use of the BeautyDoor platform shall be subject to the exclusive jurisdiction of the competent courts of <strong>New Delhi, India</strong>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};
