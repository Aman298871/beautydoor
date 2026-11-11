import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, X, Send, Sparkles, Phone, ChevronRight,
  RotateCcw, HelpCircle, ExternalLink, Calendar, CheckCircle2,
  Clock, ShieldCheck, MapPin, Tag, Heart, ArrowLeft, Lightbulb,
  MessageCircle, Smartphone, UserCheck, CreditCard
} from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../src/config/businessConfig.ts';
import {
  CHATBOT_CATEGORIES,
  CHATBOT_ANSWERS,
  matchQueryToAnswer,
  ChatbotCategory,
  ChatbotAnswer
} from '../data/chatbotKnowledgeBase.ts';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionType?: 'book' | 'booking' | 'contact' | 'packages' | 'services';
  followUpQuestionIds?: string[];
}

interface CustomerChatbotProps {
  onOpenBookingModal?: () => void;
  isDrawerOpen?: boolean;
}

export const CustomerChatbot: React.FC<CustomerChatbotProps> = ({ onOpenBookingModal, isDrawerOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: "Hi! Welcome to BeautyDoor ❤️\nHow can I help you today? Select a topic below or type your question.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Guided navigation state (Shivnath pattern)
  const [currentCategory, setCurrentCategory] = useState<ChatbotCategory | null>(null);
  const [currentSubcategory, setCurrentSubcategory] = useState<{ id: string; name: string; questionIds: string[] } | null>(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
  const [activeFollowUps, setActiveFollowUps] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading, currentCategory, currentSubcategory]);

  // Actions
  const handleSelectCategory = (cat: ChatbotCategory) => {
    setCurrentCategory(cat);
    setCurrentSubcategory(null);
    setActiveFollowUps([]);
  };

  const handleSelectSubcategory = (sub: { id: string; name: string; questionIds: string[] }) => {
    setCurrentSubcategory(sub);
    setActiveFollowUps([]);
  };

  const handleBackNavigation = () => {
    if (currentSubcategory) {
      setCurrentSubcategory(null);
    } else if (currentCategory) {
      setCurrentCategory(null);
    }
  };

  const handleResetToMainMenu = () => {
    setCurrentCategory(null);
    setCurrentSubcategory(null);
    setActiveFollowUps([]);
  };

  const handleRestartConversation = () => {
    setMessages([
      {
        id: 'msg-welcome-' + Date.now(),
        sender: 'bot',
        text: "Hi! Welcome to BeautyDoor ❤️\nHow can I help you today? Select a topic below or type your question.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setUsedQuestionIds(new Set());
    setCurrentCategory(null);
    setCurrentSubcategory(null);
    setActiveFollowUps([]);
  };

  const handleSelectQuestionById = (qId: string) => {
    const item = CHATBOT_ANSWERS[qId];
    if (!item) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mark question as asked so it is removed from suggestions
    setUsedQuestionIds(prev => new Set(prev).add(qId));

    // Append user question
    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: item.question,
      timestamp: timeStr
    };

    // Append bot answer
    const botMsg: Message = {
      id: 'bot-' + Date.now(),
      sender: 'bot',
      text: item.answer,
      timestamp: timeStr,
      actionType: item.actionType,
      followUpQuestionIds: item.followUpQuestionIds
    };

    setMessages(prev => [...prev, userMsg, botMsg]);

    // Set contextual follow-up chips
    if (item.followUpQuestionIds && item.followUpQuestionIds.length > 0) {
      setActiveFollowUps(item.followUpQuestionIds.filter(id => !usedQuestionIds.has(id)));
    } else {
      setActiveFollowUps([]);
    }
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setInputText('');

    // Append user message
    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: timeStr
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      const match = matchQueryToAnswer(query);

      if (match) {
        setUsedQuestionIds(prev => new Set(prev).add(match.id));
        const botMsg: Message = {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: match.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: match.actionType,
          followUpQuestionIds: match.followUpQuestionIds
        };
        setMessages(prev => [...prev, botMsg]);
        if (match.followUpQuestionIds) {
          setActiveFollowUps(match.followUpQuestionIds.filter(id => !usedQuestionIds.has(id)));
        }
      } else {
        const botMsg: Message = {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: `I want to make sure you get the exact information you need!

While I don't have an exact match for "${query}", you can:
• Explore our popular topics below, OR
• Connect with our customer support on WhatsApp (${BUSINESS_CONFIG.phone}) for immediate assistance.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: 'contact',
          followUpQuestionIds: ['faq-price-rates', 'faq-how-to-book', 'faq-min-order-city', 'faq-pay-cod-upi']
        };
        setMessages(prev => [...prev, botMsg]);
        setActiveFollowUps(['faq-price-rates', 'faq-how-to-book', 'faq-min-order-city', 'faq-pay-cod-upi']);
      }
      setLoading(false);
    }, 200);
  };

  // Do not render floating button or chat panel when checkout drawer is open
  if (isDrawerOpen) {
    return null;
  }

  // Get visible questions for current subcategory (excluding already asked questions)
  const currentQuestions = currentSubcategory
    ? currentSubcategory.questionIds
      .filter(qId => !usedQuestionIds.has(qId))
      .map(qId => CHATBOT_ANSWERS[qId])
      .filter(Boolean)
    : [];

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-3">
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur px-3.5 py-2 rounded-full shadow-lg border border-[#E8DDD3] text-xs font-medium text-[#1F1A1C] cursor-pointer hover:border-[#4A0417] transition-all group"
          >
            <span className="font-semibold text-[#4A0417]">Need Help?</span>
            <span className="text-[#6B5A5C]">Chat with Customer Support</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open BeautyDoor Customer Support"
          className="relative w-14 h-14 rounded-full bg-[#4A0417] text-white shadow-2xl hover:shadow-[#4A0417]/40 flex items-center justify-center border-2 border-[#C5A880]/60 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 text-[#FAF7F2]" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#C5A880] border border-white text-[9px] font-bold text-[#4A0417] items-center justify-center">1</span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Floating Inline Chat Panel */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto sm:w-[420px] max-h-[82vh] sm:max-h-[640px] h-[580px] bg-white rounded-3xl shadow-2xl border border-[#E8DDD3] flex flex-col z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="bg-[#4A0417] text-white px-5 py-4 flex items-center justify-between border-b border-[#C5A880]/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#C5A880] to-[#E8DDD3] flex items-center justify-center text-[#4A0417] font-bold shadow-md">
                <Sparkles className="w-5 h-5 text-[#4A0417]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base tracking-wide text-[#FAF7F2]">BeautyDoor Customer Support</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded-full font-medium">Online</span>
                </div>
                <p className="text-[11px] text-[#FAF7F2]/80">Doorstep salon assistance across Delhi NCR</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleRestartConversation}
                title="Restart conversation"
                className="p-1.5 text-[#FAF7F2]/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-[#FAF7F2]/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF7F2]">

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-xs ${m.sender === 'user'
                      ? 'bg-[#4A0417] text-white rounded-tr-none'
                      : 'bg-white text-[#1F1A1C] border border-[#E8DDD3] rounded-tl-none'
                    }`}
                >
                  <p className="whitespace-pre-line leading-relaxed font-normal">{m.text}</p>
                </div>

                <span className="text-[10px] text-[#8C7A7C] mt-1 px-1">
                  {m.timestamp}
                </span>

                {/* Direct Action Buttons on bot messages */}
                {m.sender === 'bot' && m.id !== 'msg-welcome' && (
                  <div className="mt-2.5 flex flex-wrap gap-2 pl-1">
                    <a
                      href={`${BUSINESS_CONFIG.whatsappUrl}?text=Hi%20BeautyDoor,%20I%20have%20a%20question%20about%20at-home%20services`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-full font-medium transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span>WhatsApp ({BUSINESS_CONFIG.phone})</span>
                    </a>

                    <a
                      href={BUSINESS_CONFIG.phoneTel}
                      className="inline-flex items-center gap-1 text-[11px] bg-stone-100 hover:bg-stone-200 text-[#4A3E3D] px-3 py-1.5 rounded-full font-medium transition-colors"
                    >
                      <Phone className="w-3 h-3 text-[#4A0417]" />
                      <span>Call Support</span>
                    </a>

                    {onOpenBookingModal && (
                      <button
                        onClick={onOpenBookingModal}
                        className="inline-flex items-center gap-1 text-[11px] bg-amber-50 hover:bg-amber-100 text-[#4A0417] border border-amber-300 px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Book / Open Cart</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Contextual Follow-Up Suggestions (if active) */}
            {activeFollowUps.length > 0 && (
              <div className="bg-white rounded-2xl p-3 border border-[#E8DDD3] shadow-2xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A0417] uppercase tracking-wider">
                  <Lightbulb className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Related Follow-Up Questions:</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {activeFollowUps.map(qId => {
                    const qItem = CHATBOT_ANSWERS[qId];
                    if (!qItem) return null;
                    return (
                      <button
                        key={qId}
                        onClick={() => handleSelectQuestionById(qId)}
                        className="text-left text-xs bg-[#FAF7F2] hover:bg-[#F2ECE3] text-[#1F1A1C] hover:text-[#4A0417] px-3 py-2 rounded-xl border border-[#E8DDD3] transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <span className="font-medium">{qItem.question}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#8C7A7C] group-hover:text-[#4A0417] shrink-0 ml-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Guided Conversation Navigator (Shivnath Pattern) */}
            <div className="bg-white rounded-2xl p-3.5 border border-[#E8DDD3] shadow-2xs mt-2 space-y-2.5">

              {/* Header with Navigation Breadcrumbs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-bold text-[#4A0417] uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>
                    {currentSubcategory
                      ? currentSubcategory.name
                      : currentCategory
                        ? currentCategory.name
                        : 'Browse by Topic'}
                  </span>
                </div>

                {(currentCategory || currentSubcategory) && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBackNavigation}
                      className="text-[11px] font-semibold text-[#4A0417] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back</span>
                    </button>
                    <span className="text-[#C5A880]">·</span>
                    <button
                      type="button"
                      onClick={handleResetToMainMenu}
                      className="text-[11px] font-semibold text-[#6B5A5C] hover:underline cursor-pointer"
                    >
                      Main Menu
                    </button>
                  </div>
                )}
              </div>

              {/* LEVEL 1: Main 11 Categories */}
              {!currentCategory && (
                <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {CHATBOT_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat)}
                      className="p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE3] border border-[#E8DDD3] hover:border-[#C5A880] text-left transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <span className="text-xs font-bold text-[#1F1A1C] group-hover:text-[#4A0417] leading-tight">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-[#6B5A5C] mt-1 line-clamp-1">
                        {cat.tagline}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* LEVEL 2: Subcategories inside Selected Category */}
              {currentCategory && !currentSubcategory && (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {currentCategory.subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSubcategory(sub)}
                      className="w-full p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE3] border border-[#E8DDD3] hover:border-[#C5A880] text-left transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <span className="text-xs font-bold text-[#1F1A1C] group-hover:text-[#4A0417]">
                          {sub.name}
                        </span>
                        <span className="text-[10px] text-[#8C7A7C] block">
                          {sub.questionIds.length} common questions
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8C7A7C] group-hover:text-[#4A0417] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}

              {/* LEVEL 3: Questions list inside Selected Subcategory */}
              {currentCategory && currentSubcategory && (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {currentQuestions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#8C7A7C]">
                      All questions in this section have been answered! Select another category or type below.
                    </div>
                  ) : (
                    currentQuestions.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectQuestionById(item.id)}
                        className="w-full p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-amber-50/80 border border-[#E8DDD3] hover:border-amber-300 text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <span className="text-xs font-medium text-[#1F1A1C] group-hover:text-[#4A0417] leading-snug">
                          {item.question}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#8C7A7C] group-hover:text-[#4A0417] shrink-0 ml-2" />
                      </button>
                    ))
                  )}
                </div>
              )}

            </div>

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#8C7A7C] italic pl-2 py-1">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A0417] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A0417] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A0417] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Checking BeautyDoor knowledgebase...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input for Typed Queries */}
          <div className="p-3 bg-white border-t border-[#E8DDD3] shrink-0">
            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask in English or Hindi (e.g. 'facial price', 'ghar pe aate ho')..."
                className="flex-1 bg-[#FAF7F2] hover:bg-[#F2ECE3]/80 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-[#E8DDD3] focus:border-[#4A0417] focus:outline-hidden transition-all placeholder:text-[#8C7A7C] text-[#1F1A1C]"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                aria-label="Send query"
                className="w-9 h-9 rounded-xl bg-[#4A0417] hover:bg-[#36020F] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#C5A880]" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-[#8C7A7C]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified BeautyDoor Support
              </span>
              <span>Delhi NCR Doorstep Service</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
};
