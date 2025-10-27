import { useState, FormEvent, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, clearError } from '@/store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, AlertCircle, Loader2, TrendingUp, Shield, Award, Zap, Globe, ChevronDown } from 'lucide-react';

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

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleLangSelect = (code: string) => {
    i18n.changeLanguage(code);
    setIsLangDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-success-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/05 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
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
                  <h1 className="text-4xl font-black text-primary-500">Bemo Investment</h1>
                  <p className="text-dark-text-secondary text-sm">{t('auth.platformSlogan')}</p>
                </div>
              </div>
              <h2 className="text-5xl font-bold text-dark-text-primary leading-tight">
                {t('auth.hero.title1')}
                <br />
                <span className="text-primary-500">{t('auth.hero.title2')}</span>
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
              <div className="text-center"><div className="text-3xl font-bold text-success-500 mb-1">1000+</div><div className="text-xs text-dark-text-secondary">{t('auth.stats.users')}</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-primary-500 mb-1">€2.5M</div><div className="text-xs text-dark-text-secondary">{t('auth.stats.volume')}</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-success-500 mb-1">24/7</div><div className="text-xs text-dark-text-secondary">{t('auth.stats.support')}</div></div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="animate-slide-in">
            <div className="glass-card p-8 lg:p-10 max-w-md mx-auto relative">

              {/* === MODIFIED LANGUAGE SELECTOR === */}
              <div className="absolute top-4 right-4 z-20">
                <div className="relative" ref={langDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                    className="pl-9 pr-4 py-2 bg-dark-card border border-dark-border/50 rounded-lg text-sm text-dark-text-secondary focus:outline-none focus:border-primary-500/50 transition-colors cursor-pointer hover:border-dark-border w-full flex items-center justify-between gap-2"
                  >
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary pointer-events-none" />
                    <span className="truncate">
                      {languages.find(l => l.code === i18n.language)?.name}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-dark-text-tertiary flex-shrink-0 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                  </button>

                  {isLangDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-lg overflow-y-auto max-h-60 z-30 animate-fade-in">
                      <ul className="py-1">
                        {languages.map(lang => (
                          <li
                            key={lang.code}
                            onClick={() => handleLangSelect(lang.code)}
                            className="px-4 py-2 text-sm text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text-primary cursor-pointer transition-colors"
                          >
                            {lang.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              {/* === END MODIFIED BLOCK === */}

              <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/50"><TrendingUp className="w-7 h-7 text-white" /></div>
                <h1 className="text-3xl font-bold text-primary-500">Bemo Investment</h1>
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
            </div>

            <p className="text-center text-sm text-dark-text-tertiary mt-6">{t('auth.footer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}