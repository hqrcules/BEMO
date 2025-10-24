import { Link } from 'react-router-dom';
import { Twitter, Send, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-dark-card border-t border-dark-border">
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
                            <span className="text-dark-text-primary font-bold text-lg">
                                Bemo Investment
                            </span>
                        </div>
                        <p className="text-sm text-dark-text-secondary leading-relaxed">
                            {t('footer.description', 'Leading platform for cryptocurrency trading and investment. Secure, fast, and user-friendly.')}
                        </p>
                        <p className="text-sm text-dark-text-secondary">
                            © {currentYear} Bemo Investment.<br /> {t('footer.rightsReserved', 'All rights reserved.')}
                        </p>
                         <div className="text-xs text-dark-text-tertiary pt-2">
                            {t('footer.licenseInfo', 'Bemo Investment Firm Ltd is regulated by the Dubai Financial Services Authority (DFSA). Reference number F007996.')}
                            <a
                                href="https://www.dfsa.ae/public-register/firms/bemo-investment-firm-ltd"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-dark-text-secondary transition ml-1"
                            >
                                {t('footer.verifyLicense', 'Verify license')}
                            </a>
                        </div>
                    </div>

                    <div className="md:col-start-2">
                        <h4 className="text-base font-medium text-dark-text-primary mb-4">{t('footer.quickLinks', 'Quick Links')}</h4>
                        <ul className="space-y-3">
                            <li><Link to="/" className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition">{t('nav.home', 'Home')}</Link></li>
                            <li><Link to="/trading" className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition">{t('nav.market', 'Market')}</Link></li>
                             <li><Link to="/bot-trading" className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition">{t('nav.botTrading', 'Bot Trading')}</Link></li>
                            <li><Link to="/balance" className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition">{t('nav.balance', 'Balance')}</Link></li>
                            <li><Link to="/support" className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition">{t('footer.support', 'Support')}</Link></li>
                            <li><Link to="/faq" className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition">{t('footer.faq', 'FAQ')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-base font-medium text-dark-text-primary mb-4">{t('footer.legal', 'Legal')}</h4>
                        <ul className="space-y-3">
                            <li><Link to="/terms-of-service" className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition">{t('footer.terms', 'Terms of Service')}</Link></li>
                            <li><Link to="/privacy-policy" className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition">{t('footer.privacy', 'Privacy Policy')}</Link></li>
                            <li><Link to="/cookie-policy" className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition">{t('footer.cookies', 'Cookie Policy')}</Link></li>
                            <li><Link to="/aml-policy" className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition">{t('footer.aml', 'AML Policy')}</Link></li>
                            <li><Link to="/risk-disclaimer" className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition">{t('footer.risk', 'Risk Disclaimer')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-base font-medium text-dark-text-primary mb-4">{t('footer.followUs', 'Follow Us')}</h4>
                        <div className="flex items-center gap-4">
                            <a
                                href="https://x.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-dark-text-secondary hover:text-primary-500 transition"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="https://telegram.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-dark-text-secondary hover:text-primary-500 transition"
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