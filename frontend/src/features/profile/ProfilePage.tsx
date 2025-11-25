import { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { profileService } from '@/services/profileService';
import { fetchUserProfile } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';
import { useTheme } from '@/contexts/ThemeContext';
import {
  User,
  Lock,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Settings,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Award,
  TrendingUp,
  UserCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function ProfilePage() {
  const { t } = useTranslation();
  const tc = useThemeClasses();
  const { theme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile');

  const isLight = theme === 'light';

  if (!user) return null;

  return (
    <div className={`relative w-full pb-20 font-sans ${isLight ? 'bg-light-bg text-light-text-primary' : 'bg-[#050505] text-[#E0E0E0]'}`}>
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 ${isLight
          ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-200/40 via-light-bg to-light-bg'
          : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-900/20 via-[#050505] to-[#050505]'}`}
        />
        <div className={`absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full animate-pulse border ${
          isLight ? 'border-rose-300/60 opacity-40' : 'border-rose-500/20 opacity-20'
        }`} style={{ animationDuration: '10s' }} />
        <div className={`absolute top-[20%] left-[-10%] w-[120%] h-[1px] -rotate-12 ${
          isLight ? 'bg-gradient-to-r from-transparent via-rose-400/30 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-500/10 to-transparent'
        }`} />
        <div className={`absolute bottom-[-5%] right-[20%] w-[300px] h-[300px] rounded-full blur-3xl ${
          isLight ? 'bg-rose-300/20' : 'bg-rose-900/10'
        }`} />
        <div className={`absolute top-[40%] left-[-5%] w-[200px] h-[200px] rounded-full blur-2xl ${
          isLight ? 'bg-pink-200/20' : 'bg-pink-900/10'
        }`} />
      </div>

      <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-16 sm:pt-20 lg:pt-24 flex flex-col gap-8 sm:gap-10 lg:gap-12 xl:gap-16">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-2 flex flex-col justify-center">
            <div className={`inline-flex items-center gap-3 px-3 py-1 mb-6 lg:mb-8 rounded-sm w-fit backdrop-blur-sm border ${
              isLight ? 'border-rose-200 bg-rose-100/50' : 'border-rose-500/20 bg-rose-500/10'
            }`}>
              <UserCircle className={`w-3.5 h-3.5 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
              <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                {t('profile.badge', 'Account Settings')}
              </span>
            </div>

            <h1 className={`font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.9] mb-3 sm:mb-4 lg:mb-6 tracking-tight ${
              isLight ? 'text-gray-900' : 'text-white'
            }`}>
              {t('profile.title', 'Profile')}<br />
              <span className={`italic font-serif ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>Management.</span>
            </h1>

            <p className={`text-sm sm:text-base lg:text-lg font-mono max-w-xl leading-relaxed pl-3 sm:pl-4 lg:pl-6 border-l ${
              isLight ? 'text-gray-600 border-rose-300' : 'text-gray-400 border-rose-500/20'
            }`}>
              {user.full_name || t('profile.defaultUser')}<br />
              <span className="flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </span>
            </p>
          </div>

          <div className="hidden lg:flex justify-end items-center">
            {user.is_verified && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-sm border ${
                isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800'
              }`}>
                <CheckCircle className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <span className={`text-sm font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  {t('profile.verified')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={`backdrop-blur-xl rounded-sm border ${
          isLight ? 'bg-white/80 border-gray-200 shadow-lg' : 'bg-[#0A0A0A]/60 border-white/10'
        }`}>
          <div className={`flex items-center gap-1 border-b ${isLight ? 'border-gray-200' : 'border-white/10'} p-2`}>
            <TabButton
              label={t('profile.tabs.profile')}
              icon={<User className="w-4 h-4" />}
              isActive={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              isLight={isLight}
            />
            <TabButton
              label={t('profile.tabs.security')}
              icon={<Lock className="w-4 h-4" />}
              isActive={activeTab === 'security'}
              onClick={() => setActiveTab('security')}
              isLight={isLight}
            />
            <TabButton
              label={t('profile.tabs.activity')}
              icon={<TrendingUp className="w-4 h-4" />}
              isActive={activeTab === 'activity'}
              onClick={() => setActiveTab('activity')}
              isLight={isLight}
            />
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && <ProfileTab user={user} dispatch={useAppDispatch()} tc={tc} isLight={isLight} />}
            {activeTab === 'security' && <SecurityTab tc={tc} isLight={isLight} />}
            {activeTab === 'activity' && <ActivityTab user={user} tc={tc} isLight={isLight} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom DatePicker Component
function CustomDatePicker({ value, onChange, isLight }: { value: string; onChange: (value: string) => void; isLight: boolean }) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const monthNames = [
    t('months.january', 'January'), t('months.february', 'February'), t('months.march', 'March'),
    t('months.april', 'April'), t('months.may', 'May'), t('months.june', 'June'),
    t('months.july', 'July'), t('months.august', 'August'), t('months.september', 'September'),
    t('months.october', 'October'), t('months.november', 'November'), t('months.december', 'December')
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateDaysForMonth = () => {
    const days = [];
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startDay = (date.getDay() + 6) % 7;

    for (let i = 0; i < startDay; i++) {
      days.push({ day: new Date(date.getFullYear(), date.getMonth(), i - startDay + 1), isPadding: true });
    }

    while (date.getMonth() === viewDate.getMonth()) {
      days.push({ day: new Date(date), isPadding: false });
      date.setDate(date.getDate() + 1);
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: new Date(date.getFullYear(), date.getMonth(), i), isPadding: true });
    }
    return days;
  };

  const handleDateSelect = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const calendarDays = generateDaysForMonth();
  const selectedDate = value ? new Date(value) : null;
  const today = new Date();

  return (
    <div className="relative" ref={pickerRef}>
      <div className="relative">
        <input
          type="text"
          readOnly
          value={value ? new Date(value).toLocaleDateString(i18n.language) : ''}
          onClick={() => setIsOpen(!isOpen)}
          placeholder="DD.MM.YYYY"
          className={`w-full border rounded-sm text-sm px-4 py-2.5 pr-10 font-mono transition-all cursor-pointer ${
            isLight
              ? 'bg-white border-gray-200 text-gray-900 focus:border-rose-500'
              : 'bg-white/5 border-white/10 text-white focus:border-rose-500'
          } focus:outline-none focus:ring-1 focus:ring-rose-500`}
        />
        <Calendar
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer transition-colors ${
            isLight ? 'text-gray-400 hover:text-rose-600' : 'text-gray-600 hover:text-rose-400'
          }`}
        />
      </div>

      {isOpen && (
        <div className={`absolute top-full mt-2 w-full max-w-xs z-20 backdrop-blur-xl border rounded-sm shadow-lg p-4 ${
          isLight ? 'bg-white/95 border-gray-200' : 'bg-[#0A0A0A]/95 border-white/10'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}
              className={`p-1 rounded-sm transition-colors ${
                isLight ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className={`font-bold text-sm font-mono ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}
              className={`p-1 rounded-sm transition-colors ${
                isLight ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className={`grid grid-cols-7 gap-1 text-center text-xs font-mono mb-2 ${
            isLight ? 'text-gray-600' : 'text-gray-500'
          }`}>
            {daysOfWeek.map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ day, isPadding }) => {
              const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
              const isToday = day.toDateString() === today.toDateString();
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  disabled={isPadding}
                  onClick={() => handleDateSelect(day)}
                  className={`p-2 text-sm font-mono rounded-sm transition-colors ${
                    isPadding
                      ? 'text-transparent cursor-default'
                      : isLight
                        ? 'text-gray-900 hover:bg-gray-100'
                        : 'text-white hover:bg-white/10'
                  } ${
                    isSelected
                      ? isLight
                        ? '!bg-rose-600 !text-white'
                        : '!bg-rose-600 !text-white'
                      : ''
                  } ${
                    isToday && !isSelected
                      ? isLight
                        ? 'border border-rose-300'
                        : 'border border-rose-500/50'
                      : ''
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// TabButton Component
function TabButton({ label, icon, isActive, onClick, isLight }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void, isLight: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-sm transition-all ${
        isActive
          ? isLight
            ? 'bg-rose-600 text-white'
            : 'bg-rose-600 text-white'
          : isLight
            ? 'text-gray-600 hover:bg-gray-100'
            : 'text-gray-500 hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}


// Profile Tab Component
function ProfileTab({ user, dispatch, tc, isLight }: { user: any; dispatch: any; tc: ReturnType<typeof useThemeClasses>; isLight: boolean }) {
  const { t, i18n } = useTranslation();
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user.date_of_birth || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await profileService.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        date_of_birth: dateOfBirth || null,
      });
      await dispatch(fetchUserProfile());
      setSuccess(t('profile.messages.profileUpdateSuccess'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('profile.messages.profileUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={`lg:col-span-2 ${tc.cardBg} border ${tc.cardBorder} rounded-sm p-6`}>
        <h3 className={`text-xl font-bold ${tc.textPrimary} mb-6 flex items-center gap-2`}>
          <Settings className="w-5 h-5 text-rose-500" />
          {t('profile.accountInfo.title')}
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {success && (
            <div className="p-4 bg-green-950 border border-green-800 rounded-sm flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-950 border border-red-800 rounded-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {/* Email */}
          <div>
            <label className={`block text-sm font-mono uppercase tracking-wider mb-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
              {t('profile.accountInfo.emailLabel', 'Email')}
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className={`w-full border rounded-sm text-sm px-4 py-2.5 cursor-not-allowed font-mono ${
                isLight ? 'bg-gray-100 border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white'
              }`}
            />
            <p className={`text-xs font-mono mt-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
              {t('profile.accountInfo.emailHint', 'Email cannot be changed')}
            </p>
          </div>

          {/* First Name */}
          <div>
            <label className={`block text-sm font-mono uppercase tracking-wider mb-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
              {t('profile.accountInfo.firstNameLabel', 'First Name')}
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full border rounded-sm text-sm px-4 py-2.5 font-mono transition-all ${
                isLight
                  ? 'bg-white border-gray-200 text-gray-900 focus:border-rose-500'
                  : 'bg-white/5 border-white/10 text-white focus:border-rose-500'
              } focus:outline-none focus:ring-1 focus:ring-rose-500`}
              placeholder={t('profile.accountInfo.firstNamePlaceholder', 'Enter first name')}
            />
          </div>

          {/* Last Name */}
          <div>
            <label className={`block text-sm font-mono uppercase tracking-wider mb-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
              {t('profile.accountInfo.lastNameLabel', 'Last Name')}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full border rounded-sm text-sm px-4 py-2.5 font-mono transition-all ${
                isLight
                  ? 'bg-white border-gray-200 text-gray-900 focus:border-rose-500'
                  : 'bg-white/5 border-white/10 text-white focus:border-rose-500'
              } focus:outline-none focus:ring-1 focus:ring-rose-500`}
              placeholder={t('profile.accountInfo.lastNamePlaceholder', 'Enter last name')}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={`block text-sm font-mono uppercase tracking-wider mb-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
              {t('profile.accountInfo.phoneLabel', 'Phone Number')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full border rounded-sm text-sm px-4 py-2.5 font-mono transition-all ${
                isLight
                  ? 'bg-white border-gray-200 text-gray-900 focus:border-rose-500'
                  : 'bg-white/5 border-white/10 text-white focus:border-rose-500'
              } focus:outline-none focus:ring-1 focus:ring-rose-500`}
              placeholder={t('profile.accountInfo.phonePlaceholder', '+1234567890')}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className={`block text-sm font-mono uppercase tracking-wider mb-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
              {t('profile.accountInfo.dateOfBirthLabel', 'Date of Birth')}
            </label>
            <CustomDatePicker
              value={dateOfBirth}
              onChange={setDateOfBirth}
              isLight={isLight}
            />
          </div>

          {/* User ID */}
          <div>
            <label className={`block text-sm font-mono uppercase tracking-wider mb-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
              {t('profile.accountInfo.userIdLabel', 'User ID')}
            </label>
            <input
              type="text"
              value={user.id}
              disabled
              className={`w-full border rounded-sm text-sm px-4 py-2.5 cursor-not-allowed font-mono ${
                isLight ? 'bg-gray-100 border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 rounded-sm text-white font-medium flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50 transition-colors"
          >
            <Save className="w-5 h-5" />
            {loading ? t('profile.buttons.saving') : t('profile.buttons.save')}
          </button>
        </form>
      </div>
      <div className="space-y-6">
        {/* Personal Info Card */}
        <div className={`backdrop-blur-xl p-6 rounded-sm border ${
          isLight ? 'bg-white/80 border-gray-200 shadow-lg' : 'bg-[#0A0A0A]/60 border-white/10'
        }`}>
          <h4 className={`text-sm font-mono uppercase tracking-wider mb-4 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
            {t('profile.personalInfo.title', 'Personal Info')}
          </h4>
          <div className="space-y-3">
            {(user.first_name || user.last_name) && (
              <div>
                <p className={`text-xs font-mono mb-1 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                  {t('profile.personalInfo.name', 'Full Name')}
                </p>
                <p className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {`${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}
                </p>
              </div>
            )}
            {user.phone && (
              <div>
                <p className={`text-xs font-mono mb-1 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                  {t('profile.personalInfo.phone', 'Phone')}
                </p>
                <p className={`text-sm font-mono font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {user.phone}
                </p>
              </div>
            )}
            {user.date_of_birth && (
              <div>
                <p className={`text-xs font-mono mb-1 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                  {t('profile.personalInfo.dateOfBirth', 'Date of Birth')}
                </p>
                <p className={`text-sm font-mono font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {new Date(user.date_of_birth).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Account Status Card */}
        <div className={`backdrop-blur-xl p-6 rounded-sm border ${
          isLight ? 'bg-white/80 border-gray-200 shadow-lg' : 'bg-[#0A0A0A]/60 border-white/10'
        }`}>
          <h4 className={`text-sm font-mono uppercase tracking-wider mb-4 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
            {t('profile.status.title')}
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                {t('profile.status.verification')}
              </span>
              {user.is_verified ? (
                <div className={`flex items-center gap-1 text-sm font-mono font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                  <CheckCircle className="w-4 h-4" />
                  {t('profile.status.yes')}
                </div>
              ) : (
                <div className={`flex items-center gap-1 text-sm font-mono font-bold ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`}>
                  <XCircle className="w-4 h-4" />
                  {t('profile.status.no')}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                {t('profile.status.botType')}
              </span>
              <span className={`text-sm font-mono font-bold capitalize ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {user.bot_type === 'none' ? t('profile.status.no') : user.bot_type}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                {t('profile.status.balance')}
              </span>
              <span className={`text-sm font-mono font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>
                €{parseFloat(user.balance).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Dates Card */}
        <div className={`backdrop-blur-xl p-6 rounded-sm border ${
          isLight ? 'bg-white/80 border-gray-200 shadow-lg' : 'bg-[#0A0A0A]/60 border-white/10'
        }`}>
          <h4 className={`text-sm font-mono uppercase tracking-wider mb-4 flex items-center gap-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
            <Calendar className="w-4 h-4" />
            {t('profile.dates.title')}
          </h4>
          <div className="space-y-3">
            <div>
              <p className={`text-xs font-mono mb-1 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                {t('profile.dates.registration')}
              </p>
              <p className={`text-sm font-mono font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {new Date(user.created_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {user.last_login && (
              <div>
                <p className={`text-xs font-mono mb-1 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                  {t('profile.dates.lastLogin')}
                </p>
                <p className={`text-sm font-mono font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {new Date(user.last_login).toLocaleString(i18n.language, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Security Tab Component
function SecurityTab({ tc, isLight }: { tc: ReturnType<typeof useThemeClasses>; isLight: boolean }) {
  const { t } = useTranslation();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', new_password_confirm: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (passwords.new_password !== passwords.new_password_confirm) {
      setError(t('profile.messages.passwordMismatch'));
      return;
    }
    try {
      setLoading(true);
      await profileService.changePassword(passwords);
      setSuccess(t('profile.messages.passwordUpdateSuccess'));
      setPasswords({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || t('profile.messages.passwordUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={`lg:col-span-2 ${tc.cardBg} border ${tc.cardBorder} rounded-sm p-6`}>
        <h3 className={`text-xl font-bold ${tc.textPrimary} mb-6 flex items-center gap-2`}><Lock className="w-5 h-5 text-rose-500" />{t('profile.security.title')}</h3>
        <form onSubmit={handleChangePassword} className="space-y-6">
          {success && <div className="p-4 bg-green-950 border border-green-800 rounded-sm flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-green-400">{success}</p></div>}
          {error && <div className="p-4 bg-red-950 border border-red-800 rounded-sm flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-400">{error}</p></div>}
          <div>
            <label className={`block text-sm font-medium ${tc.textPrimary} mb-2`}>{t('profile.security.currentPassword')}</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={passwords.old_password}
                onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                className={`w-full ${tc.hover} border ${tc.cardBorder} rounded-sm text-sm px-4 py-2.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors pr-12 ${tc.textPrimary}`}
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 ${tc.hoverBg} rounded-lg transition-colors`}>{showOldPassword ? <EyeOff className={`w-5 h-5 ${tc.textTertiary}`} /> : <Eye className={`w-5 h-5 ${tc.textTertiary}`} />}</button>
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium ${tc.textPrimary} mb-2`}>{t('profile.security.newPassword')}</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.new_password}
                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                className={`w-full ${tc.hover} border ${tc.cardBorder} rounded-sm text-sm px-4 py-2.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors pr-12 ${tc.textPrimary}`}
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 ${tc.hoverBg} rounded-lg transition-colors`}>{showNewPassword ? <EyeOff className={`w-5 h-5 ${tc.textTertiary}`} /> : <Eye className={`w-5 h-5 ${tc.textTertiary}`} />}</button>
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium ${tc.textPrimary} mb-2`}>{t('profile.security.confirmNewPassword')}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwords.new_password_confirm}
                onChange={(e) => setPasswords({ ...passwords, new_password_confirm: e.target.value })}
                className={`w-full ${tc.hover} border ${tc.cardBorder} rounded-sm text-sm px-4 py-2.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors pr-12 ${tc.textPrimary}`}
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 ${tc.hoverBg} rounded-lg transition-colors`}>{showConfirmPassword ? <EyeOff className={`w-5 h-5 ${tc.textTertiary}`} /> : <Eye className={`w-5 h-5 ${tc.textTertiary}`} />}</button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 rounded-sm text-white font-medium flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50 transition-colors"
          >
            <Lock className="w-5 h-5" />
            {loading ? t('profile.buttons.changing') : t('profile.buttons.changePassword')}
          </button>
        </form>
      </div>
      <div className="space-y-6">
        <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-sm p-6`}>
          <h4 className={`text-sm font-semibold ${tc.textPrimary} mb-4 flex items-center gap-2`}><Shield className="w-4 h-4 text-rose-500" />{t('profile.tips.title')}</h4>
          <ul className={`space-y-3 text-sm ${tc.textSecondary}`}>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />{t('profile.tips.tip1')}</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />{t('profile.tips.tip2')}</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />{t('profile.tips.tip3')}</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />{t('profile.tips.tip4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Activity Tab Component
function ActivityTab({ user, tc, isLight }: { user: any; tc: ReturnType<typeof useThemeClasses>; isLight: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-sm p-6`}>
      <h3 className={`text-xl font-bold ${tc.textPrimary} mb-6 flex items-center gap-2`}><TrendingUp className="w-5 h-5 text-rose-500" />{t('profile.activity.title')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${tc.hover} border ${tc.cardBorder} rounded-sm p-4`}>
          <Award className="w-8 h-8 text-rose-500 mb-3" />
          <p className={`text-sm ${tc.textSecondary} mb-1`}>{t('profile.activity.level')}</p>
          <p className={`text-2xl font-bold ${tc.textPrimary} capitalize`}>{user.bot_type === 'premium' ? 'Premium' : user.bot_type === 'basic' ? 'Basic' : 'Standard'}</p>
        </div>
        <div className={`${tc.hover} border ${tc.cardBorder} rounded-sm p-4`}>
          <Calendar className="w-8 h-8 text-green-400 mb-3" />
          <p className={`text-sm ${tc.textSecondary} mb-1`}>{t('profile.activity.withUs')}</p>
          <p className={`text-2xl font-bold ${tc.textPrimary}`}>
            {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} {t('profile.activity.days')}
          </p>
        </div>
        <div className={`${tc.hover} border ${tc.cardBorder} rounded-sm p-4`}>
          <Shield className="w-8 h-8 text-yellow-400 mb-3" />
          <p className={`text-sm ${tc.textSecondary} mb-1`}>{t('profile.activity.verification')}</p>
          <p className={`text-2xl font-bold ${tc.textPrimary}`}>{user.is_verified ? t('profile.status.yes') : t('profile.status.no')}</p>
        </div>
      </div>
    </div>
  );
}