import { Link } from 'react-router-dom';
import { Twitter, Send, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';

export default function Footer() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const tc = useThemeClasses();

    return (
        <footer className={`${tc.cardBg} border-t ${tc.cardBorder}`}>
            <div className="max-w-8xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    <div className="space-y-4">
                        <div
                            className="flex items-center gap-2 cursor-pointer group w-fit"
                            onClick={() => navigate('/')}
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-glow-primary transition-shadow duration-300">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <span className={`${tc.textPrimary} font-bold text-lg`}>
                                Bemo Investment
                            </span>
                        </div>
                        <p className={`text-sm ${tc.textSecondary} leading-relaxed`}>
                            {t('footer.description', 'Leading platform for cryptocurrency trading and investment. Secure, fast, and user-friendly.')}
                        </p>
                        <p className={`text-sm ${tc.textSecondary}`}>
                            © {currentYear} Bemo Investment.<br /> {t('footer.rightsReserved', 'All rights reserved.')}
                        </p>
                         <div className={`text-xs ${tc.textTertiary} pt-2`}>
                            {t('footer.licenseInfo', 'Bemo Investment Firm Ltd is regulated by the Dubai Financial Services Authority (DFSA). Reference number F007996.')}
                            <a
                                href="https://www.dfsa.ae/public-register/firms/bemo-investment-firm-ltd"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`underline ${tc.hoverText} transition ml-1`}
                            >
                                {t('footer.verifyLicense', 'Verify license')}
                            </a>
                        </div>
                    </div>

                    <div className="md:col-start-2">
                        <h4 className={`text-base font-medium ${tc.textPrimary} mb-4`}>{t('footer.quickLinks', 'Quick Links')}</h4>
                        <ul className="space-y-3">
                            <li><Link to="/" className={`text-sm ${tc.textSecondary} ${tc.hoverText} transition`}>{t('nav.home', 'Home')}</Link></li>
                            <li><Link to="/trading" className={`text-sm ${tc.textSecondary} ${tc.hoverText} transition`}>{t('nav.market', 'Market')}</Link></li>
                             <li><Link to="/bot-trading" className={`text-sm ${tc.textSecondary} ${tc.hoverText} transition`}>{t('nav.botTrading', 'Bot Trading')}</Link></li>
                            <li><Link to="/balance" className={`text-sm ${tc.textSecondary} ${tc.hoverText} transition`}>{t('nav.balance', 'Balance')}</Link></li>
                            <li><Link to="/support" className={`text-sm ${tc.textSecondary} ${tc.hoverText} transition`}>{t('footer.support', 'Support')}</Link></li>
                            <li><Link to="/faq" className={`text-sm ${tc.textSecondary} ${tc.hoverText} transition`}>{t('footer.faq', 'FAQ')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className={`text-base font-medium ${tc.textPrimary} mb-4`}>{t('footer.legal', 'Legal')}</h4>
                        <ul className="space-y-3">
                            <li><Link to="/terms-of-service" className={`text-sm ${tc.textSecondary} ${tc.hoverText} transition`}>{t('footer.terms', 'Terms of Service')}</Link></li>
                            <li><Link to="/privacy-policy" className={`text-sm ${tc.textSecondary} ${tc.hoverText} transition`}>{t('footer.privacy', 'Privacy Policy')}</Link></li>
                            <li><Link to="/cookie-policy" className={`text-sm ${tc.textSecondary} ${tc.hoverText} transition`}>{t('footer.cookies', 'Cookie Policy')}</Link></li>
                            <li><Link to="/aml-policy" className={`text-sm ${tc.textSecondary} ${tc.hoverText} transition`}>{t('footer.aml', 'AML Policy')}</Link></li>
                            <li><Link to="/risk-disclaimer" className={`text-sm ${tc.textSecondary} ${tc.hoverText} transition`}>{t('footer.risk', 'Risk Disclaimer')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className={`text-base font-medium ${tc.textPrimary} mb-4`}>{t('footer.followUs', 'Follow Us')}</h4>
                        <div className="flex items-center gap-4">
                            <a
                                href="https://x.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${tc.textSecondary} hover:text-primary-500 transition`}
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="https://telegram.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${tc.textSecondary} hover:text-primary-500 transition`}
                                aria-label="Telegram"
                            >
                                <Send className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}