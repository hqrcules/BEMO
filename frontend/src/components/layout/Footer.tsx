import { TrendingUp, Mail, MessageSquare, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-card border-t border-dark-border">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-dark-text-primary">Bemo Investment</h3>
                <p className="text-xs text-dark-text-tertiary">Firm LTD</p>
              </div>
            </div>
            <p className="text-sm text-dark-text-secondary">
              Профессиональная платформа для криптовалютной торговли
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-dark-text-primary mb-4">Быстрые ссылки</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-dark-text-secondary hover:text-primary-500 transition-colors">
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-dark-text-secondary hover:text-primary-500 transition-colors">
                  Войти
                </Link>
              </li>
              <li>
                <a href="/#about" className="text-sm text-dark-text-secondary hover:text-primary-500 transition-colors">
                  О нас
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-dark-text-primary mb-4">Поддержка</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard/support" className="text-sm text-dark-text-secondary hover:text-primary-500 transition-colors flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Чат поддержки
                </Link>
              </li>
              <li>
                <a href="mailto:support@bemo-investment.com" className="text-sm text-dark-text-secondary hover:text-primary-500 transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-dark-text-primary mb-4">Правовая информация</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-dark-text-secondary hover:text-primary-500 transition-colors flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Политика конфиденциальности
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-dark-text-secondary hover:text-primary-500 transition-colors">
                  Условия использования
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-dark-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-dark-text-tertiary text-center md:text-left">
              © {currentYear} Bemo Investment Firm LTD. Все права защищены.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-dark-text-tertiary">Работаем 24/7</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-success-500 font-medium">Онлайн</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
