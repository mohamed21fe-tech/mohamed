import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  HardDrive,
  Plus,
  Printer as PrinterIcon,
  RefreshCw,
  Send,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { api } from '../../services/api';
import { Printer } from '../../types';

export const PrinterManagerView: React.FC = () => {
  const { printers, stations, settings, refreshAll } = useRestaurant();

  const [isEditing, setIsEditing] = useState<Printer | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { loading: boolean; success?: boolean; message?: string }>>({});

  const [formData, setFormData] = useState<Partial<Printer>>({
    name: '',
    type: 'NETWORK',
    ip: '192.168.1.120',
    port: 9100,
    paperWidth: '80mm',
    stationId: 'ALL',
    isActive: true,
  });

  const handleTestPrinter = async (printerId: string) => {
    setTestResults((prev) => ({ ...prev, [printerId]: { loading: true } }));
    try {
      const res = await api.testNetworkPrinter(printerId);
      setTestResults((prev) => ({
        ...prev,
        [printerId]: { loading: false, success: res.success, message: res.message },
      }));
      refreshAll();
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [printerId]: { loading: false, success: false, message: err.message || 'فشل الاتصال' },
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ip) return;

    try {
      await api.savePrinter({
        id: isEditing ? isEditing.id : `prn-${Date.now()}`,
        ...formData,
      } as Printer);
      setIsAdding(false);
      setIsEditing(null);
      refreshAll();
    } catch (err) {
      console.error('Error saving printer:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الطابعة؟')) {
      await api.deletePrinter(id);
      refreshAll();
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      type: 'NETWORK',
      ip: '192.168.1.120',
      port: 9100,
      paperWidth: '80mm',
      stationId: 'ALL',
      isActive: true,
    });
    setIsAdding(true);
  };

  const openEditModal = (p: Printer) => {
    setIsEditing(p);
    setFormData(p);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <PrinterIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">إدارة الطابعات الحرارية وتذاكر المطبخ</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              تهيئة طابعات شبكة المطعم (ESC/POS عبر منفذ 9100) وتوزيع تذاكر الأقسام
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>إضافة طابعة جديدة</span>
        </button>
      </div>

      {/* Auto-Print Settings Card */}
      <div className="p-4 rounded-3xl bg-stone-900/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-extrabold text-white text-sm">
            الطباعة التلقائية عند تأكيد الطلب (Auto-Print)
          </h3>
          <p className="text-stone-400 mt-0.5">
            عند إرسال الويتر للطلب، يتم توجيه التذكرة فوراً إلى طابعة القسم المخصصة عبر الشبكة المحلية
          </p>
        </div>

        <button
          onClick={async () => {
            if (settings) {
              await api.updateSettings({ autoPrintOnSubmit: !settings.autoPrintOnSubmit });
              refreshAll();
            }
          }}
          className={`px-4 py-2 rounded-xl font-bold transition-all text-xs border ${
            settings?.autoPrintOnSubmit
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-stone-800 text-stone-400 border-stone-700'
          }`}
        >
          {settings?.autoPrintOnSubmit ? 'مفعلة تلقائياً ✓' : 'معطلة (طباعة يدوية فقط)'}
        </button>
      </div>

      {/* Printers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {printers.map((printer) => {
          const testState = testResults[printer.id];
          const station = stations.find((s) => s.id === printer.stationId);

          return (
            <div
              key={printer.id}
              className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center text-amber-400 font-bold">
                      <PrinterIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white">{printer.name}</h3>
                      <div className="text-xs font-mono text-stone-400 mt-0.5">
                        {printer.ip}:{printer.port}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      printer.lastStatus === 'ONLINE'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : printer.lastStatus === 'ERROR'
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : 'bg-stone-800 text-stone-400 border-stone-700'
                    }`}
                  >
                    {printer.lastStatus === 'ONLINE' ? (
                      <Wifi className="w-3 h-3" />
                    ) : (
                      <WifiOff className="w-3 h-3" />
                    )}
                    <span>{printer.lastStatus || 'غير مختبرة'}</span>
                  </span>
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-400">القسم المستهدف:</span>
                    <span className="font-bold text-amber-400">
                      {printer.stationId === 'ALL'
                        ? 'كافة أقسام المطبخ'
                        : station?.nameAr || printer.stationId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">عرض بكرة الورق:</span>
                    <span className="font-bold text-stone-200">{printer.paperWidth}</span>
                  </div>
                  {printer.lastPrintedAt && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">آخر طباعة:</span>
                      <span className="text-stone-300 font-mono text-[11px]">
                        {new Date(printer.lastPrintedAt).toLocaleTimeString('ar-SY')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Test Feedback */}
                {testState && (
                  <div
                    className={`mt-3 p-2.5 rounded-xl border text-xs leading-relaxed ${
                      testState.success
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-800 text-rose-300'
                    }`}
                  >
                    {testState.loading ? (
                      <div className="flex items-center gap-2 text-amber-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جارِ الاتصال بالطابعة وإرسال صفحة الاختبار...</span>
                      </div>
                    ) : (
                      testState.message
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTestPrinter(printer.id)}
                  disabled={testState?.loading}
                  className="flex-1 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>اختبار الطباعة</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(printer)}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(printer.id)}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-400"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Printer Modal */}
      {(isAdding || isEditing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-black text-base">
                {isEditing ? 'تعديل بيانات الطابعة' : 'إضافة طابعة حرارية جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(null);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">اسم الطابعة:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: طابعة المشاوي والفحم"
                  className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">عنوان IP الطابعة:</label>
                  <input
                    type="text"
                    required
                    value={formData.ip}
                    onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                    placeholder="192.168.1.120"
                    className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-bold mb-1">المنفذ (Port):</label>
                  <input
                    type="number"
                    required
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                    placeholder="9100"
                    className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">عرض الورق:</label>
                  <select
                    value={formData.paperWidth}
                    onChange={(e) =>
                      setFormData({ ...formData, paperWidth: e.target.value as '58mm' | '80mm' })
                    }
                    className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100 font-bold"
                  >
                    <option value="80mm">80 مم (قياسي)</option>
                    <option value="58mm">58 مم (صغير)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">القسم المرتبط:</label>
                  <select
                    value={formData.stationId}
                    onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                    className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100 font-bold"
                  >
                    <option value="ALL">كافة أقسام المطبخ</option>
                    {stations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(null);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs"
              >
                حفظ بيانات الطابعة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
