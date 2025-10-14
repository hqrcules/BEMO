import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { profileService } from '@/services/profileService';
import { fetchUserProfile } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';
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
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile');

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-to-br from-primary-500/10 via-transparent to-success-500/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/50">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-dark-text-primary mb-1">
                {user.full_name || t('profile.defaultUser')}
              </h1>
              <p className="text-dark-text-secondary flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>
          </div>
          {user.is_verified && (
            <div className="flex items-center gap-2 px-4 py-2 bg-success-500/10 border border-success-500/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-success-500" />
              <span className="text-sm font-semibold text-success-500">{t('profile.verified')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'nav-pill-active' : 'nav-pill-inactive'}
        >
          <User className="w-4 h-4" />
          {t('profile.tabs.profile')}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={activeTab === 'security' ? 'nav-pill-active' : 'nav-pill-inactive'}
        >
          <Lock className="w-4 h-4" />
          {t('profile.tabs.security')}
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={activeTab === 'activity' ? 'nav-pill-active' : 'nav-pill-inactive'}
        >
          <TrendingUp className="w-4 h-4" />
          {t('profile.tabs.activity')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'profile' && <ProfileTab user={user} dispatch={dispatch} />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'activity' && <ActivityTab user={user} />}
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ user, dispatch }: { user: any; dispatch: any }) {
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
    } catch (err: any) {
      setError(err.response?.data?.message || t('profile.messages.profileUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card p-6">
        <h3 className="text-xl font-bold text-dark-text-primary mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary-500" />
          {t('profile.accountInfo.title')}
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {success && (
            <div className="p-4 bg-success-500/10 border border-success-500/20 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-success-500">{success}</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger-500">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('profile.accountInfo.emailLabel')}</label>
            <input type="email" value={user.email} disabled className="input-field bg-dark-hover cursor-not-allowed" />
            <p className="text-xs text-dark-text-tertiary mt-2">{t('profile.accountInfo.emailHint')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('profile.accountInfo.fullNameLabel')}</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" placeholder={t('profile.accountInfo.fullNamePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('profile.accountInfo.userIdLabel')}</label>
            <input type="text" value={user.id} disabled className="input-field bg-dark-hover cursor-not-allowed font-mono text-sm" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="w-5 h-5" />
            {loading ? t('profile.buttons.saving') : t('profile.buttons.save')}
          </button>
        </form>
      </div>
      <div className="space-y-6">
        <div className="glass-card p-6">
          <h4 className="text-sm font-semibold text-dark-text-secondary mb-4">{t('profile.status.title')}</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-text-secondary">{t('profile.status.verification')}</span>
              {user.is_verified ? (
                <div className="flex items-center gap-1 text-success-500 text-sm font-medium"><CheckCircle className="w-4 h-4" />{t('profile.status.yes')}</div>
              ) : (
                <div className="flex items-center gap-1 text-warning-500 text-sm font-medium"><XCircle className="w-4 h-4" />{t('profile.status.no')}</div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-text-secondary">{t('profile.status.botType')}</span>
              <span className="text-sm font-semibold text-dark-text-primary capitalize">{user.bot_type === 'none' ? t('profile.status.no') : user.bot_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-text-secondary">{t('profile.status.balance')}</span>
              <span className="text-sm font-bold text-primary-500">€{parseFloat(user.balance).toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <h4 className="text-sm font-semibold text-dark-text-secondary mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" />{t('profile.dates.title')}</h4>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-dark-text-tertiary mb-1">{t('profile.dates.registration')}</p>
              <p className="text-sm font-medium text-dark-text-primary">{new Date(user.created_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            {user.last_login && (
              <div>
                <p className="text-xs text-dark-text-tertiary mb-1">{t('profile.dates.lastLogin')}</p>
                <p className="text-sm font-medium text-dark-text-primary">{new Date(user.last_login).toLocaleString(i18n.language, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Security Tab Component
function SecurityTab() {
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
      <div className="lg:col-span-2 glass-card p-6">
        <h3 className="text-xl font-bold text-dark-text-primary mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-primary-500" />{t('profile.security.title')}</h3>
        <form onSubmit={handleChangePassword} className="space-y-6">
          {success && <div className="p-4 bg-success-500/10 border border-success-500/20 rounded-xl flex items-start gap-3"><CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" /><p className="text-sm text-success-500">{success}</p></div>}
          {error && <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl flex items-start gap-3"><AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" /><p className="text-sm text-danger-500">{error}</p></div>}
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('profile.security.currentPassword')}</label>
            <div className="relative">
              <input type={showOldPassword ? 'text' : 'password'} value={passwords.old_password} onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })} className="input-field pr-12" placeholder="••••••••" required />
              <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-dark-hover rounded-lg transition-colors">{showOldPassword ? <EyeOff className="w-5 h-5 text-dark-text-tertiary" /> : <Eye className="w-5 h-5 text-dark-text-tertiary" />}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('profile.security.newPassword')}</label>
            <div className="relative">
              <input type={showNewPassword ? 'text' : 'password'} value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} className="input-field pr-12" placeholder="••••••••" required />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-dark-hover rounded-lg transition-colors">{showNewPassword ? <EyeOff className="w-5 h-5 text-dark-text-tertiary" /> : <Eye className="w-5 h-5 text-dark-text-tertiary" />}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('profile.security.confirmNewPassword')}</label>
            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} value={passwords.new_password_confirm} onChange={(e) => setPasswords({ ...passwords, new_password_confirm: e.target.value })} className="input-field pr-12" placeholder="••••••••" required />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-dark-hover rounded-lg transition-colors">{showConfirmPassword ? <EyeOff className="w-5 h-5 text-dark-text-tertiary" /> : <Eye className="w-5 h-5 text-dark-text-tertiary" />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary"><Lock className="w-5 h-5" />{loading ? t('profile.buttons.changing') : t('profile.buttons.changePassword')}</button>
        </form>
      </div>
      <div className="space-y-6">
        <div className="glass-card p-6">
          <h4 className="text-sm font-semibold text-dark-text-primary mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-primary-500" />{t('profile.tips.title')}</h4>
          <ul className="space-y-3 text-sm text-dark-text-secondary">
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('profile.tips.tip1')}</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('profile.tips.tip2')}</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('profile.tips.tip3')}</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('profile.tips.tip4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Activity Tab Component
function ActivityTab({ user }: { user: any }) {
  const { t } = useTranslation();
  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold text-dark-text-primary mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-500" />{t('profile.activity.title')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <Award className="w-8 h-8 text-primary-500 mb-3" />
          <p className="text-sm text-dark-text-secondary mb-1">{t('profile.activity.level')}</p>
          <p className="text-2xl font-bold text-dark-text-primary capitalize">{user.bot_type === 'premium' ? 'Premium' : user.bot_type === 'basic' ? 'Basic' : 'Standard'}</p>
        </div>
        <div className="stat-card">
          <Calendar className="w-8 h-8 text-success-500 mb-3" />
          <p className="text-sm text-dark-text-secondary mb-1">{t('profile.activity.withUs')}</p>
          <p className="text-2xl font-bold text-dark-text-primary">
            {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} {t('profile.activity.days')}
          </p>
        </div>
        <div className="stat-card">
          <Shield className="w-8 h-8 text-warning-500 mb-3" />
          <p className="text-sm text-dark-text-secondary mb-1">{t('profile.activity.verification')}</p>
          <p className="text-2xl font-bold text-dark-text-primary">{user.is_verified ? t('profile.status.yes') : t('profile.status.no')}</p>
        </div>
      </div>
    </div>
  );
}