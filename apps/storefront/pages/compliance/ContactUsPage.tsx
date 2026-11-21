import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle2, AlertCircle, ShieldCheck, HelpCircle } from 'lucide-react';
import { useRouter } from '../../router.tsx';
import { BUSINESS_CONFIG } from '../../../../src/config/businessConfig.ts';

interface Props {
  settings?: Record<string, string> | null;
}

export const ContactUsPage: React.FC<Props> = ({ settings }) => {
  const { navigate } = useRouter();

  // Contact form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Booking Enquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Contact BeautyDoor — Support, Helpline & Service Areas';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Reach BeautyDoor client support at +91 78277 22522, WhatsApp, or hello@beautydoor.in. Dedicated doorstep salon support across Delhi NCR 7 days a week.'
    );
  }, []);

  const supportPhone = settings?.contact_phone || BUSINESS_CONFIG.phone;
  const supportEmail = settings?.contact_email || BUSINESS_CONFIG.email;
  const supportWhatsapp = settings?.support_whatsapp || BUSINESS_CONFIG.whatsapp;
  const contactPerson = settings?.contact_name || BUSINESS_CONFIG.contactPerson;
  const cleanPhone = supportPhone.replace(/\D/g, '');
  const operationalAddress = settings?.operational_address || BUSINESS_CONFIG.hubLocations;
  const legalEntity = settings?.legal_business_name || 'BeautyDoor';

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      setSubmitError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      setSubmitError('Please enter your message or question (minimum 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch('/api/storefront/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: `+91 ${cleanDigits}`,
          email: email.trim() || undefined,
          topic,
          message: message.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry');
      }
      setSubmitSuccess(data.message || 'Your enquiry has been received. Our team will contact you shortly.');
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setSubmitError(err.message || 'Unable to submit enquiry. Please call or WhatsApp us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <li className="text-[#4A0417] font-semibold">Contact Us</li>
          </ol>
        </nav>

        {/* Page Hero Header */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8DDD3] text-xs font-semibold text-[#4A0417] shadow-xs">
            <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Dedicated Doorstep Salon Support</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F1A1C] tracking-tight">
            Customer Support & Helpline
          </h1>
          <p className="text-sm sm:text-base text-[#5C4D4F] font-light leading-relaxed max-w-2xl">
            Have questions regarding appointment slots, bridal packages, or service areas? Our client care team is active 7 days a week from {BUSINESS_CONFIG.operatingHoursDisplay}.
          </p>
        </header>

        {/* 4 Direct Contact Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Phone Call */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-2 hover:border-[#4A0417] transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] flex items-center justify-center text-[#4A0417]">
              <Phone className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-[#1F1A1C]">Call Helpline</h2>
            <p>
              <a
                href={`tel:+${cleanPhone}`}
                className="text-xs text-[#4A0417] font-bold tabular-nums hover:underline"
                title="Call BeautyDoor Support"
              >
                {supportPhone}
              </a>
            </p>
            <p className="text-[11px] text-[#8C7A7C]">Daily: {BUSINESS_CONFIG.operatingHoursDisplay}</p>
          </div>

          {/* WhatsApp */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/15 shadow-xs space-y-2 hover:border-emerald-500 transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <MessageCircle className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-[#1F1A1C]">WhatsApp Chat</h2>
            <p>
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 font-bold tabular-nums hover:underline"
                title="Chat on WhatsApp"
              >
                {supportWhatsapp}
              </a>
            </p>
            <p className="text-[11px] text-[#8C7A7C]">Instant bookings & enquiries</p>
          </div>

          {/* Email */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-2 hover:border-[#4A0417] transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] flex items-center justify-center text-[#4A0417]">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-[#1F1A1C]">Email Support</h2>
            <p>
              <a
                href={`mailto:${supportEmail}`}
                className="text-xs text-[#4A0417] font-bold hover:underline truncate block"
                title="Email BeautyDoor Support"
              >
                {supportEmail}
              </a>
            </p>
            <p className="text-[11px] text-[#8C7A7C]">Responses within 2 business hours</p>
          </div>

          {/* Operational Hub */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-2 hover:border-[#4A0417] transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] flex items-center justify-center text-[#4A0417]">
              <MapPin className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-[#1F1A1C]">Operational Hubs</h2>
            <p className="text-xs text-[#6B5A5C] leading-snug">
              {operationalAddress}
            </p>
            <p className="text-[11px] text-[#8C7A7C]">Doorstep dispatch across NCR</p>
          </div>
        </div>

        {/* Operating Hours & Policy Summary */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#4A0417]">
            <Clock className="w-5 h-5 text-[#C5A880]" />
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              Operational Schedule & Escalation Contact
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#554749]">
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1">
              <p><strong>Client Support Lead:</strong> {contactPerson}</p>
              <p><strong>Operating Days:</strong> Monday through Sunday (7 Days a Week)</p>
              <p><strong>Service Slot Window:</strong> 8:00 AM – 6:00 PM</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1">
              <p><strong>Service Territory:</strong> Entire Delhi NCR Region</p>
              <p><strong>Minimum Order Amount:</strong> Delhi ₹1,000 · Haryana ₹1,500 · Noida ₹1,500</p>
              <p><strong>Doorstep Travel Fee:</strong> ₹0 (Free arrival across all active territories)</p>
            </div>
          </div>
          <p className="text-[11px] text-[#7A6B6D] leading-relaxed">
            * For official business verification, registered entity legal details are displayed in our Terms of Service. In compliance with payment aggregator requirements, registered office records are maintained with our banking partners.
          </p>
        </section>

        {/* Interactive Customer Contact Form */}
        <section className="bg-white p-6 sm:p-10 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-[#1F1A1C]">
              Send Us an Enquiry
            </h2>
            <p className="text-xs text-[#6B5A5C]">
              Submit your request below and our dispatch coordinator will respond to your mobile number or email.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Message Sent Successfully</p>
                <p className="mt-0.5 leading-relaxed">{submitSuccess}</p>
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-950">Submission Error</p>
                <p className="mt-0.5 leading-relaxed">{submitError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitEnquiry} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#1F1A1C] block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Radhika Sharma"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-lg focus:outline-none focus:border-[#4A0417]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F1A1C] block mb-1">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98112 00000"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-lg focus:outline-none focus:border-[#4A0417] tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#1F1A1C] block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. radhika@example.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-lg focus:outline-none focus:border-[#4A0417]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F1A1C] block mb-1">Topic / Subject *</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-lg focus:outline-none focus:border-[#4A0417]"
                >
                  <option value="Booking Enquiry">Booking Enquiry & Slot Reservation</option>
                  <option value="Rescheduling Request">Rescheduling / Date Change</option>
                  <option value="VLCC Special Package">VLCC ₹999 Facial & Waxing Package</option>
                  <option value="Pre-Bridal Consultation">Pre-Bridal & Group Booking</option>
                  <option value="Payment / COD Query">Payment & Doorstep COD Query</option>
                  <option value="Feedback / Support">Feedback / Quality Concern</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1F1A1C] block mb-1">Your Message *</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your question or requirements..."
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-lg focus:outline-none focus:border-[#4A0417] leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{isSubmitting ? 'Sending Message...' : 'Submit Enquiry'}</span>
            </button>
          </form>
        </section>

      </div>
    </div>
  );
};
