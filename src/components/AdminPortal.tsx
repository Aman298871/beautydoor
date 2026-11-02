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
  AlertCircle
} from 'lucide-react';
import {
  Booking,
  ServiceItem,
  Beautician,
  Territory,
  Coupon,
  BusinessSettings
} from '../types.ts';

interface Props {
  onCloseAdmin: () => void;
  onRefreshData: () => void;
}

export const AdminPortal: React.FC<Props> = ({
  onCloseAdmin,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'dispatch' | 'services' | 'beauticians' | 'territories' | 'coupons' | 'settings'
  >('dispatch');

  // Overview metrics state
  const [overview, setOverview] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [beauticians, setBeauticians] = useState<Beautician[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(false);

  // Dispatch modal
  const [selectedBookingForDispatch, setSelectedBookingForDispatch] = useState<Booking | null>(null);
  const [selectedBeauticianId, setSelectedBeauticianId] = useState<string>('');
  const [dispatchStatusNote, setDispatchStatusNote] = useState<string>('');

  // Service Edit modal
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isNewService, setIsNewService] = useState(false);

  // New Beautician modal
  const [isNewBeauticianModal, setIsNewBeauticianModal] = useState(false);
  const [newBeauticianName, setNewBeauticianName] = useState('');
  const [newBeauticianPhone, setNewBeauticianPhone] = useState('');
  const [newBeauticianSpecialties, setNewBeauticianSpecialties] = useState('facial, waxing');

  // Search & Filters in Dispatch
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [ovRes, bkRes, srvRes, beauRes, terRes, coupRes, settRes] = await Promise.all([
        fetch('/api/admin/overview').then(r => r.json()),
        fetch('/api/admin/bookings').then(r => r.json()),
        fetch('/api/admin/services').then(r => r.json()),
        fetch('/api/admin/beauticians').then(r => r.json()),
        fetch('/api/territories').then(r => r.json()),
        fetch('/api/admin/coupons').then(r => r.json()),
        fetch('/api/admin/settings').then(r => r.json())
      ]);

      setOverview(ovRes);
      setBookings(bkRes.bookings || []);
      setServices(srvRes.services || []);
      setBeauticians(beauRes.beauticians || []);
      setTerritories(terRes.territories || []);
      setCoupons(coupRes.coupons || []);
      setSettings(settRes.settings || null);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // Update Booking Status / Assign Beautician
  const handleAssignBeautician = async () => {
    if (!selectedBookingForDispatch) return;
    try {
      const payload: Partial<Booking> = {
        assignedBeauticianId: selectedBeauticianId || undefined,
        bookingStatus: selectedBeauticianId ? 'assigned' : 'confirmed',
        internalNotes: dispatchStatusNote ? `${selectedBookingForDispatch.internalNotes || ''} | Dispatch note: ${dispatchStatusNote}` : selectedBookingForDispatch.internalNotes
      };

      const res = await fetch(`/api/admin/bookings/${selectedBookingForDispatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSelectedBookingForDispatch(null);
        setSelectedBeauticianId('');
        setDispatchStatusNote('');
        fetchAllAdminData();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: Booking['bookingStatus']) => {
    try {
      await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingStatus: newStatus })
      });
      fetchAllAdminData();
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Territory / Pincode
  const handleToggleTerritory = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/territories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      fetchAllAdminData();
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Coupon
  const handleToggleCoupon = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      fetchAllAdminData();
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Beautician Status (available vs on_leave)
  const handleToggleBeauticianStatus = async (id: string, currentStatus: string) => {
    try {
      await fetch(`/api/admin/beauticians/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentStatus === 'available' ? 'on_leave' : 'available' })
      });
      fetchAllAdminData();
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      if (isNewService) {
        await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingService)
        });
      } else {
        await fetch(`/api/admin/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingService)
        });
      }
      setEditingService(null);
      setIsNewService(false);
      fetchAllAdminData();
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Bookings for Dispatch
  const filteredBookings = bookings.filter(b => {
    if (statusFilter !== 'all' && b.bookingStatus !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.address.pincode.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4EFEA] text-[#1F1A1C]">
      {/* Admin Top Header */}
      <header className="bg-white border-b border-[#E8DDD3] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <h1 className="text-base sm:text-lg font-serif font-bold text-[#4A0417]">
              BeautyDoor Enterprise Operations & Dispatch
            </h1>
            <span className="hidden sm:inline-block text-xs uppercase tracking-wider text-[#8C7A7C] bg-[#FAF7F2] px-2.5 py-0.5 rounded border border-[#E8DDD3]">
              Delhi NCR Cluster
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllAdminData}
              className="text-xs font-semibold px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#EAE2D8] border border-[#E8DDD3] rounded text-[#4A0417] transition-colors"
            >
              Refresh Data
            </button>
            <button
              onClick={onCloseAdmin}
              className="text-xs font-semibold px-4 py-1.5 bg-[#4A0417] hover:bg-[#36020F] text-white rounded transition-colors"
            >
              Back to Storefront
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-4 overflow-x-auto text-xs font-semibold text-[#6B5A5C]">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dispatch'
                ? 'border-[#4A0417] text-[#4A0417] font-bold'
                : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Dispatch Board ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-[#4A0417] text-[#4A0417] font-bold'
                : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Executive KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'border-[#4A0417] text-[#4A0417] font-bold'
                : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Catalog & Pricing ({services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('beauticians')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'beauticians'
                ? 'border-[#4A0417] text-[#4A0417] font-bold'
                : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Beauticians Roster ({beauticians.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('territories')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'territories'
                ? 'border-[#4A0417] text-[#4A0417] font-bold'
                : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Delhi NCR Pincodes ({territories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'coupons'
                ? 'border-[#4A0417] text-[#4A0417] font-bold'
                : 'border-transparent hover:text-[#1F1A1C]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Offers & Coupons ({coupons.length})</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. DISPATCH BOARD (Confirmed Choice: Manual Beautician Assignment by Admin) */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-[#E8DDD3] flex flex-col sm:flex-row gap-3 justify-between items-center shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#8C7A7C] absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Booking ID, customer or phone..."
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
                  <option value="assigned">Beautician Assigned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Bookings Table / Dispatch Grid */}
            <div className="bg-white rounded-2xl border border-[#E8DDD3] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#4A0417] uppercase tracking-wider font-semibold border-b border-[#E8DDD3]">
                    <tr>
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Customer & Phone</th>
                      <th className="py-3 px-4">Territory & Address</th>
                      <th className="py-3 px-4">Schedule</th>
                      <th className="py-3 px-4">Payable</th>
                      <th className="py-3 px-4">Assigned Specialist</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Dispatch Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4EFEA]">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#8C7A7C] italic">
                          No bookings found matching current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => {
                        const assignedBeautician = beauticians.find(a => a.id === b.assignedBeauticianId);
                        return (
                          <tr key={b.id} className="hover:bg-[#FAF7F2] transition-colors">
                            <td className="py-3.5 px-4 font-bold text-[#4A0417] tabular-nums">
                              {b.id}
                            </td>

                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-[#1F1A1C]">{b.customerName}</p>
                              <p className="text-[#6B5A5C] text-[11px] tabular-nums">{b.customerPhone}</p>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              <p className="font-medium text-[#1F1A1C] truncate">{b.address.flat}</p>
                              <p className="text-[#6B5A5C] text-[11px]">
                                {b.address.area}, {b.address.city} ({b.address.pincode})
                              </p>
                            </td>

                            <td className="py-3.5 px-4 tabular-nums">
                              <p className="font-semibold text-[#1F1A1C]">{b.appointmentDate}</p>
                              <p className="text-[#6B5A5C] text-[11px]">{b.appointmentSlot}</p>
                            </td>

                            <td className="py-3.5 px-4 tabular-nums font-bold text-[#1F1A1C]">
                              ₹{b.totalPayable}
                              <span className="block text-[10px] font-normal text-emerald-800">
                                {b.paymentMethod} ({b.paymentStatus})
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {assignedBeautician ? (
                                <div>
                                  <p className="font-semibold text-[#1F1A1C]">{assignedBeautician.name}</p>
                                  <p className="text-[11px] text-[#6B5A5C] tabular-nums">{assignedBeautician.phone}</p>
                                </div>
                              ) : (
                                <span className="text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                                  Unassigned
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                b.bookingStatus === 'confirmed' || b.bookingStatus === 'assigned'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : b.bookingStatus === 'completed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : b.bookingStatus === 'cancelled'
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {b.bookingStatus}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedBookingForDispatch(b);
                                  setSelectedBeauticianId(b.assignedBeauticianId || '');
                                }}
                                className="px-3 py-1.5 bg-[#4A0417] text-white hover:bg-[#36020F] text-xs font-semibold rounded shadow-xs transition-colors"
                              >
                                {b.assignedBeauticianId ? 'Reassign' : 'Assign Staff'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
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
                <span className="text-xs uppercase text-[#8C7A7C] font-semibold">Total Bookings</span>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-[#1F1A1C] mt-1 tabular-nums">
                  {overview.totalBookings || 0}
                </p>
                <p className="text-xs text-[#6B5A5C] mt-1">
                  Today's slots: {overview.todayBookingsCount || 0}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs">
                <span className="text-xs uppercase text-[#8C7A7C] font-semibold">Active Beauticians</span>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-[#1F1A1C] mt-1 tabular-nums">
                  {overview.activeBeauticiansCount || 0} / {beauticians.length}
                </p>
                <p className="text-xs text-emerald-800 font-medium mt-1">
                  100% Verified in Delhi NCR
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs">
                <span className="text-xs uppercase text-[#8C7A7C] font-semibold">Coverage Status</span>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-[#1F1A1C] mt-1 tabular-nums">
                  {overview.activeTerritoriesCount || 0} Pincodes
                </p>
                <p className="text-xs text-[#6B5A5C] mt-1">
                  6 NCR Municipalities Active
                </p>
              </div>
            </div>

            {/* Status Breakdown Bar */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#1F1A1C]">
                Booking Pipeline Status
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-amber-800 font-semibold">Pending Assign</span>
                  <p className="text-xl font-bold mt-1 text-amber-950 tabular-nums">
                    {overview.statusCounts?.pending || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-blue-800 font-semibold">Assigned & Active</span>
                  <p className="text-xl font-bold mt-1 text-blue-950 tabular-nums">
                    {(overview.statusCounts?.assigned || 0) + (overview.statusCounts?.confirmed || 0)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 font-semibold">Completed</span>
                  <p className="text-xl font-bold mt-1 text-emerald-950 tabular-nums">
                    {overview.statusCounts?.completed || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-red-800 font-semibold">Cancelled</span>
                  <p className="text-xl font-bold mt-1 text-red-950 tabular-nums">
                    {overview.statusCounts?.cancelled || 0}
                  </p>
                </div>
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
                  Changes here immediately update the customer website without redeploying.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingService({
                    id: `srv-${Date.now()}`,
                    categoryId: 'facial',
                    name: '',
                    description: '',
                    benefits: ['Deep rejuvenation', 'Long-lasting glow'],
                    durationMins: 60,
                    originalPrice: 1999,
                    sellingPrice: 1299,
                    discountPercent: 35,
                    whatsIncluded: ['Sealed kit', 'Pre-cleansing', 'Deep massage', 'Hydration mask'],
                    variants: [],
                    addons: [],
                    isActive: true
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
                <div
                  key={s.id}
                  className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8C7A7C] mb-1">
                      <span className="uppercase font-semibold text-[#4A0417]">{s.categoryId}</span>
                      <span className="tabular-nums">{s.durationMins} mins</span>
                    </div>

                    <h4 className="text-sm font-semibold text-[#1F1A1C] leading-snug">
                      {s.name}
                    </h4>

                    <p className="text-xs text-[#5C4D4F] mt-1 line-clamp-2">
                      {s.description}
                    </p>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-base font-bold text-[#1F1A1C] tabular-nums">
                        ₹{s.sellingPrice}
                      </span>
                      <span className="text-xs text-[#8C7A7C] line-through tabular-nums">
                        ₹{s.originalPrice}
                      </span>
                      <span className="text-xs text-emerald-800 font-semibold">
                        {s.discountPercent}% OFF
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F4EFEA] flex justify-between items-center text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      s.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {s.isActive ? 'Live on Storefront' : 'Hidden'}
                    </span>

                    <button
                      onClick={() => {
                        setEditingService(s);
                        setIsNewService(false);
                      }}
                      className="px-3 py-1 bg-[#FAF7F2] hover:bg-[#EAE2D8] border border-[#E8DDD3] rounded text-[#4A0417] font-semibold"
                    >
                      Edit Pricing & Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. BEAUTICIANS ROSTER */}
        {activeTab === 'beauticians' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                  Certified Beautician Roster (Delhi NCR)
                </h3>
                <p className="text-xs text-[#7A6B6D]">
                  Manage staff availability, territories, and active leave status.
                </p>
              </div>

              <button
                onClick={() => setIsNewBeauticianModal(true)}
                className="px-4 py-2 bg-[#4A0417] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>Add Specialist</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {beauticians.map((b) => (
                <div
                  key={b.id}
                  className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#1F1A1C]">{b.name}</h4>
                      <p className="text-xs text-[#6B5A5C] tabular-nums">{b.phone}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ★ {b.rating} ({b.totalJobs} jobs)
                    </span>
                  </div>

                  <div className="text-xs text-[#554749] space-y-1">
                    <p>
                      <span className="font-semibold text-[#1F1A1C]">Specialties: </span>
                      {b.specialties.join(', ')}
                    </p>
                    <p>
                      <span className="font-semibold text-[#1F1A1C]">Active Hubs: </span>
                      {b.territories.join(', ')}
                    </p>
                    <p>
                      <span className="font-semibold text-[#1F1A1C]">Experience: </span>
                      {b.experienceYears} Years Certified
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F4EFEA] flex justify-between items-center">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      b.status === 'available' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {b.status === 'available' ? 'On Duty' : 'On Leave'}
                    </span>

                    <button
                      onClick={() => handleToggleBeauticianStatus(b.id, b.status)}
                      className="px-3 py-1 text-xs border border-[#E8DDD3] rounded hover:bg-[#FAF7F2] font-medium"
                    >
                      {b.status === 'available' ? 'Mark On Leave' : 'Set Active'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. DELHI NCR TERRITORIES & PINCODES */}
        {activeTab === 'territories' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                Delhi NCR Serviceable Pincodes & Hubs
              </h3>
              <p className="text-xs text-[#7A6B6D]">
                Activate or deactivate sectors to instantly update live customer availability.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DDD3] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#4A0417] uppercase tracking-wider font-semibold border-b border-[#E8DDD3]">
                  <tr>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Locality / Sector Name</th>
                    <th className="py-3 px-4">Pincode</th>
                    <th className="py-3 px-4">Min Order</th>
                    <th className="py-3 px-4">Convenience Fee</th>
                    <th className="py-3 px-4 text-right">Status Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {territories.map((t) => (
                    <tr key={t.id} className="hover:bg-[#FAF7F2]">
                      <td className="py-3 px-4 font-bold text-[#1F1A1C]">{t.city}</td>
                      <td className="py-3 px-4 text-[#554749]">{t.areaName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#4A0417]">{t.pincode}</td>
                      <td className="py-3 px-4 tabular-nums">₹{t.minOrderAmount}</td>
                      <td className="py-3 px-4 tabular-nums">
                        {t.deliveryFee === 0 ? 'FREE' : `₹${t.deliveryFee}`}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleTerritory(t.id, t.isActive)}
                          className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                            t.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {t.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. OFFERS & COUPONS */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                Promotional Offers & Coupon Engine
              </h3>
              <p className="text-xs text-[#7A6B6D]">
                Admin controlled promo discounts with min order and cap thresholds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <div key={c.id} className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-[#4A0417] tracking-wider">
                      {c.code}
                    </span>
                    <button
                      onClick={() => handleToggleCoupon(c.id, c.isActive)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        c.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                  <p className="text-xs text-[#554749]">{c.description}</p>
                  <div className="text-xs text-[#7A6B6D] space-y-1 pt-2 border-t border-[#F4EFEA]">
                    <p>Discount: <span className="font-semibold text-[#1F1A1C]">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</span></p>
                    <p>Min Booking: <span className="font-semibold text-[#1F1A1C]">₹{c.minOrderAmount}</span></p>
                    <p>Max Discount Cap: <span className="font-semibold text-[#1F1A1C]">₹{c.maxDiscount}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* DISPATCH ALLOCATION MODAL */}
      {selectedBookingForDispatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8DDD3] p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD3]">
              <div>
                <h4 className="font-serif text-lg font-bold text-[#1F1A1C]">
                  Manual Beautician Dispatch Assignment
                </h4>
                <p className="text-xs text-[#7A6B6D]">
                  Booking ID: {selectedBookingForDispatch.id} · {selectedBookingForDispatch.customerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedBookingForDispatch(null)}
                className="p-1 text-[#6B5A5C] hover:text-[#1F1A1C]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Appointment Details preview */}
            <div className="bg-[#FAF7F2] p-3 rounded-lg text-xs space-y-1">
              <p><span className="font-semibold">Schedule:</span> {selectedBookingForDispatch.appointmentDate} at {selectedBookingForDispatch.appointmentSlot}</p>
              <p><span className="font-semibold">Location:</span> {selectedBookingForDispatch.address.flat}, {selectedBookingForDispatch.address.city} ({selectedBookingForDispatch.address.pincode})</p>
              <p><span className="font-semibold">Services:</span> {selectedBookingForDispatch.items.map(i => i.serviceName).join(', ')}</p>
            </div>

            {/* Select Beautician */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1F1A1C]">
                Select Qualified Specialist for this Slot & Territory:
              </label>
              <select
                value={selectedBeauticianId}
                onChange={(e) => setSelectedBeauticianId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
              >
                <option value="">-- Choose Beautician --</option>
                {beauticians.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.status !== 'available'}>
                    {b.name} ({b.phone}) · Rating {b.rating}★ · Hubs: {b.territories.join('/')} {b.status !== 'available' ? '[On Leave]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Internal Dispatch Note */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1F1A1C]">
                Dispatch Note / Instructions:
              </label>
              <input
                type="text"
                value={dispatchStatusNote}
                onChange={(e) => setDispatchStatusNote(e.target.value)}
                placeholder="e.g. Carry extra Rica Aloe cartridge, call gate security upon arrival"
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
              />
            </div>

            {/* Quick Status override */}
            <div className="pt-2 border-t border-[#F4EFEA] flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateBookingStatus(selectedBookingForDispatch.id, 'completed')}
                  className="px-2.5 py-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleUpdateBookingStatus(selectedBookingForDispatch.id, 'cancelled')}
                  className="px-2.5 py-1 text-[11px] bg-red-50 text-red-800 border border-red-200 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedBookingForDispatch(null)}
                  className="px-3 py-1.5 text-xs text-[#6B5A5C] hover:bg-gray-100 rounded"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleAssignBeautician}
                  className="px-4 py-1.5 bg-[#4A0417] text-white text-xs font-semibold rounded hover:bg-[#36020F]"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SERVICE EDIT MODAL */}
      {editingService && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8DDD3] p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD3]">
              <h4 className="font-serif text-lg font-bold text-[#1F1A1C]">
                {isNewService ? 'Add New Beauty Treatment' : 'Edit Service & Pricing'}
              </h4>
              <button onClick={() => setEditingService(null)} className="p-1 text-[#6B5A5C]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#1F1A1C] block mb-1">Service Title *</label>
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
                  <label className="font-semibold text-[#1F1A1C] block mb-1">Category</label>
                  <select
                    value={editingService.categoryId}
                    onChange={(e) => setEditingService({ ...editingService, categoryId: e.target.value })}
                    className="w-full px-2.5 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  >
                    <option value="waxing">Waxing</option>
                    <option value="facial">Facial & Cleanups</option>
                    <option value="mani-pedi">Mani-Pedi</option>
                    <option value="hair-care">Hair Care</option>
                    <option value="de-tan">De-Tan & Bleach</option>
                    <option value="massage">Massage & Spa</option>
                    <option value="threading">Threading</option>
                    <option value="bridal">Bridal</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#1F1A1C] block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingService.sellingPrice}
                    onChange={(e) => setEditingService({ ...editingService, sellingPrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1F1A1C] block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={editingService.originalPrice}
                    onChange={(e) => setEditingService({ ...editingService, originalPrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#1F1A1C] block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={editingService.durationMins}
                    onChange={(e) => setEditingService({ ...editingService, durationMins: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1F1A1C] block mb-1">Visibility on Storefront</label>
                  <select
                    value={editingService.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingService({ ...editingService, isActive: e.target.value === 'active' })}
                    className="w-full px-2.5 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#1F1A1C] block mb-1">Description</label>
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW BEAUTICIAN MODAL */}
      {isNewBeauticianModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8DDD3] p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD3]">
              <h4 className="font-serif text-lg font-bold text-[#1F1A1C]">
                Onboard Certified Beautician
              </h4>
              <button onClick={() => setIsNewBeauticianModal(false)} className="p-1 text-[#6B5A5C]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await fetch('/api/admin/beauticians', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: newBeauticianName,
                    phone: newBeauticianPhone,
                    rating: 4.95,
                    totalJobs: 0,
                    specialties: newBeauticianSpecialties.split(',').map(s => s.trim()),
                    territories: ['Delhi', 'Gurugram', 'Noida'],
                    isActive: true,
                    status: 'available',
                    experienceYears: 5
                  })
                });
                setIsNewBeauticianModal(false);
                fetchAllAdminData();
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-[#1F1A1C] block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newBeauticianName}
                  onChange={(e) => setNewBeauticianName(e.target.value)}
                  placeholder="e.g. Shalini Roy"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1F1A1C] block mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={newBeauticianPhone}
                  onChange={(e) => setNewBeauticianPhone(e.target.value)}
                  placeholder="+91 98110 00000"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1F1A1C] block mb-1">Specialties (comma-separated)</label>
                <input
                  type="text"
                  value={newBeauticianSpecialties}
                  onChange={(e) => setNewBeauticianSpecialties(e.target.value)}
                  placeholder="facial, waxing, mani-pedi"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F4EFEA]">
                <button
                  type="button"
                  onClick={() => setIsNewBeauticianModal(false)}
                  className="px-4 py-1.5 text-[#6B5A5C] hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#4A0417] text-white rounded font-semibold"
                >
                  Onboard Specialist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
