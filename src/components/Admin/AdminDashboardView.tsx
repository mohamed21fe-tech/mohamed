import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  LayoutDashboard,
  Printer,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Order, OrderEvent, OrderStatus, RestaurantSettings } from '../../types';
import {
  formatCurrency,
  formatDateTime,
  formatOrderNumber,
  formatTime,
} from '../../lib/formatters';

interface AdminDashboardViewProps {
  onOpenTicketModal: (orderId: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onOpenTicketModal }) => {
  const { user } = useAuth();
  const { settings, refreshAll } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'kpi' | 'orders' | 'reports' | 'settings'>('kpi');
  const [reportsData, setReportsData] = useState<any>(null);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<OrderEvent[]>([]);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<RestaurantSettings>(
    settings || {
      restaurantNameAr: 'مطعم بيتنا الشامي',
      restaurantNameEn: 'Baitna Al-Shami Restaurant',
      phone: '+963-11-2233445',
      addressAr: 'دمشق القديمة - باب توما - جانب القوس الأثري',
      addressEn: 'Old Damascus - Bab Touma',
      currency: 'SYP',
      currencySymbol: 'ل.س',
      taxPercentage: 0,
      enableKitchenSound: true,
      autoPrintOnSubmit: true,
      serverLocalIp: '192.168.1.100',
      serverPort: 3000,
      primaryLanguage: 'ar',
    }
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rData, oList] = await Promise.all([
        api.getReports(),
        api.getOrders(),
      ]);
      setReportsData(rData);
      setOrdersList(oList);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenTimeline = async (order: Order) => {
    setTimelineOrder(order);
    try {
      const events = await api.getOrderEvents(order.id);
      setTimelineEvents(events);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModalOrder || !cancelReason.trim()) return;
    try {
      await api.cancelOrder(
        cancelModalOrder.id,
        cancelReason,
        user?.name || 'المدير',
        user?.role || 'MANAGER'
      );
      setCancelModalOrder(null);
      setCancelReason('');
      loadData();
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء الطلب');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settingsForm);
      alert('تم حفظ إعدادات المطعم بنجاح');
      refreshAll();
    } catch (err) {
      console.error('Save settings error:', err);
    }
  };

  const handleExportBackup = async () => {
    const backup = await api.exportBackup();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `baitna-alshami-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (confirm('هل أنت متأكد من استعادة النسخة الاحتياطية واستبدال البيانات الحالية؟')) {
        const res = await api.restoreBackup(parsed);
        if (res.success) {
          alert('تمت استعادة البيانات بنجاح!');
          loadData();
          refreshAll();
        }
      }
    } catch {
      alert('ملف النسخة الاحتياطية غير صالح');
    }
  };

  const filteredOrders = ordersList.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber.toString().includes(q) ||
        o.tableName.toLowerCase().includes(q) ||
        o.waiterName.toLowerCase().includes(q) ||
        o.items.some((it) => it.productNameAr.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Admin Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">لوحة الإدارة والتحليلات الشاملة</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              متابعة مبيعات اليوم، سجل الفواتير، التقارير المالية، والنسخ الاحتياطي
            </p>
          </div>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-stone-950 p-1 border border-stone-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('kpi')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'kpi'
                ? 'bg-amber-600 text-stone-950 font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            المؤشرات المالية
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-600 text-stone-950 font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            سجل الفواتير
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'reports'
                ? 'bg-amber-600 text-stone-950 font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            الأطباق والتقارير
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-600 text-stone-950 font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            الإعدادات والنسخ
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB 1: KPI & EXECUTIVE OVERVIEW
          ========================================== */}
      {activeTab === 'kpi' && reportsData && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 shadow-lg">
              <span className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>إجمالي مبيعات اليوم (المسددة):</span>
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
                {formatCurrency(reportsData.totalSales)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                من إجمالي {reportsData.paidOrdersCount} طلب مسدد ومغلق
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 shadow-lg">
              <span className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>الطلبات النشطة بالمطبخ والصالة:</span>
              </span>
              <div className="text-2xl font-black text-amber-400 font-mono mt-2">
                {reportsData.activeOrdersCount} طلبات
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                على {reportsData.openTablesCount} طاولة مفتوحة
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 shadow-lg">
              <span className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-sky-400" />
                <span>متوسط قيمة الفاتورة (ل.س):</span>
              </span>
              <div className="text-2xl font-black text-sky-400 font-mono mt-2">
                {formatCurrency(reportsData.avgOrderValue)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">متوسط استهلاك الطاولة</span>
            </div>

            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 shadow-lg">
              <span className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>إشغال صالات المطعم:</span>
              </span>
              <div className="text-2xl font-black text-indigo-400 font-mono mt-2">
                {reportsData.openTablesCount} / {reportsData.totalTablesCount}
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                نسبة إشغال {Math.round((reportsData.openTablesCount / reportsData.totalTablesCount) * 100)}%
              </span>
            </div>
          </div>

          {/* Waiter Performance & Popular Dishes Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Waiter */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-500" />
                <span>أداء كادر الويترية والمبيعات</span>
              </h3>

              <div className="space-y-3">
                {reportsData.salesByWaiter.map((w: any) => (
                  <div
                    key={w.name}
                    className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-stone-100">{w.name}</div>
                      <div className="text-xs text-stone-400 font-mono mt-0.5">
                        {w.count} طلبات مسددة
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-mono font-black text-amber-400 text-sm">
                        {formatCurrency(w.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Dishes */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-500" />
                <span>أكثر الأطباق الشامية مبيعاً اليوم</span>
              </h3>

              <div className="space-y-2.5">
                {reportsData.popularProducts.slice(0, 5).map((p: any, idx: number) => (
                  <div
                    key={p.nameAr}
                    className="p-3 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-stone-800 text-amber-400 font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-stone-200">{p.nameAr}</div>
                        <div className="text-stone-400 font-mono mt-0.5">{p.qty} وجبة</div>
                      </div>
                    </div>
                    <div className="font-mono font-black text-emerald-400">
                      {formatCurrency(p.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: ORDERS MANAGEMENT & AUDIT LOGS
          ========================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-stone-900/60 p-4 rounded-3xl border border-stone-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الطلب، اسم الطاولة، الويتر، أو الصنف..."
                className="w-full rounded-2xl bg-stone-950 border border-stone-800 pr-9 pl-4 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl bg-stone-950 border border-stone-800 px-3 py-2 text-xs text-stone-200 font-bold focus:outline-hidden focus:border-amber-500"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="NEW">جديد (NEW)</option>
                <option value="PREPARING">قيد التحضير (PREPARING)</option>
                <option value="READY">جاهز للتقديم (READY)</option>
                <option value="SERVED">تم التقديم (SERVED)</option>
                <option value="PAID">مسدد ومغلق (PAID)</option>
                <option value="CANCELLED">ملغي (CANCELLED)</option>
              </select>

              <button
                onClick={loadData}
                className="p-2 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300"
                title="تحديث القائمة"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-stone-950/80 border-b border-stone-800 text-stone-400 font-bold">
                  <tr>
                    <th className="p-3.5">رقم الطلب</th>
                    <th className="p-3.5">الوقت</th>
                    <th className="p-3.5">الطاولة</th>
                    <th className="p-3.5">الويتر</th>
                    <th className="p-3.5">الأصناف</th>
                    <th className="p-3.5">المبلغ</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-black text-amber-400 text-sm">
                        {formatOrderNumber(order.orderNumber)}
                      </td>
                      <td className="p-3.5 text-stone-400 font-mono text-[11px]">
                        {formatTime(order.createdAt)}
                      </td>
                      <td className="p-3.5 font-bold text-stone-200">
                        طاولة {order.tableNumber} ({order.tableName})
                      </td>
                      <td className="p-3.5 text-stone-300">{order.waiterName}</td>
                      <td className="p-3.5 text-stone-400">
                        {order.items.length} أصناف (جولة {order.roundsCount})
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            order.status === 'PAID'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : order.status === 'CANCELLED'
                              ? 'bg-rose-950 text-rose-400 border-rose-800'
                              : order.status === 'READY'
                              ? 'bg-indigo-950 text-indigo-400 border-indigo-800'
                              : 'bg-amber-950 text-amber-400 border-amber-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenTicketModal(order.id)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                            title="معاينة وطباعة التذكرة"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenTimeline(order)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400"
                            title="سجل أحداث الطلب (Timeline)"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {order.status !== 'PAID' && order.status !== 'CANCELLED' && (
                            <button
                              onClick={() => {
                                setCancelModalOrder(order);
                                setCancelReason('');
                              }}
                              className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border border-rose-900/60"
                              title="إلغاء الطلب (للمدير فقط)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: REPORTS & CSV EXPORT
          ========================================== */}
      {activeTab === 'reports' && reportsData && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>تصدير التقارير وسجلات المبيعات إلى Excel (CSV)</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                تنزيل ملف بصيغة CSV يدعم اللغة العربية والأرقام الشامية للتحليل المحاسبي
              </p>
            </div>

            <a
              href="/api/reports/export-csv"
              download
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-md"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>تنزيل التقرير المالي الكامل (.CSV)</span>
            </a>
          </div>

          {/* Detailed popular products table */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="font-extrabold text-base text-white">تفاصيل مبيعات المأكولات والمشروبات</h3>
            <div className="space-y-2">
              {reportsData.popularProducts.map((p: any, idx: number) => (
                <div
                  key={p.nameAr}
                  className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-stone-500 font-bold">#{idx + 1}</span>
                    <div>
                      <div className="font-bold text-stone-100">{p.nameAr}</div>
                      {p.nameEn && <div className="text-[11px] text-stone-500">{p.nameEn}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-left font-mono">
                      <span className="text-stone-400 text-[11px] block">الكمية المباعة:</span>
                      <span className="font-black text-stone-200">{p.qty}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-stone-400 text-[11px] block">إجمالي الإيراد:</span>
                      <span className="font-black text-amber-400">{formatCurrency(p.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: RESTAURANT SETTINGS & BACKUP
          ========================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="pb-4 border-b border-stone-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-base text-white">إعدادات مطعم بيتنا الشامي</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">اسم المطعم بالعربي:</label>
                <input
                  type="text"
                  value={settingsForm.restaurantNameAr}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, restaurantNameAr: e.target.value })
                  }
                  className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">اسم المطعم بالإنكليزي:</label>
                <input
                  type="text"
                  value={settingsForm.restaurantNameEn}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, restaurantNameEn: e.target.value })
                  }
                  className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">الهاتف ومكتب الحجز:</label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">العنوان في دمشق:</label>
                <input
                  type="text"
                  value={settingsForm.addressAr}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, addressAr: e.target.value })
                  }
                  className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs transition-all"
              >
                حفظ التعديلات
              </button>
            </div>
          </form>

          {/* Backup & Disaster Recovery Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-black text-base text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-500" />
              <span>النسخ الاحتياطي المحلي واستعادة النظام (Offline-First Local DB)</span>
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              يتم تخزين كافة البيانات محلياً داخل المطعم لضمان عدم توقف الخدمة حتى في حال انقطاع الإنترنت الخارجي في دمشق. يمكنك تصدير نسخة كاملة أو استعادتها في أي وقت.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>تصدير نسخة احتياطية كاملة (.JSON)</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>استعادة نسخة احتياطية من ملف</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Order Event Timeline Modal */}
      {timelineOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base">
                  سجل أحداث الطلب #{timelineOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setTimelineOrder(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {timelineEvents.map((evt, idx) => (
                <div key={evt.id || idx} className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 p-3 rounded-2xl bg-stone-950 border border-stone-800/80">
                    <div className="flex justify-between items-center text-stone-400 font-mono text-[10px] mb-1">
                      <span>{evt.eventType}</span>
                      <span>{formatDateTime(evt.timestamp)}</span>
                    </div>
                    <p className="font-bold text-stone-200">{evt.descriptionAr}</p>
                    <div className="text-[11px] text-amber-500 mt-1">بواسطة: {evt.userName}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setTimelineOrder(null)}
              className="mt-2 w-full py-2.5 rounded-xl bg-stone-800 text-stone-200 text-xs font-bold hover:bg-stone-700"
            >
              إغلاق السجل
            </button>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-rose-500/50 p-6 shadow-2xl text-stone-100 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-black text-base">إلغاء الطلب #{cancelModalOrder.orderNumber}</h3>
            </div>

            <p className="text-xs text-stone-400">
              هل أنت متأكد من إلغاء هذا الطلب؟ تتطلب هذه العملية إدخال سبب الإلغاء للتدقيق الرقابي:
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">سبب الإلغاء:</label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="مثال: اعتذار الزبون عن الحضور، خطأ في اختيار الطاولة..."
                className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-xs text-stone-100 placeholder-stone-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                تراجع
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black disabled:opacity-50"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
