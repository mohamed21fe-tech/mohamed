import React, { useState } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  Printer,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderItem } from '../../types';
import { formatCurrency, formatOrderNumber, formatTime, getElapsedTimeMinutes } from '../../lib/formatters';
import { getProductImage } from '../../lib/foodImages';

interface KitchenViewProps {
  onOpenTicketModal: (orderId: string) => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({ onOpenTicketModal }) => {
  const {
    kitchenOrders,
    stations,
    updateOrderStatus,
    updateItemPrepStatus,
  } = useRestaurant();

  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'NEW' | 'PREPARING' | 'READY'>('ACTIVE');

  // Filter orders by status
  const filteredOrders = kitchenOrders.filter((o) => {
    if (['PAID', 'CANCELLED', 'SERVED'].includes(o.status)) return false;

    if (filterStatus === 'NEW' && o.status !== 'NEW') return false;
    if (filterStatus === 'PREPARING' && !['ACCEPTED', 'PREPARING'].includes(o.status)) return false;
    if (filterStatus === 'READY' && o.status !== 'READY') return false;

    // Station filter
    if (selectedStation !== 'ALL') {
      const hasStationItems = o.items.some((it) => it.stationId === selectedStation);
      if (!hasStationItems) return false;
    }

    return true;
  });

  const getStationItems = (order: Order): OrderItem[] => {
    if (selectedStation === 'ALL') return order.items;
    return order.items.filter((it) => it.stationId === selectedStation);
  };

  const newOrdersCount = kitchenOrders.filter((o) => o.status === 'NEW').length;
  const preparingCount = kitchenOrders.filter((o) => ['ACCEPTED', 'PREPARING'].includes(o.status)).length;
  const readyCount = kitchenOrders.filter((o) => o.status === 'READY').length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Top KDS Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>شاشة عرض المطبخ الذكية (KDS)</span>
                {newOrdersCount > 0 && (
                  <span className="text-xs font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-full animate-bounce">
                    {newOrdersCount} جديد!
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-400">
                مزامنة فورية للطلبات وتوزيعها على محطات الطهي والتحضير
              </p>
            </div>
          </div>
        </div>

        {/* Quick Status Counts Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'ACTIVE'
                ? 'bg-amber-600 text-stone-950 font-black'
                : 'bg-stone-950 text-stone-300 border border-stone-800'
            }`}
          >
            كل النشطة ({filteredOrders.length})
          </button>
          <button
            onClick={() => setFilterStatus('NEW')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'NEW'
                ? 'bg-rose-600 text-white font-black'
                : 'bg-stone-950 text-rose-400 border border-stone-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>طلبات جديدة ({newOrdersCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('PREPARING')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'PREPARING'
                ? 'bg-amber-500 text-stone-950 font-black'
                : 'bg-stone-950 text-amber-400 border border-stone-800'
            }`}
          >
            قيد الطهي ({preparingCount})
          </button>
          <button
            onClick={() => setFilterStatus('READY')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'READY'
                ? 'bg-emerald-600 text-white font-black'
                : 'bg-stone-950 text-emerald-400 border border-stone-800'
            }`}
          >
            جاهزة للتقديم ({readyCount})
          </button>
        </div>
      </div>

      {/* Station Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs font-bold">
        <button
          onClick={() => setSelectedStation('ALL')}
          className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
            selectedStation === 'ALL'
              ? 'bg-amber-600 text-stone-950 font-extrabold shadow-sm'
              : 'bg-stone-900 text-stone-300 border border-stone-800 hover:bg-stone-800'
          }`}
        >
          كافة أقسام المطبخ
        </button>
        {stations.map((st) => (
          <button
            key={st.id}
            onClick={() => setSelectedStation(st.id)}
            className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedStation === st.id
                ? 'bg-amber-600 text-stone-950 font-extrabold shadow-sm'
                : 'bg-stone-900 text-stone-300 border border-stone-800 hover:bg-stone-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{st.nameAr}</span>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="p-12 text-center bg-stone-900/40 border border-dashed border-stone-800 rounded-3xl space-y-3">
          <ChefHat className="w-12 h-12 text-stone-600 mx-auto" />
          <h3 className="text-base font-bold text-stone-300">لا توجد طلبات نشطة في هذا القسم حالياً</h3>
          <p className="text-xs text-stone-500">
            عندما يقوم الويتر بإرسال طلب جديد من هاتفه، سيظهر هنا فوراً مع تنبيه صوتي للمطبخ.
          </p>
        </div>
      )}

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => {
          const items = getStationItems(order);
          if (items.length === 0) return null;

          const elapsed = getElapsedTimeMinutes(order.createdAt);
          const isUrgent = elapsed >= 20;
          const isWarning = elapsed >= 10 && elapsed < 20;
          const isNew = order.status === 'NEW';
          const isReady = order.status === 'READY';

          return (
            <div
              key={order.id}
              className={`rounded-3xl border flex flex-col justify-between overflow-hidden transition-all shadow-xl ${
                isNew
                  ? 'bg-stone-900 border-rose-500/80 ring-2 ring-rose-500/30 animate-in fade-in'
                  : isReady
                  ? 'bg-stone-900 border-emerald-500/60'
                  : isUrgent
                  ? 'bg-stone-900 border-rose-600/60'
                  : 'bg-stone-900 border-stone-800'
              }`}
            >
              {/* Card Header */}
              <div
                className={`p-4 border-b flex items-start justify-between gap-2 ${
                  isNew
                    ? 'bg-rose-950/40 border-rose-900/60'
                    : isReady
                    ? 'bg-emerald-950/40 border-emerald-900/60'
                    : 'bg-stone-950/80 border-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xl text-amber-400">
                      {formatOrderNumber(order.orderNumber)}
                    </span>
                    <span className="font-extrabold text-base text-white">
                      طاولة {order.tableNumber}
                    </span>
                    {order.roundsCount > 1 && (
                      <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                        جولة {order.roundsCount} (تعديل)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    الويتر: <strong className="text-stone-200">{order.waiterName}</strong> •{' '}
                    {order.tableName}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-xl border ${
                      isUrgent
                        ? 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse'
                        : isWarning
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-stone-900 text-stone-300 border-stone-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsed} د</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {formatTime(order.createdAt)}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-80">
                {items.map((item) => {
                  const isItemDone = item.status === 'READY' || item.status === 'SERVED';

                  const itemImg = item.image || getProductImage(item.productId);

                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        updateItemPrepStatus(
                          order.id,
                          item.id,
                          isItemDone ? 'PREPARING' : 'READY'
                        )
                      }
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        isItemDone
                          ? 'bg-stone-950/40 border-stone-800 opacity-50 line-through'
                          : 'bg-stone-950/90 border-stone-800/80 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                              isItemDone
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : 'border-stone-700 bg-stone-900'
                            }`}
                          >
                            {isItemDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          {/* Food Photo Thumbnail for Chefs */}
                          <img
                            src={itemImg}
                            alt={item.productNameAr}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl object-cover shrink-0 border border-stone-800 bg-stone-900"
                            loading="lazy"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="font-extrabold text-sm text-stone-100 leading-snug">
                              <span className="text-amber-400 font-mono ml-1 text-base">
                                {item.quantity}×
                              </span>
                              <span>{item.productNameAr}</span>
                            </div>

                            {/* Modifiers */}
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {item.selectedModifiers.map((mod) => (
                                  <div
                                    key={mod.optionId}
                                    className="text-xs text-amber-400 font-semibold flex items-center gap-1"
                                  >
                                    <span>•</span>
                                    <span>{mod.optionNameAr}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Item Waiter Note */}
                            {item.notes && (
                              <div className="mt-1.5 text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 font-medium">
                                ملاحظة: "{item.notes}"
                              </div>
                            )}
                          </div>
                        </div>

                        {item.roundNumber && item.roundNumber > 1 && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold shrink-0">
                            جولة {item.roundNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Customer Global Notes */}
                {order.customerNotes && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300">
                    <strong>ملاحظات عامة:</strong> {order.customerNotes}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3.5 border-t border-stone-800 bg-stone-950/80 flex items-center gap-2">
                <button
                  onClick={() => onOpenTicketModal(order.id)}
                  className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-xs font-bold transition-colors shrink-0"
                  title="طباعة / معاينة تذكرة المطبخ الحرارية"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {isNew && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs transition-all shadow-md active:scale-95"
                  >
                    قبول وبدء التحضير
                  </button>
                )}

                {['ACCEPTED', 'PREPARING'].includes(order.status) && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'READY')}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>جاهز للتقديم للويتر</span>
                  </button>
                )}

                {isReady && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'SERVED')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>تم التقديم للزبون</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
