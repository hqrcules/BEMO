import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, clearError } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, AlertCircle, Loader2, TrendingUp, Shield, Award, Zap, Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'kk', name: 'Қазақша' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'cs', name: 'Čeština' },
];

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) {
      dispatch(clearError());
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  const quickLogin = (email: string, password: string) => {
    setFormData({ email, password });
    dispatch(loginUser({ email, password })).then((result) => {
      if (loginUser.fulfilled.match(result)) {
        navigate('/dashboard');
      }
    });
  };

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-success-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:block space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/50">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-gradient">Bemo Investment</h1>
                  <p className="text-dark-text-secondary text-sm">{t('auth.platformSlogan')}</p>
                </div>
              </div>
              <h2 className="text-5xl font-bold text-dark-text-primary leading-tight">
                {t('auth.hero.title1')}
                <br />
                <span className="text-gradient">{t('auth.hero.title2')}</span>
              </h2>
              <p className="text-lg text-dark-text-secondary">{t('auth.hero.subtitle')}</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 glass-card p-4 hover:border-primary-500/50 transition-all duration-300">
                <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center flex-shrink-0"><Shield className="w-6 h-6 text-primary-500" /></div>
                <div>
                  <h3 className="font-semibold text-dark-text-primary mb-1">{t('auth.features.security.title')}</h3>
                  <p className="text-sm text-dark-text-secondary">{t('auth.features.security.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 glass-card p-4 hover:border-success-500/50 transition-all duration-300">
                <div className="w-12 h-12 bg-success-500/10 rounded-xl flex items-center justify-center flex-shrink-0"><Zap className="w-6 h-6 text-success-500" /></div>
                <div>
                  <h3 className="font-semibold text-dark-text-primary mb-1">{t('auth.features.instantDeals.title')}</h3>
                  <p className="text-sm text-dark-text-secondary">{t('auth.features.instantDeals.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 glass-card p-4 hover:border-warning-500/50 transition-all duration-300">
                <div className="w-12 h-12 bg-warning-500/10 rounded-xl flex items-center justify-center flex-shrink-0"><Award className="w-6 h-6 text-warning-500" /></div>
                <div>
                  <h3 className="font-semibold text-dark-text-primary mb-1">{t('auth.features.provenPlatform.title')}</h3>
                  <p className="text-sm text-dark-text-secondary">{t('auth.features.provenPlatform.description')}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center"><div className="text-3xl font-bold text-gradient-success mb-1">1000+</div><div className="text-xs text-dark-text-secondary">{t('auth.stats.users')}</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-gradient mb-1">€2.5M</div><div className="text-xs text-dark-text-secondary">{t('auth.stats.volume')}</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-gradient-success mb-1">24/7</div><div className="text-xs text-dark-text-secondary">{t('auth.stats.support')}</div></div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="animate-slide-in">
            <div className="glass-card p-8 lg:p-10 max-w-md mx-auto relative">

              <div className="absolute top-4 right-4 z-20">
                <div className="relative group">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary pointer-events-none" />
                  <select
                    onChange={handleLanguageChange}
                    value={i18n.language}
                    className="pl-9 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-dark-text-secondary focus:outline-none focus:border-primary-500/50 appearance-none transition-colors cursor-pointer"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/50"><TrendingUp className="w-7 h-7 text-white" /></div>
                <h1 className="text-3xl font-bold text-gradient">Bemo Investment</h1>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-dark-text-primary mb-2">{t('auth.welcomeTitle')}</h2>
                <p className="text-dark-text-secondary">{t('auth.welcomeSubtitle')}</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-danger-500 font-medium">{t('auth.errorTitle')}</p>
                    <p className="text-sm text-danger-500/80 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-dark-text-primary mb-2">{t('auth.emailLabel')}</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text-tertiary group-focus-within:text-primary-500 transition-colors" />
                    <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="input-field pl-12" placeholder="your@email.com" disabled={isLoading} />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-dark-text-primary mb-2">{t('auth.passwordLabel')}</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text-tertiary group-focus-within:text-primary-500 transition-colors" />
                    <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="input-field pl-12" placeholder="••••••••" disabled={isLoading} />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full btn-primary py-4 text-base font-semibold">
                  {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />{t('auth.loggingIn')}</>) : (<>{t('auth.loginButton')}<TrendingUp className="w-5 h-5" /></>)}
                </button>
              </form>

              <div className="mt-8 p-5 bg-primary-500/5 border border-primary-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-primary-500" />
                  <p className="text-sm font-semibold text-dark-text-primary">{t('auth.demo.title')}</p>
                </div>
                <div className="space-y-2">
                  <button onClick={() => quickLogin('client1@exchange.com', 'Pass123!')} disabled={isLoading} className="w-full text-left px-4 py-3 bg-dark-card hover:bg-dark-hover rounded-lg transition-all duration-200 group border border-dark-border hover:border-primary-500/50">
                    <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-dark-text-primary group-hover:text-primary-500 transition-colors">Client One</p><p className="text-xs text-dark-text-tertiary mt-0.5">Basic Bot • €250</p></div><div className="badge-success">Basic</div></div>
                  </button>
                  <button onClick={() => quickLogin('client2@exchange.com', 'Pass123!')} disabled={isLoading} className="w-full text-left px-4 py-3 bg-dark-card hover:bg-dark-hover rounded-lg transition-all duration-200 group border border-dark-border hover:border-success-500/50">
                    <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-dark-text-primary group-hover:text-success-500 transition-colors">Client Two</p><p className="text-xs text-dark-text-tertiary mt-0.5">Premium Bot • €500 • Verified</p></div><div className="badge bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">Premium</div></div>
                  </button>
                  <button onClick={() => quickLogin('demo@exchange.com', 'demo123')} disabled={isLoading} className="w-full text-left px-4 py-3 bg-dark-card hover:bg-dark-hover rounded-lg transition-all duration-200 group border border-dark-border hover:border-dark-text-secondary/50">
                    <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-dark-text-primary group-hover:text-dark-text-secondary transition-colors">Demo User</p><p className="text-xs text-dark-text-tertiary mt-0.5">No Bot • €0</p></div><div className="badge bg-dark-hover text-dark-text-secondary border-dark-border">Demo</div></div>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-dark-text-tertiary mt-6">{t('auth.footer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}