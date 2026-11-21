import React, { useEffect } from 'react';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, Phone, Mail, HelpCircle, Server } from 'lucide-react';
import { useRouter } from '../../router.tsx';
import { BUSINESS_CONFIG } from '../../../../src/config/businessConfig.ts';

interface Props {
  settings?: Record<string, string> | null;
}

export const PrivacyPage: React.FC<Props> = ({ settings }) => {
  const { navigate } = useRouter();

  useEffect(() => {
    document.title = 'Privacy Policy — BeautyDoor Client Data Protection';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Learn how BeautyDoor collects, uses, and protects customer details, service addresses, and appointment data for at-home salon visits in Delhi NCR.'
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
            <li className="text-[#4A0417] font-semibold">Privacy Policy</li>
          </ol>
        </nav>

        {/* Hero Header */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8DDD3] text-xs font-semibold text-[#4A0417] shadow-xs">
            <Lock className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Transparency & Data Protection Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F1A1C] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6B6D]">
            Last Updated: {lastUpdated} • Data Controller: <strong>{legalEntity}</strong> (Operating as <strong>BeautyDoor</strong>)
          </p>
        </header>

        {/* Commitment Banner */}
        <div className="p-5 rounded-2xl bg-white border border-[#E8DDD3] shadow-xs space-y-2 text-xs text-[#554749]">
          <div className="flex items-center gap-2 text-[#4A0417] font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
            <span>Our Privacy Commitment to Clients</span>
          </div>
          <p className="leading-relaxed">
            At BeautyDoor, we take your personal privacy with the highest degree of seriousness. Because our specialists deliver services inside your private home, we collect only the essential personal details required to schedule your appointment, route our certified female specialists safely, and maintain transparent booking records. We do not sell your personal data to advertising brokers.
          </p>
        </div>

        {/* Main Content Body */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-8 text-xs sm:text-sm text-[#4A3E3D] leading-relaxed">

          {/* 1. Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">1</span>
              <span>Information We Collect</span>
            </h2>
            <p>
              When you use our website, place bookings, or interact with customer care, we may collect and process:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1">
                <span className="font-bold text-[#4A0417] text-xs">Identification & Contact Data:</span>
                <p className="text-[11px] text-[#554749]">
                  Full name, 10-digit Indian mobile number, and optional email address.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1">
                <span className="font-bold text-[#4A0417] text-xs">Doorstep Service Address:</span>
                <p className="text-[11px] text-[#554749]">
                  Flat/house number, floor, building/apartment name, landmark, locality, city, and PIN code.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1">
                <span className="font-bold text-[#4A0417] text-xs">Appointment & Treatment Data:</span>
                <p className="text-[11px] text-[#554749]">
                  Selected rituals, packages (e.g. VLCC Facial variant), date, preferred slot, payment method (COD), and special instructions.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1">
                <span className="font-bold text-[#4A0417] text-xs">Support & Communication History:</span>
                <p className="text-[11px] text-[#554749]">
                  Enquiry form submissions, feedback notes, customer support WhatsApp logs, and notification delivery receipts.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Why We Collect & How It Is Used */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">2</span>
              <span>Purpose & Usage of Collected Data</span>
            </h2>
            <p>
              Your personal information is processed strictly for legitimate operational purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#554749]">
              <li><strong>Appointment Fulfillment:</strong> Scheduling female specialists, planning transit routes, and delivering at-home services.</li>
              <li><strong>Customer Notifications:</strong> Dispatching booking-received notifications, confirmation notices, specialist arrival status, and cancellation alerts via SMS, WhatsApp, or Email.</li>
              <li><strong>Account Management & Invoicing:</strong> Storing your appointment history, issuing digital receipts, and managing payment ledgers.</li>
              <li><strong>Customer Support:</strong> Resolving enquiries, handling rescheduling requests, and addressing client feedback.</li>
              <li><strong>Fraud Prevention & Platform Security:</strong> Preventing duplicate or illegitimate bookings and protecting specialist safety.</li>
            </ul>
          </section>

          {/* 3. Booking Data & Specialist Sharing */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">3</span>
              <span>Specialist Access & Confidentiality</span>
            </h2>
            <p>
              Your contact number and doorstep address are shared <strong>solely with the designated certified female beautician</strong> assigned to fulfill your specific booking. Specialists receive this information only for the duration necessary to navigate to your home and perform the confirmed treatments. Specialists are contractually forbidden from utilizing client numbers for personal marketing or sharing them with third parties.
            </p>
          </section>

          {/* 4. Phone OTP & Authentication */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">4</span>
              <span>Authentication & One-Time Passwords</span>
            </h2>
            <p>
              When logging in to view your bookings or manage addresses, authentication is verified through mobile OTP (via Firebase Phone Authentication or SMS gateway). OTP codes are temporary, time-bound, and securely validated server-side. BeautyDoor does not store raw passwords for customer accounts.
            </p>
          </section>

          {/* 5. Third-Party Infrastructure Providers */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">5</span>
              <span>Third-Party Service Infrastructure</span>
            </h2>
            <p>
              To deliver a reliable digital service, BeautyDoor integrates with trusted technical infrastructure providers under strict confidentiality agreements:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#554749]">
              <li><strong>Telephony & SMS Delivery:</strong> Indian telecom DLT-compliant SMS gateways (such as MSG91, Fast2SMS, or Twilio) for transactional OTPs and booking alerts.</li>
              <li><strong>Email Communications:</strong> SMTP service infrastructure for booking confirmation emails and digital receipts.</li>
              <li><strong>Cloud Hosting & Database:</strong> Secure cloud server facilities and managed PostgreSQL databases hosted in secure data centers.</li>
              <li><strong>Payment Aggregator:</strong> Official Razorpay gateway integration for future approved digital payments. Razorpay processes transactions in adherence to PCI-DSS standards; BeautyDoor never stores full card numbers or banking passwords.</li>
            </ul>
          </section>

          {/* 6. Data Security Practices */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">6</span>
              <span>Data Protection & Security Safeguards</span>
            </h2>
            <p>
              We implement reasonable administrative, technical, and physical safeguards:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#554749]">
              <li>All web traffic between your browser and our servers is encrypted using Transport Layer Security (TLS / HTTPS).</li>
              <li>Administrative access to customer booking records is restricted behind multi-factor administrative authentication and logged in immutable audit records.</li>
              <li>Database credentials and API secrets are isolated in protected server environments and never exposed in client-side bundles.</li>
            </ul>
          </section>

          {/* 7. Data Retention */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">7</span>
              <span>Data Retention Period</span>
            </h2>
            <p>
              We retain customer personal data and booking ledgers for as long as your account remains active, and as required to fulfill statutory tax, accounting, and dispute resolution obligations under applicable Indian law (typically up to 7 years for financial booking records). Customer enquiry submissions and transient chat queries are retained for up to 12 months for quality auditing.
            </p>
          </section>

          {/* 8. Customer Privacy Rights & Grievance Contact */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">8</span>
              <span>Your Privacy Rights & Grievance Redressal</span>
            </h2>
            <p>
              Under applicable Indian data protection principles, you possess the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#554749]">
              <li>Request a summary of your personal information held in our records.</li>
              <li>Request correction or updating of inaccurate phone numbers or addresses.</li>
              <li>Request deletion or anonymization of your profile (subject to statutory financial retention limits).</li>
            </ul>
            <p className="pt-2">
              To exercise these rights, please write to our dedicated Customer Support Lead:
            </p>
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] text-xs space-y-1 mt-2">
              <p><strong>Grievance & Privacy Lead:</strong> {BUSINESS_CONFIG.contactPerson}</p>
              <p><strong>Entity Name:</strong> {legalEntity} (BeautyDoor)</p>
              <p><strong>Email:</strong> <a href={BUSINESS_CONFIG.emailMailto} className="text-[#4A0417] font-bold hover:underline">{BUSINESS_CONFIG.email}</a></p>
              <p><strong>Telephone:</strong> <a href={BUSINESS_CONFIG.phoneTel} className="text-[#4A0417] font-bold hover:underline">{BUSINESS_CONFIG.phone}</a></p>
              <p><strong>Response SLA:</strong> Inquiries acknowledged within 24 business hours.</p>
            </div>
          </section>

          {/* 9. Policy Updates */}
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">9</span>
              <span>Policy Updates & Notifications</span>
            </h2>
            <p>
              We may revise this Privacy Policy periodically to reflect enhancements in technology, service offerings, or legal regulations. The revised policy will be posted on this URL with an updated Effective Date. Continued use of BeautyDoor after revisions constitutes acceptance of the updated terms.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};
