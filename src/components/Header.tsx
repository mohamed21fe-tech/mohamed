import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  ChefHat,
  CreditCard,
  Grid3X3,
  LayoutDashboard,
  LogIn,
  LogOut,
  Printer,
  ShieldCheck,
  User,
  UtensilsCrossed,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';
import { UserRole } from '../types';

interface HeaderProps {
  currentTab: 'waiter' | 'kitchen' | 'printers' | 'floor' | 'admin';
  setCurrentTab: (tab: 'waiter' | 'kitchen' | 'printers' | 'floor' | 'admin') => void;
  onOpenLoginScreen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, onOpenLoginScreen }) => {
  const { user, switchRoleQuick, logout } = useAuth();
  const { kitchenOrders, settings } = useRestaurant();
  const isOnline = useOnlineStatus();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const activeOrdersCount = kitchenOrders.filter(
    (o) => !['PAID', 'CANCELLED'].includes(o.status)
  ).length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-stone-800 shadow-md">
        {/* Top brand & status bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentTab('waiter')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center p-1.5 shadow-md shadow-amber-950/50 border border-amber-500/30">
              <img src="/icon.svg" alt="شعار مطعم بيتنا الشامي" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-amber-400 tracking-tight leading-none">
                  {settings?.restaurantNameAr || 'مطعم بيتنا الشامي'}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  POS &amp; KDS
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-medium leading-tight mt-0.5 hidden sm:block">
                نظام إدارة الطلبات والمطبخ المحلي - دمشق
              </p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-2">
            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Online / Local Network Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isOnline
                  ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-400'
                  : 'bg-rose-950/50 border-rose-800/60 text-rose-400 animate-pulse'
              }`}
              title={isOnline ? 'متصل بشبكة المطعم المحلية' : 'غير متصل بالخادم المحلي'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isOnline ? 'شبكة المطعم متصلة' : 'وضع غير متصل'}</span>
            </div>

            {/* Sound Mute Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              title={soundEnabled ? 'تنبيهات الصوت مفعلة' : 'تنبيهات الصوت صامتة'}
            >
              {soundEnabled ? <Bell className="w-4 h-4 text-amber-400" /> : <BellOff className="w-4 h-4" />}
            </button>

            {/* Active User / Role Switcher */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowRoleModal(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-800/90 text-stone-200 transition-all text-xs font-bold"
              >
                <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center text-amber-400 border border-stone-700">
                  {user?.role === 'WAITER' ? (
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                  ) : user?.role === 'KITCHEN' ? (
                    <ChefHat className="w-3.5 h-3.5" />
                  ) : user?.role === 'CASHIER' ? (
                    <CreditCard className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="text-right hidden sm:block">
                  <span className="block leading-none">{user?.name || 'مستخدم'}</span>
                  <span className="text-[10px] text-amber-500 font-medium">
                    {user?.role === 'WAITER' && 'ويتر'}
                    {user?.role === 'KITCHEN' && 'المطبخ'}
                    {user?.role === 'CASHIER' && 'الصندوق'}
                    {user?.role === 'MANAGER' && 'مدير الصالة'}
                    {user?.role === 'ADMIN' && 'المدير العام'}
                  </span>
                </div>
              </button>

              {onOpenLoginScreen && (
                <button
                  onClick={onOpenLoginScreen}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all text-xs font-bold flex items-center gap-1"
                  title="شاشات تسجيل الدخول للأقسام (Waiter / Kitchen / Admin)"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden md:inline">تبديل القسم</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-stone-800/60 py-1.5 text-xs font-bold">
          <button
            onClick={() => setCurrentTab('waiter')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              currentTab === 'waiter'
                ? 'bg-amber-600 text-stone-950 shadow-sm font-extrabold'
                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>طلب ويتر (PWA)</span>
          </button>

          <button
            onClick={() => setCurrentTab('kitchen')}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              currentTab === 'kitchen'
                ? 'bg-amber-600 text-stone-950 shadow-sm font-extrabold'
                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>شاشة المطبخ (KDS)</span>
            {activeOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                {activeOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('printers')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              currentTab === 'printers'
                ? 'bg-amber-600 text-stone-950 shadow-sm font-extrabold'
                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>الطابعات الحرارية</span>
          </button>

          <button
            onClick={() => setCurrentTab('floor')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              currentTab === 'floor'
                ? 'bg-amber-600 text-stone-950 shadow-sm font-extrabold'
                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>مخطط الصالة</span>
          </button>

          <button
            onClick={() => setCurrentTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              currentTab === 'admin'
                ? 'bg-amber-600 text-stone-950 shadow-sm font-extrabold'
                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>الإدارة والتقارير</span>
          </button>
        </div>
      </header>

      {/* Quick Role Switcher Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-stone-900 border border-stone-700 p-6 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base">تبديل حساب المستخدم / الحساب التجريبي</h3>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs text-stone-400">
              اختر دوراً لتجربة سير العمل من وجهة نظر المستخدم (الويتر، الشيف، أو الإدارة):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
              <button
                onClick={() => {
                  switchRoleQuick('WAITER');
                  setShowRoleModal(false);
                  setCurrentTab('waiter');
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
                  user?.role === 'WAITER'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-stone-800 bg-stone-800/50 hover:bg-stone-800 text-stone-200'
                }`}
              >
                <UtensilsCrossed className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm">أحمد الشامي (ويتر)</div>
                  <div className="text-[11px] text-stone-400">رمز PIN: 1234</div>
                </div>
              </button>

              <button
                onClick={() => {
                  switchRoleQuick('KITCHEN');
                  setShowRoleModal(false);
                  setCurrentTab('kitchen');
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
                  user?.role === 'KITCHEN'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-stone-800 bg-stone-800/50 hover:bg-stone-800 text-stone-200'
                }`}
              >
                <ChefHat className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm">شيف المطبخ (أبو عبدو)</div>
                  <div className="text-[11px] text-stone-400">رمز PIN: 3333</div>
                </div>
              </button>

              <button
                onClick={() => {
                  switchRoleQuick('MANAGER');
                  setShowRoleModal(false);
                  setCurrentTab('admin');
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
                  user?.role === 'MANAGER'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-stone-800 bg-stone-800/50 hover:bg-stone-800 text-stone-200'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm">مدير الصالة (وسيم)</div>
                  <div className="text-[11px] text-stone-400">رمز PIN: 2222</div>
                </div>
              </button>

              <button
                onClick={() => {
                  switchRoleQuick('ADMIN');
                  setShowRoleModal(false);
                  setCurrentTab('admin');
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
                  user?.role === 'ADMIN'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-stone-800 bg-stone-800/50 hover:bg-stone-800 text-stone-200'
                }`}
              >
                <LayoutDashboard className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm">المدير العام (أبو سليم)</div>
                  <div className="text-[11px] text-stone-400">رمز PIN: 1111</div>
                </div>
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-stone-800">
              <button
                onClick={() => {
                  logout();
                  setShowRoleModal(false);
                  if (onOpenLoginScreen) onOpenLoginScreen();
                }}
                className="flex items-center gap-2 text-rose-400 hover:text-rose-300 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل خروج الحساب</span>
              </button>

              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
