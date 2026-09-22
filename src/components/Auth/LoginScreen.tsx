import React, { useState } from 'react';
import {
  ChefHat,
  Eye,
  KeyRound,
  Lock,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export type SectionType = 'WAITER' | 'KITCHEN' | 'ADMIN';

interface SectionConfig {
  id: SectionType;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  icon: React.ReactNode;
  themeColor: string;
  borderAccent: string;
  badgeBg: string;
  quickUsers: Array<{
    name: string;
    username: string;
    pin: string;
    label: string;
  }>;
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'WAITER',
    titleAr: 'تسجيل دخول الكابتن والويتر',
    titleEn: 'Waiter & Captain Terminal',
    subtitleAr: 'فتح الطاولات وتسجيل الطلبات وإرسالها للمطبخ',
    icon: <UtensilsCrossed className="w-6 h-6 text-amber-400" />,
    themeColor: 'from-amber-600 to-amber-800',
    borderAccent: 'border-amber-500/40 hover:border-amber-500',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    quickUsers: [
      { name: 'أحمد الشامي', username: 'waiter01', pin: '1234', label: 'ويتر صالة 1' },
      { name: 'عمر الحلبي', username: 'waiter02', pin: '5678', label: 'ويتر صالة 2' },
    ],
  },
  {
    id: 'KITCHEN',
    titleAr: 'تسجيل دخول شاشة المطبخ (KDS)',
    titleEn: 'Kitchen Display System',
    subtitleAr: 'استلام بونات الطلبات وتوزيعها على أقسام التحضير',
    icon: <ChefHat className="w-6 h-6 text-orange-400" />,
    themeColor: 'from-orange-600 to-amber-700',
    borderAccent: 'border-orange-500/40 hover:border-orange-500',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    quickUsers: [
      { name: 'شيف المطبخ (أبو عبدو)', username: 'kitchen', pin: '3333', label: 'رئيس الطهاة' },
    ],
  },
  {
    id: 'ADMIN',
    titleAr: 'بوابة الإدارة العامة والرقابة',
    titleEn: 'Admin & Management Portal',
    subtitleAr: 'تقارير المبيعات، سجلات التدقيق، وإعدادات الطابعات',
    icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
    themeColor: 'from-emerald-600 to-teal-800',
    borderAccent: 'border-emerald-500/40 hover:border-emerald-500',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    quickUsers: [
      { name: 'المدير العام (أبو سليم)', username: 'admin', pin: '1111', label: 'إدارة عليا' },
      { name: 'مدير الصالة (وسيم)', username: 'manager', pin: '2222', label: 'مشرف الصالة' },
      { name: 'سامي الصندوق', username: 'cashier', pin: '4444', label: 'أمين الصندوق' },
    ],
  },
];

