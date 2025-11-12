import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { profileService } from '@/services/profileService';
import { fetchUserProfile } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';
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
} from 'lucide-react';

export default function ProfilePage() {
  const { t } = useTranslation();
  const tc = useThemeClasses();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile');

  if (!user) return null;

  return (
    <div className={`min-h-screen ${tc.bg} ${tc.textPrimary}`}>
      <div className="max-w-8xl mx-auto">

        {/* --- Header + Tabs --- */}
        <div className={`w-full border-b ${tc.border} ${tc.cardBg} backdrop-blur-sm`}>
          {/* Header Content */}
          <div className="w-full px-6 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/50">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl sm:text-4xl font-extralight ${tc.textPrimary} tracking-tight mb-1`}>
                    {user.full_name || t('profile.defaultUser')}
                  </h1>
                  <p className={`${tc.textTertiary} font-light flex items-center gap-2`}>
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
              </div>
              {user.is_verified && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-950 border border-green-800 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">{t('profile.verified')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="w-full px-6">
            <div className={`flex items-center gap-1 border-b ${tc.border}`}>
              <TabButton
                label={t('profile.tabs.profile')}
                icon={<User className="w-4 h-4" />}
                isActive={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
                tc={tc}
              />
              <TabButton
                label={t('profile.tabs.security')}
                icon={<Lock className="w-4 h-4" />}
                isActive={activeTab === 'security'}
                onClick={() => setActiveTab('security')}
                tc={tc}
              />
              <TabButton
                label={t('profile.tabs.activity')}
                icon={<TrendingUp className="w-4 h-4" />}
                isActive={activeTab === 'activity'}
                onClick={() => setActiveTab('activity')}
                tc={tc}
              />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full px-6 py-8">
          <div className="animate-fade-in">
            {activeTab === 'profile' && <ProfileTab user={user} dispatch={useAppDispatch()} tc={tc} />}
            {activeTab === 'security' && <SecurityTab tc={tc} />}
            {activeTab === 'activity' && <ActivityTab user={user} tc={tc} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// TabButton Component
function TabButton({ label, icon, isActive, onClick, tc }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void, tc: any }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3.5 font-medium text-sm transition-colors duration-200 relative -mb-px ${
        isActive ? tc.textPrimary : `${tc.textTertiary} ${tc.hoverText}`
      }`}
    >
      {icon}
      {label}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${tc.textPrimary === 'text-white' ? 'bg-white' : 'bg-gray-900'} transition-all duration-300 ease-out ${
        isActive ? 'scale-x-100' : 'scale-x-0'
      }`} />
    </button>
  );
}


// Profile Tab Component
function ProfileTab({ user, dispatch, tc }: { user: any; dispatch: any; tc: ReturnType<typeof useThemeClasses> }) {
  const { t, i18n } = useTranslation();
  const [fullName, setFullName] = useState(user.full_name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await profileService.updateProfile({ full_name: fullName });
      await dispatch(fetchUserProfile());
      setSuccess(t('profile.messages.profileUpdateSuccess'));
    } catch (err: any) { // --- ВИПРАВЛЕНО ТУТ ---
      setError(err.response?.data?.message || t('profile.messages.profileUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={`lg:col-span-2 ${tc.cardBg} border ${tc.cardBorder} rounded-3xl p-6`}>
        <h3 className={`text-xl font-bold ${tc.textPrimary} mb-6 flex items-center gap-2`}>
          <Settings className="w-5 h-5 text-primary-500" />
          {t('profile.accountInfo.title')}
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {success && (
            <div className="p-4 bg-green-950 border border-green-800 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-950 border border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          <div>
            <label className={`block text-sm font-medium ${tc.textPrimary} mb-2`}>{t('profile.accountInfo.emailLabel')}</label>
            <input type="email" value={user.email} disabled className={`w-full ${tc.cardBg} border ${tc.cardBorder} rounded-xl text-sm px-4 py-2.5 cursor-not-allowed ${tc.textPrimary}`} />
            <p className={`text-xs ${tc.textTertiary} mt-2`}>{t('profile.accountInfo.emailHint')}</p>
          </div>
          <div>
            <label className={`block text-sm font-medium ${tc.textPrimary} mb-2`}>{t('profile.accountInfo.fullNameLabel')}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full ${tc.hover} border ${tc.cardBorder} rounded-xl text-sm px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors ${tc.textPrimary}`}
              placeholder={t('profile.accountInfo.fullNamePlaceholder')}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${tc.textPrimary} mb-2`}>{t('profile.accountInfo.userIdLabel')}</label>
            <input type="text" value={user.id} disabled className={`w-full ${tc.cardBg} border ${tc.cardBorder} rounded-xl text-sm px-4 py-2.5 cursor-not-allowed font-mono ${tc.textPrimary}`} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50 transition-colors"
          >
            <Save className="w-5 h-5" />
            {loading ? t('profile.buttons.saving') : t('profile.buttons.save')}
          </button>
        </form>
      </div>
      <div className="space-y-6">
        <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl p-6`}>
          <h4 className={`text-sm font-semibold ${tc.textSecondary} mb-4`}>{t('profile.status.title')}</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${tc.textSecondary}`}>{t('profile.status.verification')}</span>
              {user.is_verified ? (
                <div className="flex items-center gap-1 text-green-400 text-sm font-medium"><CheckCircle className="w-4 h-4" />{t('profile.status.yes')}</div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium"><XCircle className="w-4 h-4" />{t('profile.status.no')}</div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${tc.textSecondary}`}>{t('profile.status.botType')}</span>
              <span className={`text-sm font-semibold ${tc.textPrimary} capitalize`}>{user.bot_type === 'none' ? t('profile.status.no') : user.bot_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${tc.textSecondary}`}>{t('profile.status.balance')}</span>
              <span className="text-sm font-bold text-primary-500">€{parseFloat(user.balance).toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl p-6`}>
          <h4 className={`text-sm font-semibold ${tc.textSecondary} mb-4 flex items-center gap-2`}><Calendar className="w-4 h-4" />{t('profile.dates.title')}</h4>
          <div className="space-y-3">
            <div>
              <p className={`text-xs ${tc.textTertiary} mb-1`}>{t('profile.dates.registration')}</p>
              <p className={`text-sm font-medium ${tc.textPrimary}`}>{new Date(user.created_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            {user.last_login && (
              <div>
                <p className={`text-xs ${tc.textTertiary} mb-1`}>{t('profile.dates.lastLogin')}</p>
                <p className={`text-sm font-medium ${tc.textPrimary}`}>{new Date(user.last_login).toLocaleString(i18n.language, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Security Tab Component
function SecurityTab({ tc }: { tc: ReturnType<typeof useThemeClasses> }) {
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
      <div className={`lg:col-span-2 ${tc.cardBg} border ${tc.cardBorder} rounded-3xl p-6`}>
        <h3 className={`text-xl font-bold ${tc.textPrimary} mb-6 flex items-center gap-2`}><Lock className="w-5 h-5 text-primary-500" />{t('profile.security.title')}</h3>
        <form onSubmit={handleChangePassword} className="space-y-6">
          {success && <div className="p-4 bg-green-950 border border-green-800 rounded-xl flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-green-400">{success}</p></div>}
          {error && <div className="p-4 bg-red-950 border border-red-800 rounded-xl flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-400">{error}</p></div>}
          <div>
            <label className={`block text-sm font-medium ${tc.textPrimary} mb-2`}>{t('profile.security.currentPassword')}</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={passwords.old_password}
                onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                className={`w-full ${tc.hover} border ${tc.cardBorder} rounded-xl text-sm px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors pr-12 ${tc.textPrimary}`}
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
                className={`w-full ${tc.hover} border ${tc.cardBorder} rounded-xl text-sm px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors pr-12 ${tc.textPrimary}`}
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
                className={`w-full ${tc.hover} border ${tc.cardBorder} rounded-xl text-sm px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors pr-12 ${tc.textPrimary}`}
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 ${tc.hoverBg} rounded-lg transition-colors`}>{showConfirmPassword ? <EyeOff className={`w-5 h-5 ${tc.textTertiary}`} /> : <Eye className={`w-5 h-5 ${tc.textTertiary}`} />}</button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50 transition-colors"
          >
            <Lock className="w-5 h-5" />
            {loading ? t('profile.buttons.changing') : t('profile.buttons.changePassword')}
          </button>
        </form>
      </div>
      <div className="space-y-6">
        <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl p-6`}>
          <h4 className={`text-sm font-semibold ${tc.textPrimary} mb-4 flex items-center gap-2`}><Shield className="w-4 h-4 text-primary-500" />{t('profile.tips.title')}</h4>
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
function ActivityTab({ user, tc }: { user: any; tc: ReturnType<typeof useThemeClasses> }) {
  const { t } = useTranslation();
  return (
    <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl p-6`}>
      <h3 className={`text-xl font-bold ${tc.textPrimary} mb-6 flex items-center gap-2`}><TrendingUp className="w-5 h-5 text-primary-500" />{t('profile.activity.title')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${tc.hover} border ${tc.cardBorder} rounded-2xl p-4`}>
          <Award className="w-8 h-8 text-primary-500 mb-3" />
          <p className={`text-sm ${tc.textSecondary} mb-1`}>{t('profile.activity.level')}</p>
          <p className={`text-2xl font-bold ${tc.textPrimary} capitalize`}>{user.bot_type === 'premium' ? 'Premium' : user.bot_type === 'basic' ? 'Basic' : 'Standard'}</p>
        </div>
        <div className={`${tc.hover} border ${tc.cardBorder} rounded-2xl p-4`}>
          <Calendar className="w-8 h-8 text-green-400 mb-3" />
          <p className={`text-sm ${tc.textSecondary} mb-1`}>{t('profile.activity.withUs')}</p>
          <p className={`text-2xl font-bold ${tc.textPrimary}`}>
            {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} {t('profile.activity.days')}
          </p>
        </div>
        <div className={`${tc.hover} border ${tc.cardBorder} rounded-2xl p-4`}>
          <Shield className="w-8 h-8 text-yellow-400 mb-3" />
          <p className={`text-sm ${tc.textSecondary} mb-1`}>{t('profile.activity.verification')}</p>
          <p className={`text-2xl font-bold ${tc.textPrimary}`}>{user.is_verified ? t('profile.status.yes') : t('profile.status.no')}</p>
        </div>
      </div>
    </div>
  );
}