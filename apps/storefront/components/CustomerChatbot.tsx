import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Sparkles, Phone, ChevronRight, 
  RotateCcw, HelpCircle, ExternalLink, Calendar, CheckCircle2,
  Clock, ShieldCheck, MapPin
} from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../src/config/businessConfig.ts';

interface QuestionOption {
  id: string;
  category: string;
  question: string;
  display_order: number;
  is_dynamic?: number;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  suggestedOptions?: { id: string; question: string }[];
  showContactButtons?: boolean;
}

interface CustomerChatbotProps {
  onOpenBookingModal?: () => void;
}

export const CustomerChatbot: React.FC<CustomerChatbotProps> = ({ onOpenBookingModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [supportInfo, setSupportInfo] = useState<{ phone: string; whatsapp: string; cleanWhatsapp: string; contactName: string }>({
    phone: BUSINESS_CONFIG.phone,
    whatsapp: BUSINESS_CONFIG.whatsapp,
    cleanWhatsapp: '919310372015',
    contactName: BUSINESS_CONFIG.contactPerson
  });
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial load: Fetch predefined questions & welcome metadata
  useEffect(() => {
    fetchQuestions();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/faq/customer');
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        if (data.support) {
          setSupportInfo({
            contactName: data.support.contactName || BUSINESS_CONFIG.contactPerson,
            phone: data.support.phone || BUSINESS_CONFIG.phone,
            whatsapp: data.support.whatsapp || BUSINESS_CONFIG.whatsapp,
            cleanWhatsapp: (data.support.whatsapp || BUSINESS_CONFIG.phone).replace(/[^\d]/g, '')
          });
        }
        // Set initial welcome message
        if (messages.length === 0) {
          setMessages([
            {
              id: 'msg-welcome',
              sender: 'bot',
              text: data.welcomeMessage || "Hi! Welcome to BeautyDoor ❤️ How can I help you today?",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load customer FAQ data:', err);
    }
  };

  const handleSelectQuestion = async (q: QuestionOption) => {
    const userMsgId = 'user-' + Date.now();
    const botMsgId = 'bot-' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message immediately
    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', text: q.question, timestamp: timeStr }
    ]);

    setLoading(true);

    try {
      const res = await fetch('/api/faq/customer/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id })
      });

      const data = await res.json();

      if (data.matched && data.faq) {
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            text: data.faq.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            showContactButtons: true
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            text: data.fallbackMessage || "Sorry, I couldn't find an answer to that question. Please select one of the options below or contact our support team.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedOptions: data.suggestedOptions || [],
            showContactButtons: true
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: "Sorry, I couldn't find an answer to that question. Please select one of the options below or contact our support team.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          showContactButtons: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query || loading) return;

    const userMsgId = 'user-' + Date.now();
    const botMsgId = 'bot-' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setInputText('');
    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', text: query, timestamp: timeStr }
    ]);

    setLoading(true);

    try {
      const res = await fetch('/api/faq/customer/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await res.json();

      if (data.matched && data.faq) {
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            text: data.faq.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            showContactButtons: true
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            text: data.fallbackMessage || "Sorry, I couldn't find an answer to that question. Please select one of the options below or contact our support team.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedOptions: data.suggestedOptions || [],
            showContactButtons: true
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: "Sorry, I couldn't find an answer to that question. Please select one of the options below or contact our support team.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          showContactButtons: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'msg-welcome-' + Date.now(),
        sender: 'bot',
        text: "Hi! Welcome to BeautyDoor ❤️ How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const categories = ['All', ...Array.from(new Set(questions.map(q => q.category)))];
  const filteredQuestions = activeCategoryFilter === 'All' 
    ? questions 
    : questions.filter(q => q.category === activeCategoryFilter);

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur px-3.5 py-2 rounded-full shadow-lg border border-amber-200/60 text-xs font-medium text-stone-800 cursor-pointer hover:border-amber-400 transition-all group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Need Help? <strong>Chat with Us</strong></span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open BeautyDoor Assistant"
          className="relative w-14 h-14 rounded-full bg-[#4A0417] text-white shadow-2xl hover:shadow-[#4A0417]/40 flex items-center justify-center border-2 border-amber-300/40 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 text-amber-200" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border border-white text-[9px] font-bold text-white items-center justify-center">1</span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-22 sm:bottom-24 sm:right-6 sm:left-auto sm:w-[420px] max-h-[85vh] sm:max-h-[640px] h-[580px] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="bg-[#4A0417] text-white px-5 py-4 flex items-center justify-between border-b border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 flex items-center justify-center text-[#4A0417] font-bold shadow-md">
                <Sparkles className="w-5 h-5 text-[#4A0417]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base tracking-wide text-amber-100">BeautyDoor Concierge</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded-full font-medium">Online</span>
                </div>
                <p className="text-[11px] text-amber-200/80">At-home salon help in Delhi NCR</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={handleResetChat} 
                title="Restart conversation"
                className="p-1.5 text-amber-200/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                title="Close chat"
                className="p-1.5 text-amber-200/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/70">
            
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-[#4A0417] text-white rounded-tr-none'
                      : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed font-normal">{m.text}</p>
                </div>
                
                <span className="text-[10px] text-stone-400 mt-1 px-1">
                  {m.timestamp}
                </span>

                {/* Suggested options if fallback occurred */}
                {m.suggestedOptions && m.suggestedOptions.length > 0 && (
                  <div className="mt-2.5 w-full space-y-1.5 pl-2">
                    <p className="text-xs font-semibold text-stone-600">Suggested Topics:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestedOptions.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            const found = questions.find(q => q.id === opt.id);
                            if (found) handleSelectQuestion(found);
                          }}
                          className="text-xs bg-white hover:bg-amber-50 text-stone-700 hover:text-[#4A0417] border border-stone-200 hover:border-amber-300 px-3 py-1.5 rounded-full transition-all text-left shadow-2xs"
                        >
                          {opt.question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick actions after assistant answers */}
                {m.sender === 'bot' && m.id !== 'msg-welcome' && m.showContactButtons && (
                  <div className="mt-3 flex flex-wrap gap-2 pl-2">
                    <a
                      href={`https://wa.me/${supportInfo.cleanWhatsapp}?text=Hi%20BeautyDoor%20Concierge,%20I%20have%20a%20question%20about%20at-home%20services`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-full font-medium transition-colors"
                    >
                      <span>💬 Chat on WhatsApp</span>
                      <ExternalLink className="w-3 h-3 text-emerald-600" />
                    </a>

                    <a
                      href={`tel:${supportInfo.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-full font-medium transition-colors"
                    >
                      <Phone className="w-3 h-3 text-stone-500" />
                      <span>Call Concierge</span>
                    </a>

                    {onOpenBookingModal && (
                      <button
                        onClick={onOpenBookingModal}
                        className="inline-flex items-center gap-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-full font-medium transition-colors"
                      >
                        <Calendar className="w-3 h-3 text-amber-700" />
                        <span>Book Appointment</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Predefined FAQ Buttons (Show when user is at welcome or after asking) */}
            <div className="bg-white rounded-2xl p-3.5 border border-amber-100 shadow-2xs mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  Popular Questions:
                </span>
                <span className="text-[10px] text-stone-400">Tap to answer</span>
              </div>

              {/* Category Filter Pills */}
              {categories.length > 2 && (
                <div className="flex gap-1 overflow-x-auto pb-2 mb-2 no-scrollbar text-[11px]">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                        activeCategoryFilter === cat 
                          ? 'bg-[#4A0417] text-amber-200 font-medium' 
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Question list */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {filteredQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    disabled={loading}
                    className="w-full text-left text-xs bg-stone-50 hover:bg-amber-50/80 hover:text-[#4A0417] border border-stone-200/80 hover:border-amber-300/80 rounded-xl px-3 py-2 flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <span className="font-medium text-stone-800 group-hover:text-[#4A0417]">{q.question}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-xs text-stone-500 italic pl-2 py-1">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A0417] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A0417] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A0417] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Checking live database...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-stone-200">
            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type question (e.g. 'price of facial', 'ghar pe aate ho')..."
                className="flex-1 bg-stone-100 hover:bg-stone-100/80 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#4A0417] focus:outline-none transition-all placeholder:text-stone-400 text-stone-800"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                aria-label="Send query"
                className="w-9 h-9 rounded-xl bg-[#4A0417] hover:bg-[#60061e] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0"
              >
                <Send className="w-4 h-4 text-amber-200" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-stone-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Predefined & dynamic database answers
              </span>
              <span>Delhi NCR only</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
};
