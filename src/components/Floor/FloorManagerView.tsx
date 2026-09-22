import React, { useState } from 'react';
import {
  CheckCircle2,
  Grid3X3,
  Plus,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { api } from '../../services/api';
import { RestaurantTable } from '../../types';
import { formatCurrency, formatOrderNumber } from '../../lib/formatters';

interface FloorManagerViewProps {
  onOpenTicketModal: (orderId: string) => void;
}

export const FloorManagerView: React.FC<FloorManagerViewProps> = ({ onOpenTicketModal }) => {
  const { tables, refreshAll, selectTable } = useRestaurant();
  const [isAdding, setIsAdding] = useState(false);
  const [newTable, setNewTable] = useState<Partial<RestaurantTable>>({
    number: tables.length + 1,
    nameAr: `طاولة ${tables.length + 1}`,
    nameEn: `Table ${tables.length + 1}`,
    seats: 4,
    zone: 'الصالة الرئيسية',
    status: 'AVAILABLE',
  });

  const zones = Array.from(new Set(tables.map((t) => t.zone)));
  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const occupiedCount = tables.filter((t) => t.status !== 'AVAILABLE').length;

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveTable({
        id: `tbl-${Date.now()}`,
        number: Number(newTable.number),
        nameAr: newTable.nameAr || `طاولة ${newTable.number}`,
        nameEn: newTable.nameEn || `Table ${newTable.number}`,
        seats: Number(newTable.seats) || 4,
        zone: newTable.zone || 'الصالة الرئيسية',
        status: 'AVAILABLE',
        orderAmount: 0,
        updatedAt: new Date().toISOString(),
      });
      setIsAdding(false);
      refreshAll();
    } catch (err) {
      console.error('Error adding table:', err);
    }
  };

  const handleQuickFreeTable = async (table: RestaurantTable) => {
    if (confirm(`هل تريد إخلاء طاولة ${table.number} وتحويلها إلى شاغرة؟`)) {
      await api.saveTable({
        ...table,
        status: 'AVAILABLE',
        currentOrderId: undefined,
        currentOrderNumber: undefined,
        assignedWaiterId: undefined,
        assignedWaiterName: undefined,
        orderAmount: 0,
        openedAt: undefined,
      });
      refreshAll();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Grid3X3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">إدارة مخطط صالات المطعم</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              مراقبة الطاولات الشاغرة والمشغولة وإعادة ترتيب الصالات وتوزيع المقاعد
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setNewTable({
              number: tables.length + 1,
              nameAr: `طاولة ${tables.length + 1}`,
              nameEn: `Table ${tables.length + 1}`,
              seats: 4,
              zone: 'الصالة الرئيسية',
              status: 'AVAILABLE',
            });
            setIsAdding(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>إضافة طاولة جديدة</span>
        </button>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <span className="text-stone-400 font-bold block">إجمالي الطاولات:</span>
          <span className="text-xl font-black text-white font-mono mt-1 block">
            {tables.length} طاولات
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <span className="text-stone-400 font-bold block">السعة الإجمالية:</span>
          <span className="text-xl font-black text-white font-mono mt-1 block">
            {totalSeats} مقعد
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <span className="text-stone-400 font-bold block">الطاولات المشغولة:</span>
          <span className="text-xl font-black text-amber-400 font-mono mt-1 block">
            {occupiedCount} طاولات
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <span className="text-stone-400 font-bold block">نسبة الإشغال:</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
            {tables.length > 0 ? Math.round((occupiedCount / tables.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Tables grouped by Zones */}
      <div className="space-y-6">
        {zones.map((zone) => {
          const zoneTables = tables.filter((t) => t.zone === zone);

          return (
            <div key={zone} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-extrabold text-base text-white">{zone}</h3>
                <span className="text-xs text-stone-400 font-mono">({zoneTables.length} طاولات)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {zoneTables.map((t) => {
                  const isOccupied = t.status !== 'AVAILABLE';

                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-3xl border flex flex-col justify-between ${
                        isOccupied
                          ? 'bg-stone-900 border-amber-500/40 shadow-md'
                          : 'bg-stone-900/60 border-stone-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono font-black text-2xl text-white">
                              #{t.number}
                            </span>
                            <div className="text-xs text-stone-400 mt-0.5">{t.nameAr}</div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isOccupied
                                ? 'bg-amber-950 text-amber-400 border-amber-800'
                                : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            }`}
                          >
                            {isOccupied ? 'مشغولة' : 'شاغرة'}
                          </span>
                        </div>

                        <div className="mt-3 text-xs text-stone-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{t.seats} مقاعد</span>
                        </div>

                        {isOccupied && (
                          <div className="mt-2 text-xs font-mono font-bold text-amber-400">
                            {formatCurrency(t.orderAmount)}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                        {isOccupied ? (
                          <>
                            <button
                              onClick={() => {
                                if (t.currentOrderId) onOpenTicketModal(t.currentOrderId);
                              }}
                              className="text-[11px] font-bold text-amber-400 hover:underline"
                            >
                              التذكرة
                            </button>
                            <button
                              onClick={() => handleQuickFreeTable(t)}
                              className="text-[11px] font-bold text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-900/60"
                            >
                              إخلاء الطاولة
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => selectTable(t)}
                            className="w-full py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
                          >
                            فتح طلب
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleAddTable}
            className="w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-black text-base">إضافة طاولة جديدة</h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">رقم الطاولة:</label>
                <input
                  type="number"
                  required
                  value={newTable.number}
                  onChange={(e) => setNewTable({ ...newTable, number: Number(e.target.value) })}
                  className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">اسم / وصف الطاولة بالعربي:</label>
                <input
                  type="text"
                  required
                  value={newTable.nameAr}
                  onChange={(e) => setNewTable({ ...newTable, nameAr: e.target.value })}
                  placeholder="مثال: طاولة 12 - جانب البحرة"
                  className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">عدد المقاعد:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={30}
                    value={newTable.seats}
                    onChange={(e) => setNewTable({ ...newTable, seats: Number(e.target.value) })}
                    className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">الصالة / الجناح:</label>
                  <select
                    value={newTable.zone}
                    onChange={(e) => setNewTable({ ...newTable, zone: e.target.value })}
                    className="w-full rounded-xl bg-stone-950 border border-stone-800 p-2.5 text-stone-100 font-bold"
                  >
                    <option value="أرض الديار (البحرة)">أرض الديار (البحرة)</option>
                    <option value="الصالة الرئيسية">الصالة الرئيسية</option>
                    <option value="صالة العائلات">صالة العائلات</option>
                    <option value="التراس الخارجي">التراس الخارجي</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs"
              >
                إضافة الطاولة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
