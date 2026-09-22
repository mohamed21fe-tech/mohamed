import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  FileText,
  Printer as PrinterIcon,
  RefreshCw,
  Send,
  Sliders,
  Wifi,
  X,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { api } from '../../services/api';
import { Printer } from '../../types';

interface ThermalTicketModalProps {
  orderId: string;
  onClose: () => void;
}

export const ThermalTicketModal: React.FC<ThermalTicketModalProps> = ({ orderId, onClose }) => {
  const { kitchenOrders, printers, stations } = useRestaurant();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [ticketText, setTicketText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [isPrintingNetwork, setIsPrintingNetwork] = useState(false);
  const [networkPrintResult, setNetworkPrintResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const order = kitchenOrders.find((o) => o.id === orderId);

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTicketPreview(orderId, paperWidth, selectedStation);
      setTicketText(res.ticketText);
    } catch (err) {
      console.error('Error fetching ticket preview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [orderId, paperWidth, selectedStation]);

  useEffect(() => {
    if (printers.length > 0 && !selectedPrinterId) {
      const firstActive = printers.find((p) => p.isActive) || printers[0];
      setSelectedPrinterId(firstActive.id);
    }
  }, [printers]);

  const handleBrowserPrint = () => {
    // Print window
    window.print();
  };

  const handleNetworkPrint = async () => {
    if (!selectedPrinterId) return;
    setIsPrintingNetwork(true);
    setNetworkPrintResult(null);
    try {
      const res = await api.printOrderNetwork(orderId, selectedPrinterId);
      setNetworkPrintResult(res);
    } catch (err: any) {
      setNetworkPrintResult({ success: false, message: err.message || 'فشل الاتصال بالطابعة' });
    } finally {
      setIsPrintingNetwork(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(ticketText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-stone-100">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <PrinterIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">
                تذكرة طباعة المطبخ الحرارية (Thermal Ticket)
              </h3>
              <p className="text-xs text-stone-400">
                طلب #{order.orderNumber} • طاولة {order.tableNumber} ({order.tableName})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-3.5 bg-stone-950/60 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Paper Width */}
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-bold">عرض الورق:</span>
            <div className="flex rounded-xl bg-stone-900 p-0.5 border border-stone-800 font-bold">
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  paperWidth === '80mm' ? 'bg-amber-600 text-stone-950 font-black' : 'text-stone-400'
                }`}
              >
                80 مم (قياسي)
              </button>
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  paperWidth === '58mm' ? 'bg-amber-600 text-stone-950 font-black' : 'text-stone-400'
                }`}
              >
                58 مم (صغير)
              </button>
            </div>
          </div>

          {/* Station Split */}
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-bold">تذكرة قسم:</span>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="rounded-xl bg-stone-900 border border-stone-800 px-3 py-1.5 text-xs text-stone-200 font-bold focus:outline-hidden focus:border-amber-500"
            >
              <option value="ALL">تذكرة المطبخ الكاملة (الكل)</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.nameAr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ticket Scroll Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-950 flex items-center justify-center">
          {isLoading ? (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>جارِ توليد التذكرة الحرارية...</span>
            </div>
          ) : (
            /* Thermal Receipt Roll Container */
            <div
              className={`bg-white text-stone-950 font-mono text-xs sm:text-sm p-4 sm:p-6 shadow-2xl rounded-sm border-t-8 border-amber-600 select-all transition-all printable-ticket ${
                paperWidth === '58mm' ? 'w-full max-w-[280px]' : 'w-full max-w-[360px]'
              }`}
              style={{
                fontFamily: '"Courier New", Courier, monospace',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
              }}
            >
              <pre className="whitespace-pre-wrap font-inherit leading-relaxed text-right dir-rtl">
                {ticketText}
              </pre>

              {/* Thermal Zig-Zag Bottom Paper Edge */}
              <div className="mt-4 pt-2 border-t border-dashed border-stone-400 text-center text-[10px] text-stone-600">
                [ نهاية التذكرة الحرارية - بيتنا الشامي ]
              </div>
            </div>
          )}
        </div>

        {/* Network Print Status Feedback */}
        {networkPrintResult && (
          <div
            className={`px-4 py-2.5 text-xs font-bold border-t flex items-center justify-between ${
              networkPrintResult.success
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/80 border-rose-800 text-rose-300'
            }`}
          >
            <span>{networkPrintResult.message}</span>
            <button
              onClick={() => setNetworkPrintResult(null)}
              className="text-stone-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Actions */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/95 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Network Printer Dispatch */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPrinterId}
              onChange={(e) => setSelectedPrinterId(e.target.value)}
              className="rounded-xl bg-stone-900 border border-stone-800 px-3 py-2 text-xs text-stone-200 font-bold focus:outline-hidden focus:border-amber-500"
            >
              {printers.map((prn) => (
                <option key={prn.id} value={prn.id}>
                  {prn.name} ({prn.ip})
                </option>
              ))}
            </select>

            <button
              onClick={handleNetworkPrint}
              disabled={isPrintingNetwork || !selectedPrinterId}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isPrintingNetwork ? 'جارِ الإرسال...' : 'إرسال للطابعة الشبكية'}</span>
            </button>
          </div>

          {/* Local Print / Copy Actions */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>

            <button
              id="browser-print-ticket-btn"
              onClick={handleBrowserPrint}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 border border-stone-700"
            >
              <PrinterIcon className="w-4 h-4 text-amber-400" />
              <span>طباعة بالمتصفح</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