interface LoginScreenProps {
  onSuccessNavigate?: (targetTab: 'waiter' | 'kitchen' | 'printers' | 'floor' | 'admin') => void;
  defaultSection?: SectionType;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccessNavigate,
  defaultSection = 'WAITER',
}) => {
  const { loginWithPinOrUsername } = useAuth();

  const [activeSection, setActiveSection] = useState<SectionType>(defaultSection);
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [authMode, setAuthMode] = useState<'PIN' | 'USERNAME'>('PIN');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSectionConfig = SECTIONS.find((s) => s.id === activeSection)!;

  // Handle PIN Pad inputs
  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setErrorMsg('');
    }
  };

  const handlePinBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handlePinClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const performLogin = async (identifier: string) => {
    if (!identifier.trim()) {
      setErrorMsg('الرجاء إدخال الرمز أو اسم المستخدم');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const ok = await loginWithPinOrUsername(identifier.trim());
      if (ok) {
        // Navigate to appropriate section view
        if (onSuccessNavigate) {
          if (activeSection === 'WAITER') onSuccessNavigate('waiter');
          else if (activeSection === 'KITCHEN') onSuccessNavigate('kitchen');
          else onSuccessNavigate('admin');
        }
      } else {
        setErrorMsg('رمز الدخول أو الحساب غير مطابق لهذا القسم');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل الاتصال بالخادم المحلي');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (quickPin: string) => {
    setPin(quickPin);
    performLogin(quickPin);
  };

  return (
    <div
      className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between p-4 sm:p-6 select-none relative overflow-hidden"
      dir="rtl"
    >
      {/* Background ambient glow matching Syrian hospitality warmth */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-stone-800/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Branding */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center p-2 shadow-lg shadow-amber-950/60 border border-amber-500/30">
            <img src="/icon.svg" alt="شعار مطعم بيتنا الشامي" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-black text-xl text-amber-400 tracking-tight leading-none">
              مطعم بيتنا الشامي
            </h1>
            <p className="text-xs text-stone-400 mt-1">نظام شاشات الخدمة والمطابخ الذاتية - دمشق</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>الخادم المحلي نشط ومؤمّن</span>
        </div>
      </header>

      {/* Main Login Hub */}
      <main className="max-w-4xl mx-auto w-full my-auto py-4">
        {/* Section Selector: 3 Dedicated Independent Screens */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {SECTIONS.map((sec) => {
            const isSelected = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setActiveSection(sec.id);
                  setPin('');
                  setUsername('');
                  setErrorMsg('');
                }}
                className={`p-4 rounded-3xl border text-right transition-all flex flex-col justify-between gap-3 relative overflow-hidden group ${
                  isSelected
                    ? 'bg-stone-900/90 border-amber-500 shadow-xl shadow-amber-950/20 scale-[1.02]'
                    : 'bg-stone-950/80 border-stone-800/80 hover:bg-stone-900/60 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-2xl bg-stone-900 border border-stone-800 group-hover:scale-105 transition-transform">
                    {sec.icon}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                      isSelected ? sec.badgeBg : 'bg-stone-900 text-stone-500 border-stone-800'
                    }`}
                  >
                    {sec.id}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-sm sm:text-base text-white">{sec.titleAr}</h3>
                  <p className="text-[11px] text-stone-400 mt-1 line-clamp-1">{sec.subtitleAr}</p>
                </div>

                {isSelected && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Dedicated Section Login Card */}
        <div className="bg-stone-900/95 border border-stone-800 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-stone-800/80 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {currentSectionConfig.icon}
                </span>
                <h2 className="font-extrabold text-lg text-white">
                  {currentSectionConfig.titleAr}
                </h2>
              </div>
              <p className="text-xs text-stone-400 mt-1 font-sans">{currentSectionConfig.titleEn}</p>
            </div>

            {/* Toggle PIN or Username mode */}
            <div className="flex rounded-xl bg-stone-950 p-1 border border-stone-800 text-xs font-bold self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setAuthMode('PIN')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  authMode === 'PIN'
                    ? 'bg-amber-600 text-stone-950 font-black shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>رمز PIN السريع</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('USERNAME')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  authMode === 'USERNAME'
                    ? 'bg-amber-600 text-stone-950 font-black shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>اسم المستخدم</span>
              </button>
            </div>
          </div>

          {/* Quick Staff Select Buttons for Fast Restaurant Operations */}
          <div className="mb-6">
            <span className="block text-xs font-bold text-stone-400 mb-2">
              طاقم عمل هذا القسم (دخول سريع تجريبي):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentSectionConfig.quickUsers.map((u) => (
                <button
                  key={u.username}
                  type="button"
                  onClick={() => handleQuickLogin(u.pin)}
                  className="p-3 rounded-2xl bg-stone-950 hover:bg-stone-800/80 border border-stone-800/90 text-right transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-stone-200 group-hover:text-amber-400 transition-colors">
                      {u.name}
                    </span>
                    <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {u.pin}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 mt-1">{u.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode 1: PIN Pad Screen */}
          {authMode === 'PIN' ? (
            <div className="max-w-xs mx-auto space-y-4">
              {/* PIN Display Dots */}
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      pin.length > i
                        ? 'bg-amber-400 border-amber-400 scale-110 shadow-sm shadow-amber-400/50'
                        : 'border-stone-700 bg-stone-900'
                    }`}
                  />
                ))}
              </div>

              {/* Number Pad Grid */}
              <div className="grid grid-cols-3 gap-2.5 font-mono font-black text-xl">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePinDigit(digit)}
                    className="h-14 rounded-2xl bg-stone-950 hover:bg-stone-800 active:scale-95 border border-stone-800 text-white flex items-center justify-center transition-all shadow-sm"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handlePinClear}
                  className="h-14 rounded-2xl bg-stone-950/60 hover:bg-rose-950/40 text-rose-400 border border-stone-800 active:scale-95 text-xs font-bold flex items-center justify-center transition-all"
                >
                  مسح
                </button>
                <button
                  type="button"
                  onClick={() => handlePinDigit('0')}
                  className="h-14 rounded-2xl bg-stone-950 hover:bg-stone-800 active:scale-95 border border-stone-800 text-white flex items-center justify-center transition-all shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePinBackspace}
                  className="h-14 rounded-2xl bg-stone-950/60 hover:bg-stone-800 active:scale-95 text-stone-300 border border-stone-800 text-xs font-bold flex items-center justify-center transition-all"
                >
                  ←
                </button>
              </div>

              {/* Enter PIN Button */}
              <button
                type="button"
                disabled={pin.length < 4 || isSubmitting}
                onClick={() => performLogin(pin)}
                className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-stone-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? 'جارِ التحقق...' : 'تسجيل الدخول إلى القسم'}</span>
              </button>
            </div>
          ) : (
            /* Mode 2: Username / Password form */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                performLogin(username);
              }}
              className="max-w-sm mx-auto space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  اسم المستخدم أو المعرف الوظيفي:
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="مثال: waiter01 أو kitchen أو admin"
                  className="w-full rounded-2xl bg-stone-950 border border-stone-800 px-4 py-3 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={!username.trim() || isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? 'جارِ التحقق...' : 'دخول القسم'}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-4xl mx-auto w-full text-center text-[11px] text-stone-500 py-3 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>مطعم بيتنا الشامي • دمشق القديمة (باب توما)</span>
        <span>نظام محلي متكامل يعمل بدون إنترنت (Offline-First KDS / POS)</span>
      </footer>
    </div>
  );
};
