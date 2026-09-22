import React, { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { Product, ProductModifier, ModifierOption, SelectedItemModifier } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface ProductModifierModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    modifiers: SelectedItemModifier[],
    notes: string
  ) => void;
}

export const ProductModifierModal: React.FC<ProductModifierModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedItemModifier[]>([]);

  // Preselect defaults if any modifier is required and single-select
  useEffect(() => {
    if (product.modifiers && product.modifiers.length > 0) {
      const defaults: SelectedItemModifier[] = [];
      for (const group of product.modifiers) {
        if (group.required && !group.multiSelect && group.options.length > 0) {
          const firstOpt = group.options[0];
          defaults.push({
            modifierId: group.id,
            modifierNameAr: group.nameAr,
            modifierNameEn: group.nameEn,
            optionId: firstOpt.id,
            optionNameAr: firstOpt.nameAr,
            optionNameEn: firstOpt.nameEn,
            priceDelta: firstOpt.priceDelta,
          });
        }
      }
      setSelectedModifiers(defaults);
    }
  }, [product]);

  const handleSelectOption = (group: ProductModifier, opt: ModifierOption) => {
    if (group.multiSelect) {
      // Toggle
      const exists = selectedModifiers.some((m) => m.optionId === opt.id);
      if (exists) {
        setSelectedModifiers((prev) => prev.filter((m) => m.optionId !== opt.id));
      } else {
        setSelectedModifiers((prev) => [
          ...prev,
          {
            modifierId: group.id,
            modifierNameAr: group.nameAr,
            modifierNameEn: group.nameEn,
            optionId: opt.id,
            optionNameAr: opt.nameAr,
            optionNameEn: opt.nameEn,
            priceDelta: opt.priceDelta,
          },
        ]);
      }
    } else {
      // Single select: replace option in this group
      setSelectedModifiers((prev) => [
        ...prev.filter((m) => m.modifierId !== group.id),
        {
          modifierId: group.id,
          modifierNameAr: group.nameAr,
          modifierNameEn: group.nameEn,
          optionId: opt.id,
          optionNameAr: opt.nameAr,
          optionNameEn: opt.nameEn,
          priceDelta: opt.priceDelta,
        },
      ]);
    }
  };

  const isOptionSelected = (optId: string) => selectedModifiers.some((m) => m.optionId === optId);

  const modifiersTotalDelta = selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
  const unitPrice = product.price + modifiersTotalDelta;
  const totalPrice = unitPrice * quantity;

  const quickNotesSuggestions = [
    'بدون بصل',
    'بدون ثوم',
    'زيادة حدة الشطة',
    'مستوي زيادة عالفحم',
    'استواء خفيف',
    'صلصة جانبية',
    'بدون ملح زائد',
    'مستعجل جداً',
  ];

  const handleQuickNote = (noteText: string) => {
    if (notes.includes(noteText)) {
      setNotes(
        notes
          .replace(noteText, '')
          .replace(/,\s*,/g, ',')
          .trim()
      );
    } else {
      setNotes(notes ? `${notes}، ${noteText}` : noteText);
    }
  };

  const handleConfirm = () => {
    onAddToCart(product, quantity, selectedModifiers, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-stone-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-start justify-between bg-stone-950/80">
          <div>
            <span className="text-[10px] font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {product.sku}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1">
              {product.nameAr}
            </h3>
            {product.nameEn && (
              <p className="text-xs text-stone-400 font-sans">{product.nameEn}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Dish Image Banner */}
        {product.image && (
          <div className="w-full h-44 sm:h-52 overflow-hidden relative border-b border-stone-800 bg-stone-950 shrink-0">
            <img
              src={product.image}
              alt={product.nameAr}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/20 to-transparent" />
            <div className="absolute bottom-3 right-4 left-4 flex items-end justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 bg-stone-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-amber-500/30">
                {formatCurrency(product.price)}
              </span>
              {product.prepTimeMinutes && (
                <span className="text-xs text-stone-300 bg-stone-950/80 backdrop-blur-md px-2 py-1 rounded-xl border border-stone-800">
                  ⏱️ {product.prepTimeMinutes} دقيقة
                </span>
              )}
            </div>
          </div>
        )}

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {product.descriptionAr && (
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed bg-stone-950/50 p-3 rounded-xl border border-stone-800/60">
              {product.descriptionAr}
            </p>
          )}

          {/* Modifier Groups */}
          {product.modifiers && product.modifiers.length > 0 && (
            product.modifiers.map((group) => (
              <div key={group.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-stone-200">
                    {group.nameAr}
                    {group.required && <span className="text-rose-400 text-xs mr-1">* (مطلوب)</span>}
                  </h4>
                  <span className="text-[11px] text-stone-400">
                    {group.multiSelect ? 'اختيار متعدد' : 'اختيار واحد'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {group.options.map((opt) => {
                    const selected = isOptionSelected(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(group, opt)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-right transition-all text-xs font-bold ${
                          selected
                            ? 'bg-amber-600/15 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-stone-800/40 border-stone-800 text-stone-300 hover:bg-stone-800/80'
                        }`}
                      >
                        <span>{opt.nameAr}</span>
                        {opt.priceDelta > 0 && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            +{formatCurrency(opt.priceDelta)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Quick Notes Suggestions */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-bold text-stone-200">ملاحظات التحضير المخصصة للمطبخ</h4>
            <div className="flex flex-wrap gap-1.5">
              {quickNotesSuggestions.map((tag) => {
                const active = notes.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickNote(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-amber-600 text-stone-950 font-black shadow-sm'
                        : 'bg-stone-800/60 border border-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Custom Notes Input */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي طلب أو تخصيص محدد للزبون هنا (ستطبع بالتذكرة للمطبخ)..."
              rows={2}
              className="w-full rounded-2xl bg-stone-950 border border-stone-800 p-3 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between p-3.5 bg-stone-950 rounded-2xl border border-stone-800">
            <span className="text-sm font-bold text-stone-300">الكمية المطلوبة:</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 flex items-center justify-center font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-mono font-black text-lg text-amber-400">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 flex items-center justify-center font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer (Price & Add Button) */}
        <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950/90 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-stone-400 block font-sans">المجموع</span>
            <div className="text-lg sm:text-xl font-black font-mono text-amber-400">
              {formatCurrency(totalPrice)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 max-w-xs py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة إلى الطلب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
