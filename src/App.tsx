import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Header } from './components/Header';
import { WaiterView } from './components/Waiter/WaiterView';
import { KitchenView } from './components/Kitchen/KitchenView';
import { PrinterManagerView } from './components/Printer/PrinterManagerView';
import { FloorManagerView } from './components/Floor/FloorManagerView';
import { AdminDashboardView } from './components/Admin/AdminDashboardView';
import { ThermalTicketModal } from './components/Printer/ThermalTicketModal';
import { LoginScreen, SectionType } from './components/Auth/LoginScreen';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

function MainAppContent() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'waiter' | 'kitchen' | 'printers' | 'floor' | 'admin'>('waiter');
  const [activeTicketOrderId, setActiveTicketOrderId] = useState<string | null>(null);
  const [showDedicatedLogin, setShowDedicatedLogin] = useState(false);

  const { notificationMessage, dismissNotification, isLoading } = useRestaurant();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center p-3 mb-4 animate-pulse">
          <img src="/icon.svg" alt="شعار مطعم بيتنا الشامي" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-lg font-bold text-amber-400">مطعم بيتنا الشامي</h2>
        <p className="text-xs text-stone-400 mt-1">جارِ تحميل قاعدة البيانات والاتصال بالخادم المحلي...</p>
      </div>
    );
  }

  // Determine initial section for login based on current role or tab
  const getSectionForTab = (): SectionType => {
    if (currentTab === 'kitchen') return 'KITCHEN';
    if (currentTab === 'admin' || currentTab === 'printers' || currentTab === 'floor') return 'ADMIN';
    return 'WAITER';
  };

  // If user explicitly logged out or wants dedicated section login
  if (!user || showDedicatedLogin) {
    return (
      <LoginScreen
        defaultSection={getSectionForTab()}
        onSuccessNavigate={(targetTab) => {
          setShowDedicatedLogin(false);
          setCurrentTab(targetTab);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col antialiased selection:bg-amber-600 selection:text-stone-950 font-sans" dir="rtl">
      {/* Real-time Toast Notification Banner */}
      {notificationMessage && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-top duration-200">
          <div
            className={`p-3.5 rounded-2xl border shadow-2xl flex items-center justify-between gap-3 ${
              notificationMessage.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
                : notificationMessage.type === 'alert'
                ? 'bg-rose-950/95 border-rose-500 text-rose-200'
                : 'bg-amber-950/95 border-amber-500 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notificationMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : notificationMessage.type === 'alert' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div className="text-xs font-bold leading-tight">
                <div>{notificationMessage.titleAr}</div>
                <div className="text-[10px] opacity-75 font-sans mt-0.5">{notificationMessage.titleEn}</div>
              </div>
            </div>

            <button
              onClick={dismissNotification}
              className="p-1 rounded-lg text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenLoginScreen={() => setShowDedicatedLogin(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'waiter' && (
          <WaiterView onOpenTicketModal={(orderId) => setActiveTicketOrderId(orderId)} />
        )}

        {currentTab === 'kitchen' && (
          <KitchenView onOpenTicketModal={(orderId) => setActiveTicketOrderId(orderId)} />
        )}

        {currentTab === 'printers' && <PrinterManagerView />}

        {currentTab === 'floor' && (
          <FloorManagerView onOpenTicketModal={(orderId) => setActiveTicketOrderId(orderId)} />
        )}

        {currentTab === 'admin' && (
          <AdminDashboardView onOpenTicketModal={(orderId) => setActiveTicketOrderId(orderId)} />
        )}
      </main>

      {/* Global Thermal Ticket Modal */}
      {activeTicketOrderId && (
        <ThermalTicketModal
          orderId={activeTicketOrderId}
          onClose={() => setActiveTicketOrderId(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <MainAppContent />
      </RestaurantProvider>
    </AuthProvider>
  );
}
