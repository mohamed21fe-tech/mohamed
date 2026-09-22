import React, { useState } from 'react';
import { ArrowRightLeft, Merge, X } from 'lucide-react';
import { RestaurantTable } from '../../types';
import { api } from '../../services/api';

interface TransferMergeModalProps {
  mode: 'transfer' | 'merge';
  sourceTable: RestaurantTable;
  allTables: RestaurantTable[];
  waiterName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferMergeModal: React.FC<TransferMergeModalProps> = ({
  mode,
  sourceTable,
  allTables,
  waiterName,
  onClose,
  onSuccess,
}) => {
  const [targetTableId, setTargetTableId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Transfer requires available target table; Merge requires occupied target table
  const candidates = allTables.filter((t) => {
    if (t.id === sourceTable.id) return false;
    if (mode === 'transfer') {
      return t.status === 'AVAILABLE';
    } else {
      return t.status !== 'AVAILABLE' && t.currentOrderId;
    }
  });

  const handleSubmit = async () => {
    if (!targetTableId) {
      setError('الرجاء اختيار الطاولة الهدف');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (mode === 'transfer') {
        const res = await api.transferTable(sourceTable.id, targetTableId, waiterName);
        if (res.success) {
          onSuccess();
          onClose();
        }
      } else {
        const res = await api.mergeTables(sourceTable.id, targetTableId, waiterName);
        if (res.success) {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'فشلت العملية');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-100">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            {mode === 'transfer' ? (
              <ArrowRightLeft className="w-5 h-5 text-amber-500" />
            ) : (
              <Merge className="w-5 h-5 text-amber-500" />
            )}
            <h3 className="font-extrabold text-base">
              {mode === 'transfer'
                ? `نقل طاولة ${sourceTable.number}`
                : `دمج طاولة ${sourceTable.number}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <p className="text-stone-300 leading-relaxed">
            {mode === 'transfer'
              ? `سيتم نقل كافة طلبات وأصناف طاولة ${sourceTable.number} إلى طاولة شاغرة أخرى في الصالة:`
              : `سيتم دمج طلب طاولة ${sourceTable.number} في طلب طاولة أخرى مشغولة وتوحيد الحساب:`}
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-stone-400 font-bold mb-1.5">اختر الطاولة الهدف:</label>
            {candidates.length === 0 ? (
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-500 text-center">
                {mode === 'transfer'
                  ? 'لا توجد طاولات شاغرة ومتاحة حالياً للنقل إليها.'
                  : 'لا توجد طاولات أخرى تحتوي على طلبات نشطة للدمج معها.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {candidates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTargetTableId(t.id)}
                    className={`p-3 rounded-xl border text-right transition-all font-bold ${
                      targetTableId === t.id
                        ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="text-sm">طاولة {t.number}</div>
                    <div className="text-[10px] text-stone-400">
                      {t.zone} • {t.seats} مقاعد
                    </div>
                    {t.currentOrderNumber && (
                      <div className="text-[10px] text-amber-500 mt-1">طلب #{t.currentOrderNumber}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs font-bold"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !targetTableId}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs transition-all disabled:opacity-50"
          >
            {isLoading ? 'جارِ المعالجة...' : 'تأكيد التنفيذ'}
          </button>
        </div>
      </div>
    </div>
  );
};
