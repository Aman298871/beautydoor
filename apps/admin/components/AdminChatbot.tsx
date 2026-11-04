import React, { useState, useEffect, useRef } from 'react';
import { 
  HelpCircle, X, Search, ChevronRight, BookOpen, 
  ExternalLink, ArrowRight, RotateCcw, ShieldCheck, CheckCircle2,
  Sparkles
} from 'lucide-react';

interface AdminQuestion {
  id: string;
  category: string;
  question: string;
  display_order: number;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  suggestedOptions?: { id: string; question: string }[];
}

interface AdminChatbotProps {
  token: string | null;
  onNavigateTab?: (tabName: string) => void;
}

export const AdminChatbot: React.FC<AdminChatbotProps> = ({ token, onNavigateTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      fetchAdminHelp();
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const fetchAdminHelp = async () => {
    try {
      const res = await fetch('/api/faq/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        if (messages.length === 0) {
          setMessages([
            {
              id: 'admin-msg-welcome',
              sender: 'bot',
              text: data.welcomeMessage || "Welcome to BeautyDoor Admin Help. What would you like assistance with?",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load admin FAQs:', err);
    }
  };

  const handleSelectQuestion = async (q: AdminQuestion) => {
    const userMsgId = 'user-' + Date.now();
    const botMsgId = 'bot-' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', text: q.question, timestamp: timeStr }
    ]);

    setLoading(true);

    try {
      const res = await fetch('/api/faq/admin/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            text: data.fallbackMessage || "No step-by-step instructions found. Please choose from the options below.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedOptions: data.suggestedOptions || []
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: "An error occurred retrieving help content. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q || loading) return;

    const userMsgId = 'user-' + Date.now();
    const botMsgId = 'bot-' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setSearchQuery('');
    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', text: q, timestamp: timeStr }
    ]);

    setLoading(true);

    try {
      const res = await fetch('/api/faq/admin/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: q })
      });

      const data = await res.json();
      if (data.matched && data.faq) {
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            text: data.faq.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            text: data.fallbackMessage || "No specific admin guide matched your search. Select a help topic below:",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedOptions: data.suggestedOptions || []
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: "Unable to complete search. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'admin-msg-welcome-' + Date.now(),
        sender: 'bot',
        text: "Welcome to BeautyDoor Admin Help. What would you like assistance with?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Helper to detect tab shortcut recommendation
  const getTabShortcut = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('service') && lower.includes('add') || lower.includes('pricing')) return { tab: 'services', label: 'Go to Services Catalog' };
    if (lower.includes('promotion') || lower.includes('campaign')) return { tab: 'campaigns', label: 'Go to Campaigns' };
    if (lower.includes('coupon')) return { tab: 'coupons', label: 'Go to Coupons' };
    if (lower.includes('booking') || lower.includes('dispatch') || lower.includes('assign')) return { tab: 'dispatch', label: 'Go to Dispatch & Bookings' };
    if (lower.includes('territor') || lower.includes('pincode') || lower.includes('area')) return { tab: 'territories', label: 'Go to Pincodes & Hubs' };
    if (lower.includes('banner') || lower.includes('setting')) return { tab: 'settings', label: 'Go to Settings & Branding' };
    if (lower.includes('customer')) return { tab: 'customers', label: 'Go to Customers' };
    if (lower.includes('review')) return { tab: 'reviews', label: 'Go to Reviews Moderation' };
    return null;
  };

  const categories = ['All', ...Array.from(new Set(questions.map(q => q.category)))];
  const filteredQuestions = selectedCategory === 'All' 
    ? questions 
    : questions.filter(q => q.category === selectedCategory);

  return (
    <>
      {/* Floating Admin Help Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="BeautyDoor Admin Help"
        className="fixed bottom-6 right-6 z-40 bg-[#1F1A1C] hover:bg-[#382F32] text-amber-200 border border-amber-300/30 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
      >
        <BookOpen className="w-4 h-4 text-amber-300" />
        <span>Admin Help Assistant</span>
      </button>

      {/* Admin Help Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="bg-[#1F1A1C] text-white p-4.5 flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 font-bold">
                <HelpCircle className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm tracking-wide text-white">Admin Operations Help</h3>
                <p className="text-[11px] text-stone-400">Step-by-step guidance for enterprise console</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={handleReset}
                title="Restart chat" 
                className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                title="Close drawer" 
                className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 bg-stone-50 border-b border-stone-200">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search admin guides (e.g. 'how to add service', 'dispatch')..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#4A0417]"
              />
            </form>

            {/* Category tabs */}
            {categories.length > 2 && (
              <div className="flex gap-1 overflow-x-auto mt-2 pb-1 no-scrollbar text-[11px]">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-[#1F1A1C] text-amber-200 font-semibold' 
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages & Guides View */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
            {messages.map((m) => {
              const shortcut = m.sender === 'bot' && m.id !== 'admin-msg-welcome' ? getTabShortcut(m.text) : null;

              return (
                <div 
                  key={m.id} 
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                      m.sender === 'user'
                        ? 'bg-[#4A0417] text-white rounded-tr-none'
                        : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line font-normal">{m.text}</p>

                    {/* Operational direct tab jump button */}
                    {shortcut && onNavigateTab && (
                      <div className="mt-3 pt-2.5 border-t border-stone-100">
                        <button
                          onClick={() => {
                            onNavigateTab(shortcut.tab);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-[#4A0417] border border-amber-300/80 px-3 py-1.5 rounded-lg font-semibold text-[11px] transition-colors"
                        >
                          <span>{shortcut.label}</span>
                          <ArrowRight className="w-3 h-3 text-[#4A0417]" />
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-stone-400 mt-1 px-1">
                    {m.timestamp}
                  </span>

                  {/* Fallback suggested options */}
                  {m.suggestedOptions && m.suggestedOptions.length > 0 && (
                    <div className="mt-2 w-full space-y-1.5 pl-2">
                      <p className="text-[11px] font-semibold text-stone-600">Available Topics:</p>
                      <div className="flex flex-col gap-1">
                        {m.suggestedOptions.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              const found = questions.find(q => q.id === opt.id);
                              if (found) handleSelectQuestion(found);
                            }}
                            className="text-xs bg-white hover:bg-amber-50 text-stone-800 border border-stone-200 px-3 py-1.5 rounded-lg text-left transition-colors flex items-center justify-between"
                          >
                            <span>{opt.question}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Predefined Admin Questions list */}
            <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs mt-2">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-100">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Predefined Step-by-Step Guides:
                </span>
                <span className="text-[10px] text-stone-400">10 Core Topics</span>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    disabled={loading}
                    className="w-full text-left text-xs bg-stone-50 hover:bg-amber-50/70 border border-stone-200/80 rounded-xl px-3 py-2 flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <span className="font-medium text-stone-800 group-hover:text-[#4A0417]">{q.question}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#4A0417] transition-transform ml-2 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-xs text-stone-500 italic pl-2 py-1">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F1A1C] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F1A1C] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F1A1C] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Retrieving guide...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer note */}
          <div className="p-3 bg-stone-100 border-t border-stone-200 text-[11px] text-stone-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Private Help System
            </span>
            <span>Editable via FAQ Management</span>
          </div>

        </div>
      )}
    </>
  );
};
