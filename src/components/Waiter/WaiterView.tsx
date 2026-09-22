import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRightLeft,
  Check,
  Clock,
  Flame,
  History,
  Layers,
  Merge,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';
import { Product, RestaurantTable, TableStatus } from '../../types';
import { formatCurrency, formatOrderNumber, getElapsedTimeMinutes } from '../../lib/formatters';
import { getProductImage } from '../../lib/foodImages';
import { ProductModifierModal } from './ProductModifierModal';
import { CartDrawer } from './CartDrawer';
import { TransferMergeModal } from './TransferMergeModal';

interface WaiterViewProps {
  onOpenTicketModal: (orderId: string) => void;
}

export const WaiterView: React.FC<WaiterViewProps> = ({ onOpenTicketModal }) => {
  const { user } = useAuth();
  const {
    tables,
    categories,
    products,
    selectedTable,
    activeTableOrder,
    selectTable,
    addItemToCart,
    refreshAll,
  } = useRestaurant();

  // Floor Tables Filter
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [tableSearch, setTableSearch] = useState('');

  // Menu Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState('');

  // Modals
  const [activeProductForModifier, setActiveProductForModifier] = useState<Product | null>(null);
  const [transferMergeState, setTransferMergeState] = useState<{
    mode: 'transfer' | 'merge';
    table: RestaurantTable;
  } | null>(null);
  const [showOrderRoundsHistory, setShowOrderRoundsHistory] = useState(false);

  // Available zones from tables
  const zones = Array.from(new Set(tables.map((t) => t.zone)));

  const filteredTables = tables.filter((t) => {
    if (selectedZone !== 'ALL' && t.zone !== selectedZone) return false;
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      return (
        t.number.toString().includes(q) ||
        t.nameAr.toLowerCase().includes(q) ||
        t.zone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      return (
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return { text: 'متاحة للجلوس', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' };
      case 'ORDERING':
        return { text: 'يتم الطلب', bg: 'bg-sky-950/60 text-sky-400 border-sky-800/80' };
      case 'PREPARING':
        return { text: 'قيد التحضير بالمطبخ', bg: 'bg-amber-950/60 text-amber-400 border-amber-800/80' };
      case 'READY':
        return { text: 'جاهز للتقديم للزبون', bg: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80' };
      case 'OCCUPIED':
        return { text: 'مشغولة - بانتظار الحساب', bg: 'bg-stone-800 text-stone-300 border-stone-700' };
      case 'BILL_REQUESTED':
        return { text: 'طلب الفاتورة والحساب', bg: 'bg-rose-950/60 text-rose-400 border-rose-800/80' };
      default:
        return { text: status, bg: 'bg-stone-800 text-stone-300 border-stone-700' };
    }
  };

  const handleProductClick = (product: Product) => {
    if (!product.isAvailable) return;

    // If product has modifiers, open the modifier customization modal
    if (product.modifiers && product.modifiers.length > 0) {
      setActiveProductForModifier(product);
    } else {
      // Direct add to cart
      addItemToCart(product, [], undefined, 1);
    }
  };

  // ==========================================
  // VIEW 1: FLOOR TABLES SELECTION
  // ==========================================
  if (!selectedTable) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
        {/* Top greeting & search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 border border-stone-800 p-4 rounded-3xl">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>مخطط الطاولات ونظام الويتر</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              مرحباً <strong className="text-amber-400">{user?.name}</strong> • اختر الطاولة لبدء فتح طلب جديد أو إضافة جولة
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="بحث برقم الطاولة أو الصالة..."
              className="w-full rounded-2xl bg-stone-950 border border-stone-800 pr-9 pl-4 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>
        </div>

        {/* Zones and Status Pills */}
        <div className="space-y-2">
          {/* Zones */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedZone('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedZone === 'ALL'
                  ? 'bg-amber-600 text-stone-950 font-black'
                  : 'bg-stone-900 text-stone-300 border border-stone-800 hover:bg-stone-800'
              }`}
            >
              جميع الصالات ({tables.length})
            </button>
            {zones.map((zone) => {
              const count = tables.filter((t) => t.zone === zone).length;
              return (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedZone === zone
                      ? 'bg-amber-600 text-stone-950 font-black'
                      : 'bg-stone-900 text-stone-300 border border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  {zone} ({count})
                </button>
              );
            })}
          </div>

          {/* Statuses */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-[11px] font-bold">
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'AVAILABLE', label: 'شاغرة (متاحة)' },
              { id: 'PREPARING', label: 'قيد التحضير' },
              { id: 'READY', label: 'جاهزة للتقديم' },
              { id: 'OCCUPIED', label: 'مشغولة' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                  selectedStatus === st.id
                    ? 'bg-stone-700 text-white font-black'
                    : 'bg-stone-950 text-stone-400 border border-stone-800 hover:bg-stone-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredTables.map((table) => {
            const badge = getStatusBadge(table.status);
            const isOccupied = table.status !== 'AVAILABLE';
            const elapsed = getElapsedTimeMinutes(table.openedAt);

            return (
              <div
                key={table.id}
                className={`relative rounded-3xl p-4 transition-all border flex flex-col justify-between ${
                  table.status === 'AVAILABLE'
                    ? 'bg-stone-900/60 border-stone-800 hover:border-emerald-500/50 hover:bg-stone-900 shadow-sm'
                    : table.status === 'READY'
                    ? 'bg-indigo-950/20 border-indigo-500/50 shadow-md shadow-indigo-950/30'
                    : 'bg-stone-900 border-amber-500/30 shadow-md'
                }`}
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-2xl text-white">
                          #{table.number}
                        </span>
                        <span className="text-[11px] font-bold text-stone-400">
                          {table.nameAr}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                        <span>{table.zone}</span>
                        <span>•</span>
                        <Users className="w-3 h-3 text-stone-400 inline" />
                        <span>{table.seats} مقاعد</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.bg}`}
                    >
                      {badge.text}
                    </span>
                  </div>

                  {/* Occupied Details */}
                  {isOccupied && (
                    <div className="mt-3 p-2.5 rounded-2xl bg-stone-950/80 border border-stone-800/80 space-y-1 text-xs">
                      {table.currentOrderNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400 text-[11px]">طلب نشط:</span>
                          <span className="font-mono font-black text-amber-400">
                            {formatOrderNumber(table.currentOrderNumber)}
                          </span>
                        </div>
                      )}

                      {table.assignedWaiterName && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400 text-[11px]">الويتر:</span>
                          <span className="font-bold text-stone-200">
                            {table.assignedWaiterName}
                          </span>
                        </div>
                      )}

                      {table.orderAmount > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-stone-800">
                          <span className="text-stone-400 text-[11px]">المبلغ:</span>
                          <span className="font-mono font-black text-emerald-400">
                            {formatCurrency(table.orderAmount)}
                          </span>
                        </div>
                      )}

                      {table.openedAt && (
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 pt-0.5">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>منذ {elapsed} دقيقة</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-2">
                  <button
                    onClick={() => selectTable(table)}
                    className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
                      table.status === 'AVAILABLE'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{table.status === 'AVAILABLE' ? 'فتح طاولة' : 'إضافة أصناف'}</span>
                  </button>

                  {/* Transfer / Merge buttons if occupied */}
                  {isOccupied && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTransferMergeState({ mode: 'transfer', table })}
                        title="نقل الطاولة لطاولة شاغرة"
                        className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/60"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTransferMergeState({ mode: 'merge', table })}
                        title="دمج مع طاولة مشغولة أخرى"
                        className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/60"
                      >
                        <Merge className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Transfer / Merge Modal */}
        {transferMergeState && (
          <TransferMergeModal
            mode={transferMergeState.mode}
            sourceTable={transferMergeState.table}
            allTables={tables}
            waiterName={user?.name || 'الويتر'}
            onClose={() => setTransferMergeState(null)}
            onSuccess={refreshAll}
          />
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: SELECTED TABLE MENU & ORDER TAKING
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-32 space-y-4">
      {/* Sticky Table Header */}
      <div className="sticky top-20 z-20 bg-stone-950/95 backdrop-blur-md border border-stone-800 rounded-3xl p-3.5 sm:p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => selectTable(null)}
            className="p-2.5 rounded-2xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition-colors flex items-center justify-center shrink-0"
            title="العودة لمخطط الطاولات"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                طاولة {selectedTable.number}
              </h2>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/20">
                {selectedTable.zone}
              </span>
              <span className="text-xs text-stone-400">({selectedTable.seats} مقاعد)</span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              الويتر الحالي: <strong className="text-stone-200">{user?.name}</strong>
              {activeTableOrder && (
                <span className="mr-2 text-amber-400 font-bold">
                  • طلب نشط {formatOrderNumber(activeTableOrder.orderNumber)} (جولة {activeTableOrder.roundsCount})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons on table */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {activeTableOrder && (
            <button
              onClick={() => setShowOrderRoundsHistory(true)}
              className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>جولات الطلب ({activeTableOrder.roundsCount})</span>
            </button>
          )}

          <button
            onClick={() => selectTable(null)}
            className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 text-xs font-bold transition-colors"
          >
            تغيير الطاولة
          </button>
        </div>
      </div>

      {/* Menu Categories Pills & Search */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 flex-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-600 text-stone-950 font-black shadow-sm'
                  : 'bg-stone-900 text-stone-300 border border-stone-800 hover:bg-stone-800'
              }`}
            >
              جميع الأقسام ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-amber-600 text-stone-950 font-black shadow-sm'
                      : 'bg-stone-900 text-stone-300 border border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  <span>{cat.nameAr}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Menu Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="بحث في قائمة الطعام..."
              className="w-full rounded-2xl bg-stone-900 border border-stone-800 pr-9 pl-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredProducts.map((product) => {
          const hasModifiers = product.modifiers && product.modifiers.length > 0;
          const photoUrl = getProductImage(product.id, product.categoryId, product.image);

          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className={`group rounded-3xl border overflow-hidden transition-all cursor-pointer flex flex-col justify-between ${
                product.isAvailable
                  ? 'bg-stone-900/80 border-stone-800/80 hover:border-amber-500/60 hover:bg-stone-900 active:scale-98 shadow-sm hover:shadow-xl'
                  : 'bg-stone-950 border-stone-900 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                {/* Product Photo */}
                <div className="relative h-40 w-full overflow-hidden bg-stone-950">
                  <img
                    src={photoUrl}
                    alt={product.nameAr}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/20 to-transparent" />

                  {/* SKU & Category badge */}
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-stone-950/80 text-amber-300 border border-stone-800/80 backdrop-blur-xs">
                    {product.sku}
                  </span>

                  {!product.isAvailable && (
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-950 text-rose-400 border border-rose-800 backdrop-blur-xs">
                      غير متوفر
                    </span>
                  )}
                </div>

                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-amber-400 transition-colors leading-snug">
                        {product.nameAr}
                      </h3>
                      {product.nameEn && (
                        <p className="text-[11px] text-stone-500 font-medium">{product.nameEn}</p>
                      )}
                    </div>
                  </div>

                  {product.descriptionAr && (
                    <p className="text-xs text-stone-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {product.descriptionAr}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-800/70 flex items-center justify-between gap-2">
                <div>
                  <div className="font-mono font-black text-sm sm:text-base text-amber-400">
                    {formatCurrency(product.price)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-0.5">
                    {product.prepTimeMinutes && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {product.prepTimeMinutes} دقيقة
                      </span>
                    )}
                    {hasModifiers && (
                      <span className="text-amber-500/90 font-bold bg-amber-500/10 px-1 rounded">
                        تخصيص +
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!product.isAvailable}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product);
                  }}
                  className="w-9 h-9 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black flex items-center justify-center transition-transform active:scale-90 shadow-sm"
                  title="إضافة للطلب"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Cart Drawer */}
      <CartDrawer onOpenTicketModal={onOpenTicketModal} />

      {/* Product Modifier & Customization Modal */}
      {activeProductForModifier && (
        <ProductModifierModal
          product={activeProductForModifier}
          onClose={() => setActiveProductForModifier(null)}
          onAddToCart={(_prod, qty, mods, notes) => {
            addItemToCart(activeProductForModifier, mods, notes, qty);
          }}
        />
      )}

      {/* Active Table Order Rounds History Modal */}
      {showOrderRoundsHistory && activeTableOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-stone-900 border border-stone-800 p-5 sm:p-6 shadow-2xl text-stone-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base">
                  سجل طلبات طاولة {selectedTable.number} (طلب #{activeTableOrder.orderNumber})
                </h3>
              </div>
              <button
                onClick={() => setShowOrderRoundsHistory(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              <div className="text-xs text-stone-400">
                حالة الطلب الإجمالية:{' '}
                <strong className="text-amber-400">{activeTableOrder.status}</strong> • الويتر:{' '}
                {activeTableOrder.waiterName}
              </div>

              <div className="space-y-2">
                {activeTableOrder.items.map((item, idx) => {
                  const itemImg = item.image || getProductImage(item.productId);
                  return (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-2xl bg-stone-950 border border-stone-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <img
                          src={itemImg}
                          alt={item.productNameAr}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-stone-800 bg-stone-900"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-stone-200 truncate">
                            {item.quantity} × {item.productNameAr}
                            {item.roundNumber && (
                              <span className="mr-2 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                جولة {item.roundNumber}
                              </span>
                            )}
                          </div>
                          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <div className="text-[11px] text-stone-400 mt-0.5 truncate">
                              {item.selectedModifiers.map((m) => m.optionNameAr).join('، ')}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-[11px] text-amber-500/90 mt-0.5">"{item.notes}"</div>
                          )}
                        </div>
                      </div>

                      <div className="text-left font-mono font-bold text-amber-400 shrink-0">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-xs flex justify-between items-center font-bold">
                <span className="text-stone-300">المجموع الحالي للطلب:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {formatCurrency(activeTableOrder.total)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-between items-center">
              <button
                onClick={() => {
                  setShowOrderRoundsHistory(false);
                  onOpenTicketModal(activeTableOrder.id);
                }}
                className="text-xs font-bold text-amber-400 hover:underline"
              >
                معاينة تذكرة المطبخ الحرارية
              </button>
              <button
                onClick={() => setShowOrderRoundsHistory(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-200 text-xs font-bold hover:bg-stone-700"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
