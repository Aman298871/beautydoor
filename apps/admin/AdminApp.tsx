import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  MapPin,
  Tag,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Phone,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Download,
  AlertCircle,
  LogOut,
  Lock,
  UserCheck,
  Megaphone,
  Sparkles,
  RefreshCw,
  FileText,
  HelpCircle,
  MessageSquare,
  Gift,
  Wind,
  History,
  ShieldCheck
} from 'lucide-react';
import { AdminChatbot } from './components/AdminChatbot.tsx';
import { formatDuration } from '../../src/utils/formatters.ts';

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('beautydoor_admin_token');
  });
  const [adminUser, setAdminUser] = useState<any>(() => {
    const raw = localStorage.getItem('beautydoor_admin_user');
    return raw ? JSON.parse(raw) : null;
  });

  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab: 24 modules architecture
  const [activeTab, setActiveTab] = useState<
    'overview' | 'dispatch' | 'services' | 'packages' | 'categories' | 'hygiene' | 'pending' | 'priceAudit' | 'campaigns' | 'beauticians' | 'territories' | 'coupons' | 'customers' | 'reviews' | 'audit' | 'settings' | 'faqs'
  >('dispatch');

  // Module data
  const [overview, setOverview] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [hygieneList, setHygieneList] = useState<any[]>([]);
  const [pendingServices, setPendingServices] = useState<any[]>([]);
  const [priceAuditLogs, setPriceAuditLogs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [beauticians, setBeauticians] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Filter & Modal states for Waxing/Catalog, Packages, and Pending
  const [selectedServiceCatFilter, setSelectedServiceCatFilter] = useState('all');
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  const [isNewPackage, setIsNewPackage] = useState(false);
  const [editingHygiene, setEditingHygiene] = useState<any | null>(null);
  const [isNewHygiene, setIsNewHygiene] = useState(false);
  const [confirmingPriceService, setConfirmingPriceService] = useState<any | null>(null);
  const [confirmedSellingPriceInput, setConfirmedSellingPriceInput] = useState('');
  const [confirmedOriginalPriceInput, setConfirmedOriginalPriceInput] = useState('');

  // FAQ Knowledgebase Management state
  const [faqsList, setFaqsList] = useState<any[]>([]);
  const [faqAudienceFilter, setFaqAudienceFilter] = useState<'all' | 'customer' | 'admin'>('all');
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [isNewFaq, setIsNewFaq] = useState(false);
  const [testQueryText, setTestQueryText] = useState('');
  const [testAudience, setTestAudience] = useState<'customer' | 'admin'>('customer');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Category Modal state
  const [isNewCategoryModal, setIsNewCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatOrder, setNewCatOrder] = useState('1');

  // Dispatch modal
  const [selectedBookingForDispatch, setSelectedBookingForDispatch] = useState<any | null>(null);
  const [selectedBeauticianId, setSelectedBeauticianId] = useState<string>('');
  const [dispatchStatusNote, setDispatchStatusNote] = useState<string>('');
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Service Edit modal
  const [editingService, setEditingService] = useState<any | null>(null);
  const [isNewService, setIsNewService] = useState(false);

  // Campaign Edit modal
  const [isNewCampaignModal, setIsNewCampaignModal] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignSubtitle, setCampaignSubtitle] = useState('');
  const [campaignDiscount, setCampaignDiscount] = useState('25');
  const [campaignIsFlash, setCampaignIsFlash] = useState(false);

  // Search & Filters in Dispatch
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      setToken(data.token);
      setAdminUser(data.user);
      localStorage.setItem('beautydoor_admin_token', data.token);
      localStorage.setItem('beautydoor_admin_user', JSON.stringify(data.user));
    } catch (err: any) {
      setLoginError(err.message || 'Login error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('beautydoor_admin_token');
    localStorage.removeItem('beautydoor_admin_user');
  };

  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [ov, bk, srv, cats, cust, camp, beau, ter, coup, rev, aud, sett, faqsRes, pkgRes, hygRes, pendRes, auditRes] = await Promise.all([
        fetch('/api/admin/overview', { headers }).then(r => r.json()),
        fetch('/api/admin/bookings', { headers }).then(r => r.json()),
        fetch('/api/admin/services', { headers }).then(r => r.json()),
        fetch('/api/admin/categories', { headers }).then(r => r.json()),
        fetch('/api/admin/customers', { headers }).then(r => r.json()),
        fetch('/api/admin/campaigns', { headers }).then(r => r.json()),
        fetch('/api/admin/beauticians', { headers }).then(r => r.json()),
        fetch('/api/admin/territories', { headers }).then(r => r.json()),
        fetch('/api/admin/coupons', { headers }).then(r => r.json()),
        fetch('/api/admin/reviews', { headers }).then(r => r.json()),
        fetch('/api/admin/audit-logs', { headers }).then(r => r.json()),
        fetch('/api/admin/settings', { headers }).then(r => r.json()),
        fetch('/api/admin/faqs/manage', { headers }).then(r => r.json()),
        fetch('/api/admin/packages', { headers }).then(r => r.json()),
        fetch('/api/admin/hygiene', { headers }).then(r => r.json()),
        fetch('/api/admin/pending-services', { headers }).then(r => r.json()),
        fetch('/api/admin/price-audits', { headers }).then(r => r.json())
      ]);

      if (ov.error) {
        // Token invalid or expired
        handleLogout();
        return;
      }

      setOverview(ov);
      setBookings(bk.bookings || []);
      setServices(srv.services || []);
      setCategories(cats.categories || []);
      setCustomers(cust.customers || []);
      setCampaigns(camp.campaigns || []);
      setBeauticians(beau.beauticians || []);
      setTerritories(ter.territories || []);
      setCoupons(coup.coupons || []);
      setReviews(rev.reviews || []);
      setAuditLogs(aud.logs || []);
      setSettings(sett.settings || {});
      setFaqsList(faqsRes.faqs || []);
      setPackagesList(pkgRes.packages || []);
      setHygieneList(hygRes.commitments || []);
      setPendingServices(pendRes.pending || []);
      setPriceAuditLogs(auditRes.audits || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaqsOnly = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/faqs/manage', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFaqsList(data.faqs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;
    try {
      const url = isNewFaq ? '/api/admin/faqs/manage' : `/api/admin/faqs/manage/${editingFaq.id}`;
      const method = isNewFaq ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingFaq)
      });
      if (res.ok) {
        notify(isNewFaq ? 'New FAQ created successfully.' : 'FAQ updated successfully.');
        setEditingFaq(null);
        setIsNewFaq(false);
        fetchFaqsOnly();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFaqActive = async (id: string, currentActive: number) => {
    try {
      await fetch(`/api/admin/faqs/manage/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: currentActive === 1 ? 0 : 1 })
      });
      notify('FAQ status updated.');
      fetchFaqsOnly();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this FAQ item?')) return;
    try {
      const res = await fetch(`/api/admin/faqs/manage/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        notify('FAQ item removed.');
        fetchFaqsOnly();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunTestQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQueryText.trim() || testLoading) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const endpoint = testAudience === 'customer' ? '/api/faq/customer/query' : '/api/faq/admin/query';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (testAudience === 'admin' && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: testQueryText.trim() })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: 'Test failed: ' + err.message });
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminData();
    }
  }, [token]);

  // Assign Beautician with conflict prevention
  const handleConfirmAssignment = async () => {
    if (!selectedBookingForDispatch) return;
    setDispatchError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBookingForDispatch.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          beauticianId: selectedBeauticianId,
          notes: dispatchStatusNote
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setDispatchError(data.error || 'Failed to assign beautician');
        return;
      }
      notify(data.message || 'Beautician assigned successfully.');
      setSelectedBookingForDispatch(null);
      setSelectedBeauticianId('');
      setDispatchStatusNote('');
      fetchAdminData();
    } catch (err: any) {
      setDispatchError(err.message || 'Assignment failed');
    }
  };

  const handleUpdateBookingStatus = async (id: string, bookingStatus: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingStatus })
      });
      if (res.ok) {
        notify(`Booking ${id} status updated to ${bookingStatus}.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Territory Pincode Active
  const handleToggleTerritory = async (id: string, currentActive: number) => {
    try {
      await fetch(`/api/admin/territories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: currentActive === 1 ? false : true })
      });
      notify('Territory serviceability updated.');
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      const url = isNewService ? '/api/admin/services' : `/api/admin/services/${editingService.id}`;
      const method = isNewService ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingService)
      });
      if (res.ok) {
        notify(isNewService ? 'New treatment added to catalog.' : 'Service details updated.');
        setEditingService(null);
        setIsNewService(false);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: campaignTitle,
          banner_title: campaignTitle,
          banner_subtitle: campaignSubtitle,
          discount_val: Number(campaignDiscount),
          is_flash_deal: campaignIsFlash ? 1 : 0,
          is_published: 1,
          badge_text: campaignIsFlash ? 'Flash Deal' : 'Special Offer',
          destination_url: '/offers'
        })
      });
      if (res.ok) {
        notify('Promotional campaign created & published.');
        setIsNewCampaignModal(false);
        setCampaignTitle('');
        setCampaignSubtitle('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Moderate Review
  const handleModerateReview = async (id: string, isApproved: boolean) => {
    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved })
      });
      notify('Review moderation status updated.');
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Package Management Handlers
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    try {
      const url = isNewPackage ? '/api/admin/packages' : `/api/admin/packages/${editingPackage.id}`;
      const method = isNewPackage ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingPackage)
      });
      if (res.ok) {
        notify(isNewPackage ? 'Package created successfully.' : 'Package updated successfully.');
        setEditingPackage(null);
        setIsNewPackage(false);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePackagePublish = async (pkg: any) => {
    try {
      await fetch(`/api/admin/packages/${pkg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...pkg, is_published: pkg.is_published === 1 ? 0 : 1 })
      });
      notify('Package publication status toggled.');
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      const res = await fetch(`/api/admin/packages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        notify('Package deleted.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Hygiene Handlers
  const handleSaveHygiene = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHygiene) return;
    try {
      const url = isNewHygiene ? '/api/admin/hygiene' : `/api/admin/hygiene/${editingHygiene.id}`;
      const method = isNewHygiene ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingHygiene)
      });
      if (res.ok) {
        notify('Hygiene commitment saved.');
        setEditingHygiene(null);
        setIsNewHygiene(false);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleHygieneActive = async (id: string, currentActive: number) => {
    try {
      await fetch(`/api/admin/hygiene/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: currentActive === 1 ? 0 : 1 })
      });
      notify('Hygiene commitment status updated.');
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Pending Service Price Confirmation & Publishing
  const handleConfirmPendingPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingPriceService) return;
    const price = Number(confirmedSellingPriceInput);
    if (!price || price <= 0) {
      alert('Please enter a valid price confirmed by the business owner.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/services/${confirmingPriceService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...confirmingPriceService,
          durationMins: confirmingPriceService.duration_mins,
          categoryId: confirmingPriceService.category_id,
          originalPrice: confirmedOriginalPriceInput ? Number(confirmedOriginalPriceInput) : null,
          sellingPrice: price,
          isActive: true,
          isPublished: true,
          pendingNotes: null
        })
      });

      if (res.ok) {
        notify(`Confirmed price ₹${price} for ${confirmingPriceService.name} & published to storefront!`);
        setConfirmingPriceService(null);
        setConfirmedSellingPriceInput('');
        setConfirmedOriginalPriceInput('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Category Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCatName,
          description: newCatDesc,
          displayOrder: Number(newCatOrder) || 1
        })
      });
      if (res.ok) {
        notify('Category added successfully.');
        setIsNewCategoryModal(false);
        setNewCatName('');
        setNewCatDesc('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCategory = async (id: string, currentActive: number) => {
    try {
      await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: currentActive === 1 ? 0 : 1 })
      });
      notify('Category visibility updated.');
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        notify('Business settings updated and active across storefront.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // If unauthenticated: render Dedicated Admin Login
  if (!token) {
    return (
      <div className="min-h-screen bg-[#1F1A1C] text-[#FAF7F2] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white text-[#1F1A1C] rounded-2xl p-8 shadow-2xl border border-[#382F32] space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center mx-auto border border-[#E8DDD3]">
              <Lock className="w-6 h-6 text-[#4A0417]" />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#4A0417] bg-[#FAF7F2] px-2.5 py-0.5 rounded border border-[#E8DDD3]">
              admin.beautydoor.in
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#1F1A1C]">
              Enterprise Business Operations
            </h1>
            <p className="text-xs text-[#6B5A5C]">
              Authorized personnel only. All access is cryptographically audited.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="font-semibold block mb-1">Administrative Username</label>
              <input
                type="text"
                required
                placeholder="e.g. admin"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417] text-sm"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Secure Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417] text-sm"
              />
              <p className="text-[11px] text-[#8C7A7C] mt-1">Authorized personnel only</p>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-[#4A0417] hover:bg-[#36020F] text-white font-semibold rounded-md shadow-xs transition-colors disabled:opacity-50 text-sm"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In to Business Console'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.booking_status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_phone.includes(q) ||
        b.pincode.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F6F3] text-[#1F1A1C]">
      
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F1A1C] text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-[#C5A880]/40">
          <Sparkles className="w-4 h-4 text-[#C5A880]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Admin Top Header (NO "Back to Storefront" component switch button) */}
      <header className="bg-white border-b border-[#E8DDD3] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h1 className="text-base font-serif font-bold text-[#4A0417] leading-none">
                BeautyDoor Enterprise Control
              </h1>
              <span className="text-[10px] text-[#8C7A7C] uppercase tracking-wider font-semibold">
                admin.beautydoor.in · Delhi NCR Cluster
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-[#554749]">
              Signed in as <strong className="text-[#1F1A1C]">{adminUser?.username}</strong> ({adminUser?.role})
            </span>

            <button
              onClick={fetchAdminData}
              className="p-1.5 text-[#554749] hover:text-[#1F1A1C] hover:bg-[#FAF7F2] rounded border border-[#E8DDD3]"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3 py-1.5 bg-[#FAF7F2] hover:bg-red-50 text-red-700 hover:border-red-200 border border-[#E8DDD3] rounded flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 sm:space-x-5 overflow-x-auto text-xs font-semibold text-[#6B5A5C] scrollbar-none">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dispatch' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Dispatch & Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Executive KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'services' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Catalog & Waxing ({services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'packages' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Signature Packages ({packagesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('hygiene')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'hygiene' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hygiene Promise ({hygieneList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pending' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <AlertCircle className={`w-3.5 h-3.5 ${pendingServices.length > 0 ? 'text-amber-600' : ''}`} />
            <span>Pending Owner Prices ({pendingServices.length})</span>
            {pendingServices.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('priceAudit')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'priceAudit' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Price Audit Logs ({priceAuditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'categories' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'campaigns' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Promotional Campaigns ({campaigns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('beauticians')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'beauticians' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Beauticians Roster ({beauticians.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('territories')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'territories' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Pincodes & Hubs ({territories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'coupons' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coupons</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'customers' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Customers ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reviews' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Review Moderation ({reviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings & Policies</span>
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'faqs' ? 'border-[#4A0417] text-[#4A0417] font-bold' : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Chatbot FAQs ({faqsList.length})</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. DISPATCH BOARD & BOOKINGS */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-[#E8DDD3] flex flex-col sm:flex-row gap-3 justify-between items-center shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#8C7A7C] absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Booking ID, phone, customer..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-[#6B5A5C]" />
                <span className="text-xs font-semibold text-[#6B5A5C]">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417] font-medium"
                >
                  <option value="all">All Bookings</option>
                  <option value="pending">Pending Assignment</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="assigned">Assigned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DDD3] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#4A0417] uppercase tracking-wider font-semibold border-b border-[#E8DDD3]">
                    <tr>
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Address & Sector</th>
                      <th className="py-3 px-4">Schedule</th>
                      <th className="py-3 px-4">Payable</th>
                      <th className="py-3 px-4">Assigned Beautician</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4EFEA]">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-[#8C7A7C] italic">
                          No bookings found in database. Place a test booking from beautydoor.in storefront!
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="py-3 px-4 font-bold text-[#4A0417] tabular-nums">{b.id}</td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#1F1A1C]">{b.customer_name}</p>
                            <p className="text-[11px] text-[#7A6B6D] tabular-nums">{b.customer_phone}</p>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <p className="truncate text-[#1F1A1C]">{b.flat}</p>
                            <p className="text-[11px] text-[#6B5A5C]">{b.area}, {b.city} ({b.pincode})</p>
                          </td>
                          <td className="py-3 px-4 tabular-nums">
                            <p className="font-semibold text-[#1F1A1C]">{b.appointment_date}</p>
                            <p className="text-[11px] text-[#6B5A5C]">{b.appointment_slot}</p>
                          </td>
                          <td className="py-3 px-4 tabular-nums font-bold text-[#1F1A1C]">
                            ₹{b.total_payable}
                            <span className="block text-[10px] font-normal text-emerald-800">
                              {b.payment_method} ({b.payment_status})
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {b.beautician ? (
                              <span className="font-semibold text-[#1F1A1C]">
                                {b.beautician.name}
                              </span>
                            ) : (
                              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                              b.booking_status === 'assigned' || b.booking_status === 'confirmed'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : b.booking_status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : b.booking_status === 'cancelled'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {b.booking_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedBookingForDispatch(b);
                                setSelectedBeauticianId(b.assigned_beautician_id || '');
                                setDispatchError(null);
                              }}
                              className="px-3 py-1 bg-[#4A0417] text-white hover:bg-[#36020F] rounded text-xs font-semibold"
                            >
                              Dispatch
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. OVERVIEW METRICS */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs">
                <span className="text-xs uppercase text-[#8C7A7C] font-semibold">Total Revenue</span>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-[#4A0417] mt-1 tabular-nums">
                  ₹{overview.totalRevenue?.toLocaleString('en-IN') || 0}
                </p>
                <p className="text-xs text-emerald-800 font-medium mt-1">
                  Collected: ₹{overview.collectedRevenue?.toLocaleString('en-IN') || 0}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs">
                <span className="text-xs uppercase text-[#8C7A7C] font-semibold">Total Appointments</span>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-[#1F1A1C] mt-1 tabular-nums">
                  {overview.totalBookings || 0}
                </p>
                <p className="text-xs text-[#6B5A5C] mt-1">
                  Today's slots: {overview.todayBookings || 0}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs">
                <span className="text-xs uppercase text-[#8C7A7C] font-semibold">Active Specialists</span>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-[#1F1A1C] mt-1 tabular-nums">
                  {overview.activeSpecialists || 0} / {beauticians.length}
                </p>
                <p className="text-xs text-emerald-800 font-medium mt-1">
                  Verified in Delhi NCR
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs">
                <span className="text-xs uppercase text-[#8C7A7C] font-semibold">Published Campaigns</span>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-[#1F1A1C] mt-1 tabular-nums">
                  {overview.activeCampaigns || 0} Active
                </p>
                <p className="text-xs text-[#6B5A5C] mt-1">
                  Merchandising Engine Live
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. CATALOG & DYNAMIC PRICING WITH WAXING SPECIALIZATION */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                  Service Catalog & Waxing Management
                </h3>
                <p className="text-xs text-[#7A6B6D]">
                  Manage official RICA, Honey, Korean, Brazilian Peel-Off waxing and facial treatments. All price changes are automatically logged in the audit trail.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingService({
                    id: `srv-${Date.now()}`,
                    categoryId: 'cat-rica',
                    name: '',
                    description: '',
                    benefits: ['Salon-smooth finish', 'Hygienic single-use disposables'],
                    durationMins: 45,
                    originalPrice: 999,
                    sellingPrice: 799,
                    discountPercent: 20,
                    whatsIncluded: ['Disposable bedsheet', 'Single-use wooden spatula', 'Post-wax soothing oil'],
                    variants: [],
                    addons: [],
                    isActive: true,
                    isPopular: false,
                    isBestseller: false,
                    isFeaturedDeal: false,
                    roomConditions: 'Air-conditioned cool room required (approx. 22-24°C)',
                    beforeInstructions: 'Hair length should be at least 1/4 inch (minimum 3 weeks without shaving)',
                    afterInstructions: 'Avoid direct sun exposure and hot baths for 24 hours',
                    hygienePrecautions: 'Sealed disposables unpacked in front of client. No double-dipping.'
                  });
                  setIsNewService(true);
                }}
                className="px-4 py-2 bg-[#4A0417] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-[#36020F] transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>Add New Service</span>
              </button>
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-semibold">
              <button
                onClick={() => setSelectedServiceCatFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedServiceCatFilter === 'all'
                    ? 'bg-[#4A0417] text-white shadow-xs'
                    : 'bg-white text-[#554749] hover:bg-[#FAF7F2] border border-[#E8DDD3]'
                }`}
              >
                All Treatments ({services.length})
              </button>
              <button
                onClick={() => setSelectedServiceCatFilter('cat-rica')}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedServiceCatFilter === 'cat-rica'
                    ? 'bg-[#4A0417] text-white shadow-xs'
                    : 'bg-white text-[#554749] hover:bg-[#FAF7F2] border border-[#E8DDD3]'
                }`}
              >
                RICA Waxing ({services.filter(s => s.category_id === 'cat-rica').length})
              </button>
              <button
                onClick={() => setSelectedServiceCatFilter('cat-honey')}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedServiceCatFilter === 'cat-honey'
                    ? 'bg-[#4A0417] text-white shadow-xs'
                    : 'bg-white text-[#554749] hover:bg-[#FAF7F2] border border-[#E8DDD3]'
                }`}
              >
                Honey Waxing ({services.filter(s => s.category_id === 'cat-honey').length})
              </button>
              <button
                onClick={() => setSelectedServiceCatFilter('cat-korean')}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedServiceCatFilter === 'cat-korean'
                    ? 'bg-[#4A0417] text-white shadow-xs'
                    : 'bg-white text-[#554749] hover:bg-[#FAF7F2] border border-[#E8DDD3]'
                }`}
              >
                Korean Waxing ({services.filter(s => s.category_id === 'cat-korean').length})
              </button>
              <button
                onClick={() => setSelectedServiceCatFilter('cat-brazilian')}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedServiceCatFilter === 'cat-brazilian'
                    ? 'bg-[#4A0417] text-white shadow-xs'
                    : 'bg-white text-[#554749] hover:bg-[#FAF7F2] border border-[#E8DDD3]'
                }`}
              >
                Brazilian Peel-Off ({services.filter(s => s.category_id === 'cat-brazilian').length})
              </button>
              {categories.filter(c => !['cat-rica', 'cat-honey', 'cat-korean', 'cat-brazilian'].includes(c.id)).map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedServiceCatFilter(c.id)}
                  className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    selectedServiceCatFilter === c.id
                      ? 'bg-[#4A0417] text-white shadow-xs'
                      : 'bg-white text-[#554749] hover:bg-[#FAF7F2] border border-[#E8DDD3]'
                  }`}
                >
                  {c.name} ({services.filter(s => s.category_id === c.id).length})
                </button>
              ))}
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services
                .filter(s => selectedServiceCatFilter === 'all' || s.category_id === selectedServiceCatFilter)
                .map((s) => (
                  <div key={s.id} className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#8C7A7C] mb-1">
                        <span className="uppercase font-semibold text-[#4A0417] tracking-wider text-[10px] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DDD3]">
                          {categories.find(c => c.id === s.category_id)?.name || s.category_id}
                        </span>
                        <span className="tabular-nums font-medium flex items-center gap-1 text-[#4A0417]">
                          <Clock className="w-3 h-3 text-[#C5A880]" />
                          {formatDuration(s.duration_mins)}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-[#1F1A1C] leading-snug mt-1.5">{s.name}</h4>
                      <p className="text-xs text-[#5C4D4F] mt-1 line-clamp-2">{s.description}</p>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-[#1F1A1C] tabular-nums">₹{s.selling_price}</span>
                        {s.original_price > s.selling_price && (
                          <span className="text-xs text-[#8C7A7C] line-through tabular-nums">₹{s.original_price}</span>
                        )}
                        {s.discount_percent > 0 && (
                          <span className="text-xs text-emerald-800 font-semibold">{s.discount_percent}% OFF</span>
                        )}
                      </div>

                      {/* Room condition chip */}
                      <div className="mt-2 text-[10px] text-[#7A5A1E] bg-[#FFFBF0] px-2 py-1 rounded border border-[#F3E5AB] flex items-center gap-1">
                        <Wind className="w-3 h-3 text-[#C5A880] shrink-0" />
                        <span className="truncate">AC Room Required (Cool Air)</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F4EFEA] flex justify-between items-center text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        s.is_active === 1 && s.is_published !== 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.is_active === 1 && s.is_published !== 0 ? 'Live on Storefront' : 'Hidden / Draft'}
                      </span>

                      <button
                        onClick={() => {
                          setEditingService({
                            ...s,
                            categoryId: s.category_id,
                            durationMins: s.duration_mins,
                            originalPrice: s.original_price,
                            sellingPrice: s.selling_price,
                            discountPercent: s.discount_percent,
                            isActive: s.is_active === 1,
                            isPublished: s.is_published !== 0
                          });
                          setIsNewService(false);
                        }}
                        className="px-3 py-1 bg-[#FAF7F2] hover:bg-[#EAE2D8] border border-[#E8DDD3] rounded-md text-[#4A0417] font-semibold text-xs"
                      >
                        Edit Details & Price
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 3b. SIGNATURE PACKAGES MANAGEMENT */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                  BeautyDoor Signature Packages ({packagesList.length})
                </h3>
                <p className="text-xs text-[#7A6B6D]">
                  Curated head-to-toe beauty bundles. Packages are booked at fixed bundle prices. Price edits are automatically logged in the audit trail.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingPackage({
                    id: `pkg-${Date.now()}`,
                    name: '',
                    slug: '',
                    subtitle: 'Signature Glow',
                    description: '',
                    original_price: 2499,
                    selling_price: 1999,
                    discount_percent: 20,
                    duration_mins: 90,
                    duration_display: '1 hour 30 minutes',
                    inclusions: [
                      { name: 'RICA Full Arms + Underarms + Full Legs', is_free: false },
                      { name: 'Lotus White Glow Facial', is_free: false },
                      { name: 'Complimentary Bikini Wax', is_free: true }
                    ],
                    benefits: ['Deep exfoliation', 'Velvety smooth skin'],
                    is_published: 1,
                    badge: 'Curated Bundle',
                    display_order: packagesList.length + 1
                  });
                  setIsNewPackage(true);
                }}
                className="px-4 py-2 bg-[#4A0417] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-[#36020F] transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>Create New Package</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DDD3] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#4A0417] uppercase tracking-wider font-semibold border-b border-[#E8DDD3]">
                  <tr>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Package Name</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Included Treatments</th>
                    <th className="py-3 px-4 text-right">Fixed Price</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {packagesList.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-[#FAF7F2]">
                      <td className="py-3.5 px-4 font-mono text-[#8C7A7C] font-bold">{pkg.display_order}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[#1F1A1C]">{pkg.name}</div>
                        {pkg.badge && (
                          <span className="text-[10px] text-[#C5A880] uppercase font-bold">{pkg.badge}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums font-medium text-[#4A0417]">
                        {formatDuration(pkg.duration_mins)}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="space-y-1">
                          {(pkg.inclusions || []).map((inc: any, i: number) => {
                            const name = typeof inc === 'object' ? inc.name : String(inc);
                            const isFree = (typeof inc === 'object' && inc.is_free) || name.toLowerCase().includes('free');
                            return (
                              <div key={i} className="flex items-center gap-1 text-[11px]">
                                <span className={isFree ? 'text-emerald-700 font-bold' : 'text-[#4A3D3F]'}>
                                  • {name}
                                </span>
                                {isFree && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] uppercase px-1 rounded font-bold">
                                    FREE
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-sm text-[#1F1A1C] tabular-nums">
                        ₹{pkg.selling_price.toLocaleString('en-IN')}
                        {pkg.original_price > pkg.selling_price && (
                          <span className="block text-[11px] text-[#8C7A7C] line-through">
                            ₹{pkg.original_price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleTogglePackagePublish(pkg)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                            pkg.is_published === 1
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {pkg.is_published === 1 ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingPackage({
                              ...pkg,
                              inclusions: (pkg.inclusions || []).map((inc: any) => 
                                typeof inc === 'object' ? inc : { name: String(inc), is_free: String(inc).toLowerCase().includes('free') }
                              )
                            });
                            setIsNewPackage(false);
                          }}
                          className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#EAE2D8] border border-[#E8DDD3] rounded text-[#4A0417] font-semibold text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete Package"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3c. HYGIENE PROMISE MANAGEMENT */}
        {activeTab === 'hygiene' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                  Hygiene Commitments Management ({hygieneList.length})
                </h3>
                <p className="text-xs text-[#7A6B6D]">
                  Manage the 8 official single-use disposables, AC room requirements, and safety protocols displayed on the storefront.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingHygiene({
                    id: `hyg-${Date.now()}`,
                    title: '',
                    description: '',
                    icon_name: 'ShieldCheck',
                    is_single_use: 1,
                    display_order: hygieneList.length + 1,
                    is_active: 1
                  });
                  setIsNewHygiene(true);
                }}
                className="px-4 py-2 bg-[#4A0417] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-[#36020F] transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>Add Hygiene Commitment</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hygieneList.map((h) => (
                <div key={h.id} className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8C7A7C] mb-2">
                      <span className="font-mono text-[#4A0417] font-bold">#{h.display_order}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        h.is_single_use === 1 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-[#FAF7F2] text-[#4A0417]'
                      }`}>
                        {h.is_single_use === 1 ? '100% Single-Use' : 'Protocol'}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-[#1F1A1C]">{h.title}</h4>
                    <p className="text-xs text-[#5C4D4F] mt-1 leading-relaxed">{h.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F4EFEA] flex justify-between items-center text-xs">
                    <button
                      onClick={() => handleToggleHygieneActive(h.id, h.is_active)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        h.is_active === 1
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {h.is_active === 1 ? 'Active' : 'Disabled'}
                    </button>

                    <button
                      onClick={() => {
                        setEditingHygiene(h);
                        setIsNewHygiene(false);
                      }}
                      className="px-3 py-1 bg-[#FAF7F2] hover:bg-[#EAE2D8] border border-[#E8DDD3] rounded-md text-[#4A0417] font-semibold"
                    >
                      Edit Text
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3d. PENDING SERVICES AWAITING OWNER CONFIRMATION */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-800 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Business Owner Price Confirmation Required</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                Unpublished Items Awaiting Owner Prices ({pendingServices.length})
              </h3>
              <p className="text-xs text-[#7A6B6D]">
                As per business owner instructions, items without confirmed prices are kept strictly UNPUBLISHED and will not appear to customers. Enter the confirmed price below to instantly publish.
              </p>
            </div>

            {pendingServices.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-[#E8DDD3] text-center text-xs text-[#7A6B6D] space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-semibold text-sm text-[#1F1A1C]">All Services Have Confirmed Pricing</p>
                <p>No unpublished services are currently waiting for owner confirmation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingServices.map((p) => (
                  <div key={p.id} className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          Unpublished • Awaiting Price
                        </span>
                        <h4 className="text-base font-serif font-bold text-[#1F1A1C] mt-1">{p.name}</h4>
                        <p className="text-xs text-[#6B5A5C] mt-0.5">{p.description}</p>
                      </div>

                      <span className="text-xs font-mono text-[#8C7A7C] font-semibold">
                        {p.duration_mins} mins
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                      <p className="font-semibold">Note from Catalogue Import:</p>
                      <p className="italic">"{p.pending_notes || 'Price awaiting confirmation from business owner'}"</p>
                    </div>

                    <div className="pt-2 border-t border-[#F4EFEA] flex justify-end">
                      <button
                        onClick={() => {
                          setConfirmingPriceService(p);
                          setConfirmedSellingPriceInput(p.selling_price ? String(p.selling_price) : '');
                          setConfirmedOriginalPriceInput(p.original_price ? String(p.original_price) : '');
                        }}
                        className="px-4 py-2 bg-[#4A0417] text-white hover:bg-[#36020F] text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                      >
                        <Tag className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Enter Confirmed Price & Publish</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3e. PRICE AUDIT TRAIL */}
        {activeTab === 'priceAudit' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#4A0417] mb-1">
                <History className="w-4 h-4 text-[#C5A880]" />
                <span>Authorized Price Change Log</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                Price Audit Trail ({priceAuditLogs.length})
              </h3>
              <p className="text-xs text-[#7A6B6D]">
                Every single service or package price update is permanently recorded with timestamps, user credentials, and previous rates.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DDD3] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#4A0417] uppercase tracking-wider font-semibold border-b border-[#E8DDD3]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-right">Previous Price</th>
                    <th className="py-3 px-4 text-right">New Price</th>
                    <th className="py-3 px-4">Changed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {priceAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#8C7A7C] italic">
                        No price modifications recorded yet. Initial catalogue seeded at owner specified rates.
                      </td>
                    </tr>
                  ) : (
                    priceAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF7F2]">
                        <td className="py-3 px-4 font-mono text-[#8C7A7C]">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.item_type === 'package' ? 'bg-purple-50 text-purple-800' : 'bg-blue-50 text-blue-800'
                          }`}>
                            {log.item_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#1F1A1C]">{log.item_name}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-[#8C7A7C]">
                          {log.old_price != null ? `₹${log.old_price}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-[#4A0417]">
                          ₹{log.new_price}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#554749]">{log.changed_by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. PROMOTIONAL CAMPAIGNS (Amazon-Style Merchandising Engine) */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                  Amazon-Style Merchandising & Campaign Manager
                </h3>
                <p className="text-xs text-[#7A6B6D]">
                  Configure banners, flash deal countdowns, and seasonal discount festivals.
                </p>
              </div>

              <button
                onClick={() => setIsNewCampaignModal(true)}
                className="px-4 py-2 bg-[#4A0417] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>Create Campaign</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((c) => (
                <div key={c.id} className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#4A0417] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DDD3]">
                        {c.badge_text || 'Active Campaign'}
                      </span>
                      <h4 className="text-base font-serif font-bold text-[#1F1A1C] mt-1">{c.banner_title}</h4>
                      <p className="text-xs text-[#6B5A5C] mt-0.5">{c.banner_subtitle}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      c.is_published === 1 ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {c.is_published === 1 ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="text-xs text-[#7A6B6D] space-y-1 pt-2 border-t border-[#F4EFEA]">
                    <p>Schedule: <span className="text-[#1F1A1C] font-medium">{c.start_time.split('T')[0]} to {c.end_time.split('T')[0]}</span></p>
                    <p>Flash Deal: <span className="text-[#1F1A1C] font-medium">{c.is_flash_deal === 1 ? 'YES (Countdown Active)' : 'NO'}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. BEAUTICIANS ROSTER */}
        {activeTab === 'beauticians' && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
              Certified Beauticians Roster
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {beauticians.map((b) => (
                <div key={b.id} className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-2">
                  <h4 className="font-bold text-sm text-[#1F1A1C]">{b.name}</h4>
                  <p className="text-xs text-[#7A6B6D] tabular-nums">{b.phone}</p>
                  <p className="text-xs text-[#554749]">Specialties: {b.specialties?.join(', ')}</p>
                  <p className="text-xs text-[#554749]">Territories: {b.territories?.join(', ')}</p>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block ${
                    b.status === 'available' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. PINCODES & TERRITORIES */}
        {activeTab === 'territories' && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
              Delhi NCR Active Serviceable Pincodes
            </h3>
            <div className="bg-white rounded-2xl border border-[#E8DDD3] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#4A0417] uppercase tracking-wider font-semibold border-b border-[#E8DDD3]">
                  <tr>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Area</th>
                    <th className="py-3 px-4">Pincode</th>
                    <th className="py-3 px-4">Min Order</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {territories.map((t) => (
                    <tr key={t.id} className="hover:bg-[#FAF7F2]">
                      <td className="py-3 px-4 font-bold text-[#1F1A1C]">{t.city}</td>
                      <td className="py-3 px-4 text-[#554749]">{t.area_name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#4A0417]">{t.pincode}</td>
                      <td className="py-3 px-4 tabular-nums">₹{t.min_order_amount}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleTerritory(t.id, t.is_active)}
                          className={`px-3 py-1 rounded text-[11px] font-semibold ${
                            t.is_active === 1 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {t.is_active === 1 ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. COUPONS */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
              Discount & Coupon Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <div key={c.id} className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-2">
                  <span className="font-mono text-base font-bold text-[#4A0417]">{c.code}</span>
                  <p className="text-xs text-[#554749]">{c.description}</p>
                  <p className="text-xs text-[#7A6B6D]">
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT`} (Min ₹{c.min_order_amount})
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. REVIEW MODERATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                Customer Reviews Moderation
              </h3>
              <p className="text-xs text-[#7A6B6D]">
                Verify reviews from completed appointments. Unapproved reviews will never show on the storefront.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DDD3] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#4A0417] uppercase tracking-wider font-semibold border-b border-[#E8DDD3]">
                  <tr>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Comment</th>
                    <th className="py-3 px-4 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8C7A7C] italic">
                        No submitted customer reviews awaiting moderation.
                      </td>
                    </tr>
                  ) : (
                    reviews.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FAF7F2]">
                        <td className="py-3 px-4 font-semibold text-[#1F1A1C]">{r.customer_name}</td>
                        <td className="py-3 px-4 text-amber-600 font-bold">★ {r.rating}</td>
                        <td className="py-3 px-4 text-[#554749]">{r.service_name}</td>
                        <td className="py-3 px-4 text-[#554749] max-w-sm italic truncate">“{r.comment}”</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleModerateReview(r.id, r.is_approved === 1 ? false : true)}
                            className={`px-3 py-1 rounded text-[11px] font-semibold ${
                              r.is_approved === 1 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {r.is_approved === 1 ? 'Approved' : 'Pending Approval'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
              Security & Operations Audit Trail
            </h3>
            <div className="bg-white rounded-2xl border border-[#E8DDD3] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAF7F2] text-[#4A0417] uppercase tracking-wider font-semibold border-b border-[#E8DDD3]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAF7F2]">
                      <td className="py-3 px-4 text-[#7A6B6D]">{log.timestamp}</td>
                      <td className="py-3 px-4 font-bold text-[#1F1A1C]">{log.admin_username}</td>
                      <td className="py-3 px-4 text-[#4A0417] font-semibold">{log.action}</td>
                      <td className="py-3 px-4 text-[#554749]">{log.resource_type}: {log.resource_id}</td>
                      <td className="py-3 px-4 text-[#7A6B6D]">{log.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 10. CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                  Service Categories Management
                </h3>
                <p className="text-xs text-[#7A6B6D]">
                  Organize treatments into customer-facing categories. Active categories are reflected on the storefront navigation menu.
                </p>
              </div>

              <button
                onClick={() => setIsNewCategoryModal(true)}
                className="px-4 py-2 bg-[#4A0417] text-white text-xs font-semibold rounded-md shadow-xs hover:bg-[#36020F] flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DDD3] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#4A0417] uppercase tracking-wider font-semibold border-b border-[#E8DDD3]">
                  <tr>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF7F2]">
                      <td className="py-3 px-4 font-bold tabular-nums text-[#8C7A7C]">{c.display_order}</td>
                      <td className="py-3 px-4 font-semibold text-[#1F1A1C]">{c.name}</td>
                      <td className="py-3 px-4 font-mono text-[#6B5A5C]">{c.slug}</td>
                      <td className="py-3 px-4 text-[#6B5A5C] max-w-xs truncate">{c.description || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.is_active === 1 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700'
                        }`}>
                          {c.is_active === 1 ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleCategory(c.id, c.is_active)}
                          className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                            c.is_active === 1 ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {c.is_active === 1 ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 11. CUSTOMER DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                Customer Directory & Lifetime Value
              </h3>
              <p className="text-xs text-[#7A6B6D]">
                Verified customer profiles derived from real appointments in the database.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DDD3] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#4A0417] uppercase tracking-wider font-semibold border-b border-[#E8DDD3]">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Mobile Phone</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Service Area</th>
                    <th className="py-3 px-4 text-center">Bookings</th>
                    <th className="py-3 px-4 text-right">Total Spend</th>
                    <th className="py-3 px-4 text-right">Last Appointment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#8C7A7C] italic">
                        No registered customer orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FAF7F2]">
                        <td className="py-3 px-4 font-semibold text-[#1F1A1C]">{c.name}</td>
                        <td className="py-3 px-4 font-mono text-[#4A0417]">{c.phone}</td>
                        <td className="py-3 px-4 text-[#6B5A5C]">{c.email || '—'}</td>
                        <td className="py-3 px-4 text-[#6B5A5C]">{c.city} ({c.pincode})</td>
                        <td className="py-3 px-4 text-center font-bold tabular-nums">{c.total_bookings}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#1F1A1C] tabular-nums">
                          ₹{(c.total_spend || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right text-[#8C7A7C] tabular-nums">
                          {c.last_booking_at?.split('T')[0] || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 12. BUSINESS SETTINGS & POLICIES */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                Business Settings & Operating Policies
              </h3>
              <p className="text-xs text-[#7A6B6D]">
                Manage promotional banners, optional loyalty & referral programs, customer support details, and payment gateway configuration.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Section A: Announcement Bar */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8DDD3] shadow-xs space-y-4">
                <h4 className="text-sm font-serif font-bold text-[#4A0417] uppercase tracking-wider flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#C5A880]" />
                  <span>Promotional Announcement Bar</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Announcement Text</label>
                    <input
                      type="text"
                      value={settings.announcement_text || ''}
                      onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                      placeholder="e.g. ✨ Delhi NCR: Up to 35% OFF on select rituals | Pay after service"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="announcement_active"
                      checked={settings.announcement_active === 'true'}
                      onChange={(e) => setSettings({ ...settings, announcement_active: e.target.checked ? 'true' : 'false' })}
                      className="accent-[#4A0417]"
                    />
                    <label htmlFor="announcement_active" className="font-semibold cursor-pointer">
                      Display Announcement Bar on Customer Storefront
                    </label>
                  </div>
                </div>
              </div>

              {/* Section B: Membership & Referral Modules */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8DDD3] shadow-xs space-y-4">
                <h4 className="text-sm font-serif font-bold text-[#4A0417] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C5A880]" />
                  <span>Membership Privé & Referral Modules (Optional)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Membership */}
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1F1A1C]">BeautyDoor Privé Club</span>
                      <input
                        type="checkbox"
                        checked={settings.membership_enabled === 'true'}
                        onChange={(e) => setSettings({ ...settings, membership_enabled: e.target.checked ? 'true' : 'false' })}
                        className="accent-[#4A0417]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Annual Membership Fee (₹)</label>
                      <input
                        type="number"
                        value={settings.membership_fee || '499'}
                        onChange={(e) => setSettings({ ...settings, membership_fee: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E8DDD3] rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Member Exclusive Discount (%)</label>
                      <input
                        type="number"
                        value={settings.membership_discount_percent || '10'}
                        onChange={(e) => setSettings({ ...settings, membership_discount_percent: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E8DDD3] rounded-md"
                      />
                    </div>
                  </div>

                  {/* Referral */}
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1F1A1C]">Referral Rewards Program</span>
                      <input
                        type="checkbox"
                        checked={settings.referral_enabled === 'true'}
                        onChange={(e) => setSettings({ ...settings, referral_enabled: e.target.checked ? 'true' : 'false' })}
                        className="accent-[#4A0417]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Referral Credit to Referrer (₹)</label>
                      <input
                        type="number"
                        value={settings.referral_bonus_amount || '200'}
                        onChange={(e) => setSettings({ ...settings, referral_bonus_amount: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E8DDD3] rounded-md"
                      />
                    </div>
                    <p className="text-[11px] text-[#7A6B6D]">
                      When enabled, customer accounts show a shareable referral code.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section C: Business Concierge & Hours */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8DDD3] shadow-xs space-y-4">
                <h4 className="text-sm font-serif font-bold text-[#4A0417] uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#C5A880]" />
                  <span>Support & Operational Guidelines</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Business Contact Person</label>
                    <input
                      type="text"
                      value={settings.contact_name || 'Preeti Singh'}
                      onChange={(e) => setSettings({ ...settings, contact_name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                      placeholder="Preeti Singh"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Helpline Phone</label>
                    <input
                      type="text"
                      value={settings.contact_phone || '+91 93103 72015'}
                      onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                      placeholder="+91 93103 72015"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">WhatsApp Support</label>
                    <input
                      type="text"
                      value={settings.support_whatsapp || '+91 93103 72015'}
                      onChange={(e) => setSettings({ ...settings, support_whatsapp: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                      placeholder="+91 93103 72015"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Support Email</label>
                    <input
                      type="email"
                      value={settings.contact_email || 'hello@beautydoor.in'}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                      placeholder="hello@beautydoor.in"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                  <div>
                    <label className="font-semibold block mb-1">Cancellation Window (Hours)</label>
                    <input
                      type="number"
                      value={settings.cancellation_window_hours || '4'}
                      onChange={(e) => setSettings({ ...settings, cancellation_window_hours: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Minimum Booking Order (₹)</label>
                    <input
                      type="number"
                      value={settings.min_order_amount || '499'}
                      onChange={(e) => setSettings({ ...settings, min_order_amount: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                    />
                  </div>
                </div>

                {/* Working Hours & Slot Surcharge Controls */}
                <div className="pt-3 border-t border-[#E8DDD3] space-y-2">
                  <h5 className="font-bold text-[#4A0417] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Working Hours & Time Slot Surcharges</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="font-semibold block mb-1">Daily Start Slot</label>
                      <input
                        type="text"
                        value={settings.working_hours_start || '08:00 AM'}
                        onChange={(e) => setSettings({ ...settings, working_hours_start: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Daily End Slot</label>
                      <input
                        type="text"
                        value={settings.working_hours_end || '06:00 PM'}
                        onChange={(e) => setSettings({ ...settings, working_hours_end: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">8:00 AM Slot Surcharge (₹)</label>
                      <input
                        type="number"
                        value={settings.slot_charge_8am || '100'}
                        onChange={(e) => setSettings({ ...settings, slot_charge_8am: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-bold text-[#4A0417]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">6:00 PM Slot Surcharge (₹)</label>
                      <input
                        type="number"
                        value={settings.slot_charge_6pm || '100'}
                        onChange={(e) => setSettings({ ...settings, slot_charge_6pm: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-bold text-[#4A0417]"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#8C7A7C]">
                    As configured by the business owner, BeautyDoor operates 8:00 AM – 6:00 PM with ₹100 extra surcharge on 8:00 AM and 6:00 PM appointments.
                  </p>
                </div>
              </div>

              {/* Section D: Payment Gateway */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8DDD3] shadow-xs space-y-4">
                <h4 className="text-sm font-serif font-bold text-[#4A0417] uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#C5A880]" />
                  <span>Razorpay Payment Gateway</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Razorpay Key ID</label>
                    <input
                      type="text"
                      value={settings.razorpay_key_id || 'rzp_test_beautydoor_mock'}
                      onChange={(e) => setSettings({ ...settings, razorpay_key_id: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="razorpay_enabled"
                      checked={settings.razorpay_enabled === 'true'}
                      onChange={(e) => setSettings({ ...settings, razorpay_enabled: e.target.checked ? 'true' : 'false' })}
                      className="accent-[#4A0417]"
                    />
                    <label htmlFor="razorpay_enabled" className="font-semibold cursor-pointer">
                      Enable Razorpay Online Payments (Cards/UPI)
                    </label>
                  </div>
                </div>
              </div>

              {/* Section E: Private Restricted Locations */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8DDD3] shadow-xs space-y-4">
                <h4 className="text-sm font-serif font-bold text-[#4A0417] uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C5A880]" />
                  <span>Private Restricted Service Locations (Internal Blacklist)</span>
                </h4>
                <p className="text-xs text-[#5C4D4F] leading-relaxed">
                  Enter comma-separated keywords or area names that BeautyDoor does not serve. When a customer enters an address matching any of these keywords, the booking engine will safely reject the order with: 
                  <span className="font-semibold text-[#4A0417] ml-1">"Sorry, BeautyDoor is currently unavailable at this location."</span> (This list is strictly internal and never exposed in customer-facing source code or public APIs).
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-semibold block text-[#1F1A1C]">
                    Restricted Area Keywords (Comma-Separated or JSON array)
                  </label>
                  <textarea
                    rows={2}
                    value={
                      (() => {
                        try {
                          const parsed = JSON.parse(settings.restricted_locations || '[]');
                          if (Array.isArray(parsed)) return parsed.join(', ');
                        } catch {
                          // fallback as string
                        }
                        return settings.restricted_locations || '';
                      })()
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const arr = val.split(',').map((s) => s.trim()).filter(Boolean);
                      setSettings({ ...settings, restricted_locations: JSON.stringify(arr) });
                    }}
                    placeholder="e.g. TEST_RESTRICTED_ZONE, OUT_OF_BOUNDS_AREA"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-mono text-xs focus:outline-none focus:border-[#4A0417]"
                  />
                  <p className="text-[11px] text-[#8C7A7C]">
                    Current Raw JSON stored in PostgreSQL: <code className="bg-[#F4EFEA] px-1.5 py-0.5 rounded text-[#4A0417]">{settings.restricted_locations || '[]'}</code>
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#4A0417] text-white text-xs font-semibold rounded-md shadow-md hover:bg-[#36020F] transition-all"
                >
                  Save All Settings & Policies
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 13. CHATBOT FAQ KNOWLEDGEBASE & RULE ENGINE */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            
            {/* Top Bar with stats and actions */}
            <div className="bg-white p-5 rounded-xl border border-[#E8DDD3] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-serif font-bold text-[#1F1A1C]">Chatbot FAQ Knowledgebase</h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                    Rule-Based & Deterministic (Zero Paid AI APIs)
                  </span>
                </div>
                <p className="text-xs text-[#7A6B6D] mt-0.5">
                  Manage predefined question triggers, dynamic database-backed answers, and keyword aliases for both customer and admin assistants.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setIsNewFaq(true);
                    setEditingFaq({
                      audience: faqAudienceFilter === 'admin' ? 'admin' : 'customer',
                      category: 'General',
                      question: '',
                      answer: '',
                      keywords: '',
                      display_order: faqsList.length + 1,
                      is_active: 1,
                      is_dynamic: 0,
                      dynamic_handler: ''
                    });
                  }}
                  className="px-4 py-2 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-200" />
                  <span>Add New FAQ Rule</span>
                </button>
              </div>
            </div>

            {/* Audience Tabs & Search Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setFaqAudienceFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    faqAudienceFilter === 'all'
                      ? 'bg-[#1F1A1C] text-white shadow-xs'
                      : 'bg-white border border-[#E8DDD3] text-[#6B5A5C] hover:bg-stone-50'
                  }`}
                >
                  All Knowledgebase ({faqsList.length})
                </button>
                <button
                  onClick={() => setFaqAudienceFilter('customer')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    faqAudienceFilter === 'customer'
                      ? 'bg-[#4A0417] text-white shadow-xs'
                      : 'bg-white border border-[#E8DDD3] text-[#6B5A5C] hover:bg-stone-50'
                  }`}
                >
                  <span>Customer Storefront ({faqsList.filter(f => f.audience === 'customer').length})</span>
                </button>
                <button
                  onClick={() => setFaqAudienceFilter('admin')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    faqAudienceFilter === 'admin'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white border border-[#E8DDD3] text-[#6B5A5C] hover:bg-stone-50'
                  }`}
                >
                  <span>Admin Console Help ({faqsList.filter(f => f.audience === 'admin').length})</span>
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-[#8C7A7C] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  placeholder="Filter by question or keyword..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
                />
              </div>
            </div>

            {/* Main Grid: Knowledgebase Table & Test Bench */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* FAQ Table (2 Columns) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl border border-[#E8DDD3] overflow-hidden shadow-xs">
                  <div className="p-3.5 bg-[#FAF7F2] border-b border-[#E8DDD3] flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#1F1A1C]">Configured FAQ Records</span>
                    <span className="text-[11px] text-[#7A6B6D]">
                      Showing {faqsList
                        .filter(f => faqAudienceFilter === 'all' || f.audience === faqAudienceFilter)
                        .filter(f => !faqSearchQuery || f.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) || f.keywords_json.toLowerCase().includes(faqSearchQuery.toLowerCase()))
                        .length} items
                    </span>
                  </div>

                  <div className="divide-y divide-[#F0EAE1] max-h-[680px] overflow-y-auto">
                    {faqsList
                      .filter(f => faqAudienceFilter === 'all' || f.audience === faqAudienceFilter)
                      .filter(f => !faqSearchQuery || f.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) || f.keywords_json.toLowerCase().includes(faqSearchQuery.toLowerCase()))
                      .map((faq) => {
                        let keywordsArr: string[] = [];
                        try {
                          keywordsArr = JSON.parse(faq.keywords_json || '[]');
                        } catch {
                          keywordsArr = [];
                        }

                        return (
                          <div key={faq.id} className="p-4 hover:bg-stone-50/80 transition-colors flex flex-col sm:flex-row justify-between gap-3 items-start">
                            <div className="space-y-1.5 flex-1 pr-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  faq.audience === 'customer'
                                    ? 'bg-[#4A0417]/10 text-[#4A0417] border border-[#4A0417]/20'
                                    : 'bg-slate-100 text-slate-800 border border-slate-300'
                                }`}>
                                  {faq.audience === 'customer' ? 'Customer' : 'Admin Help'}
                                </span>

                                <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200">
                                  {faq.category}
                                </span>

                                {faq.is_dynamic === 1 && (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 font-semibold flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Dynamic ({faq.dynamic_handler})
                                  </span>
                                )}

                                <span className="text-[10px] text-stone-400">Order: #{faq.display_order}</span>
                              </div>

                              <h4 className="text-xs font-bold text-[#1F1A1C]">
                                {faq.question}
                              </h4>

                              <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                                {faq.answer}
                              </p>

                              {keywordsArr.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {keywordsArr.slice(0, 6).map((kw, idx) => (
                                    <span key={idx} className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-mono">
                                      {kw}
                                    </span>
                                  ))}
                                  {keywordsArr.length > 6 && (
                                    <span className="text-[9px] text-stone-400">+{keywordsArr.length - 6} more</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                onClick={() => handleToggleFaqActive(faq.id, faq.is_active)}
                                className={`text-[11px] px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                                  faq.is_active === 1
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                {faq.is_active === 1 ? 'Active' : 'Disabled'}
                              </button>

                              <button
                                onClick={() => {
                                  setIsNewFaq(false);
                                  setEditingFaq({
                                    ...faq,
                                    keywords: keywordsArr.join(', ')
                                  });
                                }}
                                className="p-1.5 bg-[#FAF7F2] hover:bg-amber-50 text-[#4A0417] rounded border border-[#E8DDD3] transition-colors"
                                title="Edit Question & Answer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteFaq(faq.id)}
                                className="p-1.5 bg-[#FAF7F2] hover:bg-red-50 text-red-700 rounded border border-[#E8DDD3] transition-colors"
                                title="Delete FAQ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Live Rule & Intent Test Bench (1 Column) */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-[#E8DDD3] shadow-xs">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#E8DDD3]">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1F1A1C]">Live Intent Test Bench</h4>
                      <p className="text-[10px] text-stone-500">Test queries against live keyword matcher & DB</p>
                    </div>
                  </div>

                  <form onSubmit={handleRunTestQuery} className="mt-4 space-y-3">
                    <div className="flex gap-2 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="testAud"
                          checked={testAudience === 'customer'}
                          onChange={() => setTestAudience('customer')}
                          className="accent-[#4A0417]"
                        />
                        <span>Customer Bot</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                        <input
                          type="radio"
                          name="testAud"
                          checked={testAudience === 'admin'}
                          onChange={() => setTestAudience('admin')}
                          className="accent-[#4A0417]"
                        />
                        <span>Admin Help Bot</span>
                      </label>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                        Test Query (English / Hindi / Hinglish):
                      </label>
                      <input
                        type="text"
                        value={testQueryText}
                        onChange={(e) => setTestQueryText(e.target.value)}
                        placeholder="e.g. price of facial, ghar pe aate ho, cancel kaise kare..."
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!testQueryText.trim() || testLoading}
                      className="w-full py-2 bg-[#1F1A1C] hover:bg-[#382F32] text-amber-200 text-xs font-semibold rounded-md shadow-xs disabled:opacity-40 transition-colors"
                    >
                      {testLoading ? 'Evaluating intent...' : 'Test Match Engine'}
                    </button>
                  </form>

                  {/* Test Result Display */}
                  {testResult && (
                    <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-700">Evaluation Result:</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          testResult.matched
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {testResult.matched ? '✓ Exact Intent Match' : '⚠ Fallback Triggered'}
                        </span>
                      </div>

                      {testResult.matched && testResult.faq && (
                        <div className="space-y-1.5 pt-1 border-t border-stone-200">
                          <p className="text-[11px] text-stone-500">
                            Matched FAQ: <strong className="text-[#1F1A1C]">{testResult.faq.question}</strong>
                          </p>
                          <div className="p-2.5 bg-white rounded-lg border border-stone-200 text-[11px] text-stone-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                            {testResult.faq.answer}
                          </div>
                        </div>
                      )}

                      {!testResult.matched && (
                        <div className="space-y-1.5 pt-1 border-t border-stone-200">
                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            {testResult.fallbackMessage}
                          </p>
                          {testResult.suggestedOptions && (
                            <p className="text-[10px] text-stone-500">
                              Offered {testResult.suggestedOptions.length} suggested options.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sample one-click test suggestions */}
                  <div className="mt-4 pt-3 border-t border-stone-200 text-[11px]">
                    <span className="text-stone-500 block mb-1 font-semibold">Quick Test Suggestions:</span>
                    <div className="flex flex-wrap gap-1">
                      {['price of facial', 'ghar pe aate ho', 'COD available', 'cancel kaise kare', 'delhi serviceable', 'how to add a service'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setTestQueryText(s);
                            setTestAudience(s.includes('how to') ? 'admin' : 'customer');
                          }}
                          className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* DISPATCH ASSIGNMENT MODAL */}
      {selectedBookingForDispatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#E8DDD3] p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8DDD3]">
              <div>
                <h4 className="font-serif text-lg font-bold text-[#1F1A1C]">Manual Beautician Allocation</h4>
                <p className="text-xs text-[#7A6B6D]">Booking ID: {selectedBookingForDispatch.id} · {selectedBookingForDispatch.customer_name}</p>
              </div>
              <button onClick={() => setSelectedBookingForDispatch(null)} className="p-1 text-[#6B5A5C]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {dispatchError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded">
                {dispatchError}
              </div>
            )}

            <div className="bg-[#FAF7F2] p-3 rounded-lg text-xs space-y-1">
              <p><strong>Appointment:</strong> {selectedBookingForDispatch.appointment_date} at {selectedBookingForDispatch.appointment_slot}</p>
              <p><strong>Location:</strong> {selectedBookingForDispatch.flat}, {selectedBookingForDispatch.city} ({selectedBookingForDispatch.pincode})</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1F1A1C]">Select Beautician for this Slot:</label>
              <select
                value={selectedBeauticianId}
                onChange={(e) => setSelectedBeauticianId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
              >
                <option value="">-- Choose Specialist --</option>
                {beauticians.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.status !== 'available'}>
                    {b.name} ({b.phone}) · Rating {b.rating}★ {b.status !== 'available' ? '[On Leave]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1F1A1C]">Dispatch Instructions:</label>
              <input
                type="text"
                value={dispatchStatusNote}
                onChange={(e) => setDispatchStatusNote(e.target.value)}
                placeholder="e.g. Call guard on arrival, bring extra Rica cartridge"
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
              />
            </div>

            <div className="pt-2 border-t border-[#F4EFEA] flex justify-between items-center">
              <button
                onClick={() => handleUpdateBookingStatus(selectedBookingForDispatch.id, 'completed')}
                className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold"
              >
                Mark Completed
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedBookingForDispatch(null)}
                  className="px-3 py-1.5 text-xs text-[#6B5A5C] hover:bg-gray-100 rounded"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleConfirmAssignment}
                  className="px-4 py-1.5 bg-[#4A0417] text-white text-xs font-semibold rounded hover:bg-[#36020F]"
                >
                  Confirm Allocation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE EDIT MODAL */}
      {editingService && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-[#E8DDD3] p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8DDD3]">
              <h4 className="font-serif text-lg font-bold text-[#1F1A1C]">
                {isNewService ? 'Create New Beauty Ritual' : 'Edit Service & Pricing'}
              </h4>
              <button onClick={() => setEditingService(null)} className="p-1 text-[#6B5A5C]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5 text-xs max-h-[80vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Category *</label>
                  <select
                    value={editingService.categoryId || editingService.category_id}
                    onChange={(e) => setEditingService({ ...editingService, categoryId: e.target.value, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-semibold text-[#4A0417]"
                  >
                    <option value="cat-rica">RICA Waxing</option>
                    <option value="cat-honey">Honey Waxing</option>
                    <option value="cat-korean">Korean Waxing</option>
                    <option value="cat-brazilian">Brazilian Peel-Off Waxing</option>
                    <option value="cat-packages">Beauty Packages</option>
                    {categories
                      .filter(c => !['cat-rica', 'cat-honey', 'cat-korean', 'cat-brazilian', 'cat-packages'].includes(c.id))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingService.sellingPrice}
                    onChange={(e) => setEditingService({ ...editingService, sellingPrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-bold text-sm text-[#4A0417]"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={editingService.originalPrice || ''}
                    onChange={(e) => setEditingService({ ...editingService, originalPrice: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-2.5 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Duration (Mins) *</label>
                  <input
                    type="number"
                    required
                    value={editingService.durationMins}
                    onChange={(e) => setEditingService({ ...editingService, durationMins: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-2.5">
                <span className="font-bold text-[#4A0417] uppercase tracking-wider text-[11px] block">
                  Service Requirements & Protocol
                </span>

                <div>
                  <label className="font-semibold block mb-1 text-[11px]">Room Conditions (e.g. AC Room Required)</label>
                  <input
                    type="text"
                    value={editingService.roomConditions || editingService.room_conditions || ''}
                    onChange={(e) => setEditingService({ ...editingService, roomConditions: e.target.value })}
                    placeholder="Air-conditioned cool room required (approx. 22-24°C)"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD3] rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="font-semibold block mb-1">Pre-Care Guidelines</label>
                    <input
                      type="text"
                      value={editingService.beforeInstructions || editingService.before_instructions || ''}
                      onChange={(e) => setEditingService({ ...editingService, beforeInstructions: e.target.value })}
                      placeholder="Hair length at least 1/4 inch..."
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E8DDD3] rounded"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Post-Care Guidelines</label>
                    <input
                      type="text"
                      value={editingService.afterInstructions || editingService.after_instructions || ''}
                      onChange={(e) => setEditingService({ ...editingService, afterInstructions: e.target.value })}
                      placeholder="Avoid hot baths & sun exposure for 24h..."
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E8DDD3] rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[11px]">Hygiene Precautions</label>
                  <input
                    type="text"
                    value={editingService.hygienePrecautions || editingService.hygiene_precautions || ''}
                    onChange={(e) => setEditingService({ ...editingService, hygienePrecautions: e.target.value })}
                    placeholder="Sealed disposables unpacked in front of client. No double-dipping."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DDD3] rounded"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={editingService.isActive !== false}
                      onChange={(e) => setEditingService({ ...editingService, isActive: e.target.checked })}
                      className="accent-[#4A0417]"
                    />
                    <span>Active in System</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={editingService.isPublished !== false}
                      onChange={(e) => setEditingService({ ...editingService, isPublished: e.target.checked })}
                      className="accent-[#4A0417]"
                    />
                    <span>Published to Storefront</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F4EFEA]">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-1.5 text-[#6B5A5C] hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#4A0417] text-white rounded font-semibold hover:bg-[#36020F]"
                >
                  Save in Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CAMPAIGN MODAL */}
      {isNewCampaignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E8DDD3] p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8DDD3]">
              <h4 className="font-serif text-lg font-bold text-[#1F1A1C]">New Promotional Campaign</h4>
              <button onClick={() => setIsNewCampaignModal(false)} className="p-1 text-[#6B5A5C]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Campaign Headline *</label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. Summer Glow Fest: 30% OFF"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Campaign Subtitle</label>
                <input
                  type="text"
                  value={campaignSubtitle}
                  onChange={(e) => setCampaignSubtitle(e.target.value)}
                  placeholder="e.g. Book luxury facials at doorstep across Delhi NCR"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Discount %</label>
                  <input
                    type="number"
                    value={campaignDiscount}
                    onChange={(e) => setCampaignDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="flash"
                    checked={campaignIsFlash}
                    onChange={(e) => setCampaignIsFlash(e.target.checked)}
                    className="accent-[#4A0417]"
                  />
                  <label htmlFor="flash" className="font-semibold cursor-pointer">Flash Deal (Countdown)</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F4EFEA]">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModal(false)}
                  className="px-4 py-1.5 text-[#6B5A5C] hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#4A0417] text-white rounded font-semibold hover:bg-[#36020F]"
                >
                  Publish Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CATEGORY MODAL */}
      {isNewCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E8DDD3] p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8DDD3]">
              <h4 className="font-serif text-lg font-bold text-[#1F1A1C]">Add New Service Category</h4>
              <button onClick={() => setIsNewCategoryModal(false)} className="p-1 text-[#6B5A5C]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Body Polishing & Scrubs"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="e.g. Full body exfoliations and skin brightening wraps."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Display Order</label>
                <input
                  type="number"
                  value={newCatOrder}
                  onChange={(e) => setNewCatOrder(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F4EFEA]">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModal(false)}
                  className="px-4 py-1.5 text-[#6B5A5C] hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#4A0417] text-white rounded font-semibold hover:bg-[#36020F]"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / CREATE FAQ MODAL */}
      {editingFaq && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[#E8DDD3] p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8DDD3]">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#4A0417]" />
                <h4 className="font-serif text-lg font-bold text-[#1F1A1C]">
                  {isNewFaq ? 'Create New FAQ Rule' : 'Edit FAQ & Keyword Aliases'}
                </h4>
              </div>
              <button 
                onClick={() => { setEditingFaq(null); setIsNewFaq(false); }} 
                className="p-1 text-[#6B5A5C] hover:text-stone-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Target Audience *</label>
                  <select
                    value={editingFaq.audience}
                    onChange={(e) => setEditingFaq({ ...editingFaq, audience: e.target.value })}
                    disabled={!isNewFaq}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-medium"
                  >
                    <option value="customer">Customer Storefront (beautydoor.in)</option>
                    <option value="admin">Admin Console Help (admin.beautydoor.in)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">FAQ Category *</label>
                  <input
                    type="text"
                    required
                    value={editingFaq.category}
                    onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                    placeholder="e.g. Pricing, Bookings, Support"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Question Text *</label>
                <input
                  type="text"
                  required
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  placeholder="e.g. What are the service prices?"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Answer Text {editingFaq.is_dynamic ? '(Fallback / Template)' : '*'}
                </label>
                <textarea
                  rows={4}
                  required={!editingFaq.is_dynamic}
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  placeholder="Enter detailed answer or guidance instructions..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Keyword Aliases & Hindi/Hinglish Variations (Comma separated)
                </label>
                <input
                  type="text"
                  value={editingFaq.keywords || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, keywords: e.target.value })}
                  placeholder="e.g. price, cost, rate, charges, paise kitne, kitna lagega, rate card"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-mono"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  When a customer types any of these keywords, this answer is automatically retrieved.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold block mb-1">Dynamic Database Handler</label>
                  <select
                    value={editingFaq.dynamic_handler || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingFaq({
                        ...editingFaq,
                        dynamic_handler: val || null,
                        is_dynamic: val ? 1 : 0
                      });
                    }}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  >
                    <option value="">Static Answer (No DB query)</option>
                    <option value="get_services_catalog">get_services_catalog (Live Services & Categories)</option>
                    <option value="get_service_pricing">get_service_pricing (Live Lowest Pricing per Category)</option>
                    <option value="get_service_areas">get_service_areas (Live Serviceable Pincodes & Hubs)</option>
                    <option value="get_payment_methods">get_payment_methods (Payment Settings)</option>
                    <option value="get_cancellation_policy">get_cancellation_policy (Cancellation Hours & Policy)</option>
                    <option value="get_active_offers">get_active_offers (Live Campaigns & Active Promo Codes)</option>
                    <option value="get_support_contact">get_support_contact (Helpline, WhatsApp & Hours)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingFaq.display_order}
                    onChange={(e) => setEditingFaq({ ...editingFaq, display_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="faq_is_active"
                  checked={editingFaq.is_active === 1 || editingFaq.is_active === true}
                  onChange={(e) => setEditingFaq({ ...editingFaq, is_active: e.target.checked ? 1 : 0 })}
                  className="accent-[#4A0417]"
                />
                <label htmlFor="faq_is_active" className="font-semibold cursor-pointer">
                  Rule is Active & Visible in Chatbot
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F4EFEA]">
                <button
                  type="button"
                  onClick={() => { setEditingFaq(null); setIsNewFaq(false); }}
                  className="px-4 py-1.5 text-[#6B5A5C] hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#4A0417] text-white rounded font-semibold hover:bg-[#36020F]"
                >
                  Save FAQ Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / CREATE PACKAGE MODAL */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[#E8DDD3] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8DDD3]">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#4A0417]" />
                <h4 className="font-serif text-lg font-bold text-[#1F1A1C]">
                  {isNewPackage ? 'Create Official BeautyDoor Package' : 'Edit Package & Inclusions'}
                </h4>
              </div>
              <button 
                onClick={() => { setEditingPackage(null); setIsNewPackage(false); }} 
                className="p-1 text-[#6B5A5C] hover:text-[#1F1A1C]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={editingPackage.name}
                    onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                    placeholder="e.g. Monthly Glow Package"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Subtitle / Badge</label>
                  <input
                    type="text"
                    value={editingPackage.badge || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, badge: e.target.value })}
                    placeholder="e.g. Best Value, Signature Glow"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingPackage.selling_price}
                    onChange={(e) => setEditingPackage({ ...editingPackage, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={editingPackage.original_price || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, original_price: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Duration (Display Text) *</label>
                  <input
                    type="text"
                    required
                    value={editingPackage.duration_display || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, duration_display: e.target.value })}
                    placeholder="e.g. 1 hour 35 minutes"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Package Description</label>
                <textarea
                  rows={2}
                  value={editingPackage.description || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  placeholder="Detailed ritual summary..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              {/* Inclusions Editor */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#4A0417] uppercase tracking-wider text-[11px]">
                    Included Treatments & Free Gifts
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = editingPackage.inclusions || [];
                      setEditingPackage({
                        ...editingPackage,
                        inclusions: [...current, { name: '', is_free: false }]
                      });
                    }}
                    className="text-[11px] text-[#4A0417] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#C5A880]" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(editingPackage.inclusions || []).map((inc: any, idx: number) => {
                    const incName = typeof inc === 'object' ? inc.name : String(inc);
                    const isFree = typeof inc === 'object' ? !!inc.is_free : false;

                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#E8DDD3]">
                        <input
                          type="text"
                          required
                          value={incName}
                          onChange={(e) => {
                            const updated = [...editingPackage.inclusions];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setEditingPackage({ ...editingPackage, inclusions: updated });
                          }}
                          placeholder="e.g. Lotus White Glow Facial"
                          className="flex-1 px-2.5 py-1 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded"
                        />

                        <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isFree}
                            onChange={(e) => {
                              const updated = [...editingPackage.inclusions];
                              updated[idx] = { ...updated[idx], is_free: e.target.checked };
                              setEditingPackage({ ...editingPackage, inclusions: updated });
                            }}
                            className="accent-emerald-600"
                          />
                          <span>Complimentary (FREE)</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingPackage.inclusions.filter((_: any, i: number) => i !== idx);
                            setEditingPackage({ ...editingPackage, inclusions: updated });
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pkg_published"
                    checked={editingPackage.is_published === 1 || editingPackage.is_published === true}
                    onChange={(e) => setEditingPackage({ ...editingPackage, is_published: e.target.checked ? 1 : 0 })}
                    className="accent-[#4A0417]"
                  />
                  <label htmlFor="pkg_published" className="font-semibold cursor-pointer">
                    Live & Bookable on Storefront
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-semibold">Display Order:</label>
                  <input
                    type="number"
                    value={editingPackage.display_order || 1}
                    onChange={(e) => setEditingPackage({ ...editingPackage, display_order: Number(e.target.value) })}
                    className="w-16 px-2 py-1 bg-[#FAF7F2] border border-[#E8DDD3] rounded text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F4EFEA]">
                <button
                  type="button"
                  onClick={() => { setEditingPackage(null); setIsNewPackage(false); }}
                  className="px-4 py-1.5 text-[#6B5A5C] hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#4A0417] text-white rounded font-semibold hover:bg-[#36020F]"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / CREATE HYGIENE COMMITMENT MODAL */}
      {editingHygiene && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#E8DDD3] p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8DDD3]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#4A0417]" />
                <h4 className="font-serif text-lg font-bold text-[#1F1A1C]">
                  {isNewHygiene ? 'Add Hygiene Commitment' : 'Edit Hygiene Commitment'}
                </h4>
              </div>
              <button 
                onClick={() => { setEditingHygiene(null); setIsNewHygiene(false); }} 
                className="p-1 text-[#6B5A5C] hover:text-[#1F1A1C]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHygiene} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Commitment Title *</label>
                <input
                  type="text"
                  required
                  value={editingHygiene.title}
                  onChange={(e) => setEditingHygiene({ ...editingHygiene, title: e.target.value })}
                  placeholder="e.g. 100% Single-Use Disposables"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editingHygiene.description}
                  onChange={(e) => setEditingHygiene({ ...editingHygiene, description: e.target.value })}
                  placeholder="Precise client-facing hygiene guarantee..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingHygiene.display_order || 1}
                    onChange={(e) => setEditingHygiene({ ...editingHygiene, display_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="hyg_single_use"
                    checked={editingHygiene.is_single_use === 1 || editingHygiene.is_single_use === true}
                    onChange={(e) => setEditingHygiene({ ...editingHygiene, is_single_use: e.target.checked ? 1 : 0 })}
                    className="accent-[#4A0417]"
                  />
                  <label htmlFor="hyg_single_use" className="font-semibold cursor-pointer">
                    100% Single-Use Item
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F4EFEA]">
                <button
                  type="button"
                  onClick={() => { setEditingHygiene(null); setIsNewHygiene(false); }}
                  className="px-4 py-1.5 text-[#6B5A5C] hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#4A0417] text-white rounded font-semibold hover:bg-[#36020F]"
                >
                  Save Commitment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM PENDING PRICE & PUBLISH MODAL */}
      {confirmingPriceService && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E8DDD3] p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8DDD3]">
              <div className="flex items-center gap-2 text-[#4A0417]">
                <Tag className="w-5 h-5 text-[#C5A880]" />
                <h4 className="font-serif text-lg font-bold text-[#1F1A1C]">
                  Authorize Owner Price & Publish
                </h4>
              </div>
              <button 
                onClick={() => setConfirmingPriceService(null)} 
                className="p-1 text-[#6B5A5C] hover:text-[#1F1A1C]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] text-xs space-y-1">
              <p className="font-bold text-[#1F1A1C] text-sm">{confirmingPriceService.name}</p>
              <p className="text-[#6B5A5C]">Category: {categories.find(c => c.id === confirmingPriceService.category_id)?.name || confirmingPriceService.category_id}</p>
              <p className="text-[#6B5A5C]">Duration: {confirmingPriceService.duration_mins} mins</p>
              <p className="text-amber-800 italic pt-1 border-t border-[#E8DDD3]">
                "{confirmingPriceService.pending_notes || 'Price awaiting confirmation from business owner'}"
              </p>
            </div>

            <form onSubmit={handleConfirmPendingPrice} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-[#1F1A1C]">
                  Confirmed Selling Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  value={confirmedSellingPriceInput}
                  onChange={(e) => setConfirmedSellingPriceInput(e.target.value)}
                  placeholder="e.g. 60 or 250"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#1F1A1C]">
                  Optional Original / MRP Price (₹)
                </label>
                <input
                  type="number"
                  value={confirmedOriginalPriceInput}
                  onChange={(e) => setConfirmedOriginalPriceInput(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <p className="text-[11px] text-[#7A6B6D] leading-relaxed">
                Submitting this will log an authorized price record into <code>price_audit_logs</code>, enable the service, and make it immediately visible to customers on beautydoor.in.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F4EFEA]">
                <button
                  type="button"
                  onClick={() => setConfirmingPriceService(null)}
                  className="px-4 py-1.5 text-[#6B5A5C] hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#4A0417] text-white rounded font-semibold hover:bg-[#36020F]"
                >
                  Authorize & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN STEP-BY-STEP HELP CHATBOT DRAWER */}
      <AdminChatbot token={token} onNavigateTab={(tab) => setActiveTab(tab as any)} />

    </div>
  );
}
