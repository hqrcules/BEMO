import { useNavigate } from 'react-router-dom';
import { Zap, Shield, TrendingUp, Crown } from 'lucide-react';

const botTypes = [
  {
    name: 'Basic Bot',
    price: '€250',
    description: 'Идеально подходит для начинающих. Использует стратегию скальпинга для быстрых, низкорискованных сделок.',
    features: [
      'Стратегия: Скальпинг',
      'Низкий риск',
      'До 15 сделок в день',
      'Торгуемые пары: BTC/USDT, ETH/USDT',
    ],
    icon: <Shield className="w-8 h-8 text-blue-400" />,
    color: 'blue',
  },
  {
    name: 'Premium Bot',
    price: '€500',
    description: 'Для более опытных трейдеров. Применяет свинг-трейдинг для получения прибыли от среднесрочных колебаний рынка.',
    features: [
      'Стратегия: Свинг-трейдинг',
      'Умеренный риск',
      'До 25 сделок в день',
      'Расширенный список торговых пар',
    ],
    icon: <Zap className="w-8 h-8 text-purple-400" />,
    color: 'purple',
  },
  {
    name: 'Specialist Bot',
    price: '€1000',
    description: 'Максимальная производительность. Использует трендовые стратегии для получения высокой прибыли на волатильном рынке.',
    features: [
      'Стратегия: Следование за трендом',
      'Высокий потенциал прибыли',
      'До 40 сделок в день',
      'Все доступные торговые пары',
    ],
    icon: <Crown className="w-8 h-8 text-yellow-400" />,
    color: 'yellow',
  },
];

export default function BotInfo() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-dark-text-primary mb-2">
          Активируйте своего торгового бота
        </h2>
        <p className="text-dark-text-secondary max-w-2xl mx-auto">
          Наши боты используют передовые алгоритмы для автоматической торговли
          на рынке криптовалют 24/7. Выберите подходящий для вас пакет, чтобы
          начать получать пассивный доход.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {botTypes.map((bot) => (
          <div
            key={bot.name}
            className={`glass-card p-6 border-2 border-dark-border hover:border-${bot.color}-500/50 transition-all transform hover:-translate-y-1`}
          >
            <div className="flex items-center gap-4 mb-4">
              {bot.icon}
              <h3 className={`text-2xl font-bold text-${bot.color}-400`}>
                {bot.name}
              </h3>
            </div>
            <p className="text-3xl font-bold text-dark-text-primary mb-4">
              {bot.price}
            </p>
            <p className="text-sm text-dark-text-secondary mb-6 h-12">
              {bot.description}
            </p>
            <ul className="space-y-3 mb-8">
              {bot.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-dark-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/balance', { state: { openDepositModal: true } })}
              className={`w-full btn bg-gradient-to-r from-${bot.color}-500 to-${bot.color}-600 text-white`}
            >
              Активировать
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}