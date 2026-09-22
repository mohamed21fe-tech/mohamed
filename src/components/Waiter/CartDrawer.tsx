import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Minus,
  Plus,
  Send,
  ShoppingBag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatOrderNumber } from '../../lib/formatters';
import { getProductImage } from '../../lib/foodImages';

interface CartDrawerProps {
  onOpenTicketModal?: (orderId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenTicketModal }) => {
  const {
    cart,
    selectedTable,
    activeTableOrder,
    customerNotes,
    setCustomerNotes,
    updateCartItemQty,
    removeCartItem,
    clearCart,
    submitOrder,
    isSubmittingOrder,
    lastCreatedOrder,
    selectTable,
  } = useRestaurant();

  const [isOpen, setIsOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  if (!selectedTable) return null;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSubmit = async () => {
    if (cart.length === 0 || isSubmittingOrder) return;
    const order = await submitOrder();
    if (order) {
      setConfirmedOrder(order);
      setShowSuccessModal(true);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Bottom Bar (visible when items in cart and drawer closed) */}
      {totalItemsCount > 0 && !isOpen && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-3 sm:p-4 bg-gradient-to-t from-stone-950 via-stone-950/95 to-transparent">
          <div className="max-w-3xl mx-auto bg-stone-900 border border-amber-500/40 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-3 text-right"
            >
              <div className="relative w-11 h-11 rounded-xl bg-amber-600 flex items-center justify-center text-stone-950 font-black shadow-md">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-stone-900">
                  {totalItemsCount}
                </span>
              </div>
              <div>
                <div className="font-extrabold text-sm text-stone-100 flex items-center gap-1.5">
                  <span>طاولة {selectedTable.number}</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {activeTableOrder ? `جولة ${activeTableOrder.roundsCount + 1}` : 'طلب جديد'}
                  </span>
                </div>
                <div className="text-xs font-black text-amber-400 font-mono">
                  {formatCurrency(cartSubtotal)}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(true)}
                className="px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-all flex items-center gap-1"
              >
                <span>مراجعة</span>
                <ChevronUp className="w-4 h-4" />
              </button>

              <button
                id="quick-send-kitchen-btn"
                onClick={handleSubmit}
                disabled={isSubmittingOrder}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmittingOrder ? 'جارِ الإرسال...' : 'إرسال للمطبخ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Full Cart Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="w-full sm:max-w-xl bg-stone-900 border border-stone-800 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-stone-100">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>مراجعة طلب طاولة {selectedTable.number}</span>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      {activeTableOrder ? `جولة ${activeTableOrder.roundsCount + 1}` : 'طلب جديد'}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {selectedTable.nameAr} • {selectedTable.seats} مقاعد
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearCart}
                  className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="تفريغ السلة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Existing table order warning if round 2 */}
            {activeTableOrder && (
              <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  هذه الطاولة لديها طلب نشط برقم <strong>{formatOrderNumber(activeTableOrder.orderNumber)}</strong>. سيتم إرسال هذه الأصناف كجولة إضافية إلى المطبخ.
                </span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item, idx) => {
                const itemImg = item.image || getProductImage(item.productId);
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {/* Dish Photo */}
                        <img
                          src={itemImg}
                          alt={item.productNameAr}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-800 bg-stone-900"
                          loading="lazy"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-stone-100 truncate">
                              {item.productNameAr}
                            </span>
                          </div>

                          {/* Modifiers */}
                          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.selectedModifiers.map((mod) => (
                                <div key={mod.optionId} className="text-xs text-amber-400/90 flex items-center gap-1">
                                  <span>•</span>
                                  <span>{mod.optionNameAr}</span>
                                  {mod.priceDelta > 0 && (
                                    <span className="text-[10px] text-stone-400 font-mono">
                                      (+{formatCurrency(mod.priceDelta)})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Waiter Item Notes */}
                          {item.notes && (
                            <div className="mt-1.5 text-xs text-stone-300 bg-stone-900/80 p-1.5 rounded-lg border border-stone-800">
                              ملاحظة: "{item.notes}"
                            </div>
                          )}

                          <div className="mt-1.5 text-xs font-mono font-bold text-stone-400">
                            {formatCurrency(item.unitPrice)} × {item.quantity} ={' '}
                            <span className="text-amber-400 font-extrabold">{formatCurrency(item.totalPrice)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stepper & Delete */}
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => removeCartItem(idx)}
                          className="text-stone-500 hover:text-rose-400 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl p-0.5">
                          <button
                            onClick={() => updateCartItemQty(idx, -1)}
                            className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-amber-400">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQty(idx, 1)}
                            className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Customer Notes */}
              <div className="mt-4 pt-2">
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  ملاحظات عامة على الطلب (تظهر بالتذكرة):
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="مثال: الزبون مستعجل، طاولة عيد ميلاد..."
                  className="w-full rounded-xl bg-stone-950 border border-stone-800 p-3 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-950/95 space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-400 font-bold">
                <span>إجمالي الأصناف:</span>
                <span className="font-mono text-stone-200">{totalItemsCount} أصناف</span>
              </div>

              <div className="flex items-center justify-between text-sm sm:text-base font-extrabold text-white border-t border-stone-800/80 pt-2">
                <span>المبلغ الإجمالي (ل.س):</span>
                <span className="text-amber-400 font-mono font-black text-lg">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>

              <button
                id="submit-order-to-kitchen-btn"
                onClick={handleSubmit}
                disabled={isSubmittingOrder}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm sm:text-base transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <Send className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {isSubmittingOrder
                    ? 'جارِ الإرسال للمطبخ وطباعة التذاكر...'
                    : 'تأكيد وإرسال للمطبخ (SEND TO KITCHEN)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {showSuccessModal && confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-emerald-500/40 p-6 shadow-2xl text-center text-stone-100">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h3 className="text-xl font-black text-white">تم إرسال الطلب للمطبخ بنجاح!</h3>

            <div className="mt-4 p-3.5 rounded-2xl bg-stone-950 border border-stone-800 text-sm space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-xs">رقم الطلب:</span>
                <span className="font-mono font-black text-amber-400 text-base">
                  {formatOrderNumber(confirmedOrder.orderNumber)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-xs">الطاولة:</span>
                <span className="font-bold text-stone-200">
                  طاولة {confirmedOrder.tableNumber} ({confirmedOrder.tableName})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-xs">عدد الأصناف:</span>
                <span className="font-bold text-stone-200">{confirmedOrder.items.length} أصناف</span>
              </div>
              <div className="flex justify-between items-center border-t border-stone-800 pt-1.5">
                <span className="text-stone-400 text-xs">الإجمالي:</span>
                <span className="font-mono font-black text-emerald-400">
                  {formatCurrency(confirmedOrder.total)}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone-400">
              تم إرسال الطلب لشاشات المطبخ وجارِ طباعة تذكرة التحضير الحرارية.
            </p>

            <div className="mt-6 space-y-2">
              {onOpenTicketModal && (
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    onOpenTicketModal(confirmedOrder.id);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>معاينة وطباعة تذكرة المطبخ</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  selectTable(null); // Back to floor tables
                }}
                className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-sm transition-colors"
              >
                العودة إلى مخطط الطاولات
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
