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
  FileText
} from 'lucide-react';

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('beautydoor_admin_token');
  });
  const [adminUser, setAdminUser] = useState<any>(() => {
    const raw = localStorage.getItem('beautydoor_admin_user');
    return raw ? JSON.parse(raw) : null;
  });

  // Login form state
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('Admin@BeautyDoor2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab: 24 modules architecture
  const [activeTab, setActiveTab] = useState<
    'overview' | 'dispatch' | 'services' | 'categories' | 'campaigns' | 'beauticians' | 'territories' | 'coupons' | 'customers' | 'reviews' | 'audit' | 'settings'
  >('dispatch');

  // Module data
  const [overview, setOverview] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
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
      const [ov, bk, srv, cats, cust, camp, beau, ter, coup, rev, aud, sett] = await Promise.all([
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
        fetch('/api/admin/settings', { headers }).then(r => r.json())
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417] text-sm"
              />
              <p className="text-[11px] text-[#8C7A7C] mt-1">Default credentials: admin / Admin@BeautyDoor2026</p>
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
            <span>Catalog & Pricing ({services.length})</span>
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

        {/* 3. CATALOG & DYNAMIC PRICING */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                  Service Catalog & Dynamic Pricing
                </h3>
                <p className="text-xs text-[#7A6B6D]">
                  Changes persist in SQLite and reflect live on beautydoor.in immediately.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingService({
                    id: `srv-${Date.now()}`,
                    categoryId: 'facial',
                    name: '',
                    description: '',
                    benefits: ['Deep rejuvenation', 'Satin finish'],
                    durationMins: 60,
                    originalPrice: 1999,
                    sellingPrice: 1299,
                    discountPercent: 35,
                    whatsIncluded: ['Sealed kit', 'Deep cleansing', 'Serum infusion'],
                    variants: [],
                    addons: [],
                    isActive: true,
                    isPopular: false,
                    isBestseller: false,
                    isFeaturedDeal: false
                  });
                  setIsNewService(true);
                }}
                className="px-4 py-2 bg-[#4A0417] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>Add New Service</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((s) => (
                <div key={s.id} className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8C7A7C] mb-1">
                      <span className="uppercase font-semibold text-[#4A0417]">{s.category_id}</span>
                      <span className="tabular-nums">{s.duration_mins} mins</span>
                    </div>

                    <h4 className="text-sm font-semibold text-[#1F1A1C] leading-snug">{s.name}</h4>
                    <p className="text-xs text-[#5C4D4F] mt-1 line-clamp-2">{s.description}</p>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-base font-bold text-[#1F1A1C] tabular-nums">₹{s.selling_price}</span>
                      <span className="text-xs text-[#8C7A7C] line-through tabular-nums">₹{s.original_price}</span>
                      {s.discount_percent > 0 && (
                        <span className="text-xs text-emerald-800 font-semibold">{s.discount_percent}% OFF</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F4EFEA] flex justify-between items-center text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      s.is_active === 1 ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {s.is_active === 1 ? 'Live on Storefront' : 'Hidden'}
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
                          isActive: s.is_active === 1
                        });
                        setIsNewService(false);
                      }}
                      className="px-3 py-1 bg-[#FAF7F2] hover:bg-[#EAE2D8] border border-[#E8DDD3] rounded text-[#4A0417] font-semibold"
                    >
                      Edit Pricing
                    </button>
                  </div>
                </div>
              ))}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Helpline Phone</label>
                    <input
                      type="text"
                      value={settings.contact_phone || '+91 99991 23456'}
                      onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">WhatsApp Support</label>
                    <input
                      type="text"
                      value={settings.support_whatsapp || '+91 99991 23456'}
                      onChange={(e) => setSettings({ ...settings, support_whatsapp: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Support Email</label>
                    <input
                      type="email"
                      value={settings.contact_email || 'concierge@beautydoor.in'}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
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

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingService.sellingPrice}
                    onChange={(e) => setEditingService({ ...editingService, sellingPrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={editingService.originalPrice}
                    onChange={(e) => setEditingService({ ...editingService, originalPrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={editingService.durationMins}
                    onChange={(e) => setEditingService({ ...editingService, durationMins: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
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

    </div>
  );
}
