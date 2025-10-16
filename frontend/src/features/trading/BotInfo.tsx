import { CheckCircle, Bot, TrendingUp, Shield, Bell } from 'lucide-react';

export default function BotInfo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-dark-surface/20 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="glass-card p-8">
          <Bot className="w-24 h-24 text-primary-500 mx-auto mb-6" />

          <h1 className="text-3xl font-bold text-dark-text-primary mb-4">
            Торговельний бот недоступний
          </h1>

          <p className="text-dark-text-secondary mb-8 text-lg">
            Для доступу до автоматичної торгівлі вам потрібно активувати торговельного бота.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center p-4 bg-dark-surface/50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
              <h3 className="font-semibold text-dark-text-primary mb-1">Автоматичні угоди</h3>
              <p className="text-sm text-dark-text-secondary text-center">24/7 торгівля без вашої участі</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-dark-surface/50 rounded-lg">
              <Shield className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className="font-semibold text-dark-text-primary mb-1">Керування ризиком</h3>
              <p className="text-sm text-dark-text-secondary text-center">Автоматичний стоп-лосс і тейк-профіт</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-dark-surface/50 rounded-lg">
              <Bell className="w-8 h-8 text-yellow-500 mb-2" />
              <h3 className="font-semibold text-dark-text-primary mb-1">Сповіщення</h3>
              <p className="text-sm text-dark-text-secondary text-center">Миттєві оповіщення про угоди</p>
            </div>
          </div>

          <div className="space-y-4">
            <button className="w-full py-3 px-6 bg-gradient-to-r from-primary-600 to-primary-500
                             hover:from-primary-700 hover:to-primary-600 text-white font-semibold
                             rounded-lg transition-all duration-300 transform hover:scale-105
                             shadow-lg hover:shadow-xl">
              Активувати базовий бот
            </button>

            <button className="w-full py-3 px-6 bg-dark-surface border border-primary-500/50
                             text-primary-500 font-semibold rounded-lg transition-colors
                             hover:bg-primary-500/10">
              Обрати стратегію
            </button>
          </div>

          <div className="mt-8 p-4 bg-dark-card/50 rounded-lg border border-dark-border/50">
            <h4 className="font-semibold text-dark-text-primary mb-2">Доступні стратегії:</h4>
            <div className="space-y-2 text-sm text-dark-text-secondary">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Базова стратегія - безкоштовно</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                <span>Преміум стратегія - підвищена прибутковість</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                <span>Спеціаліст стратегія - максимальний контроль</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
