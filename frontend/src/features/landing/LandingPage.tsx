import { useNavigate } from 'react-router-dom';
import { TrendingUp, Shield, Zap, Award, DollarSign, Users, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Безопасность',
      description: 'Защита средств с использованием банковского уровня шифрования',
      color: 'primary',
    },
    {
      icon: Zap,
      title: 'Мгновенные сделки',
      description: 'Торговый бот работает 24/7 для максимальной прибыли',
      color: 'success',
    },
    {
      icon: Award,
      title: 'Проверенная платформа',
      description: 'Более 1000+ активных пользователей по всему миру',
      color: 'warning',
    },
    {
      icon: BarChart3,
      title: 'Профессиональные инструменты',
      description: 'Продвинутые графики и аналитика для успешной торговли',
      color: 'primary',
    },
  ];

  const stats = [
    { icon: Users, value: '1,000+', label: 'Активных пользователей' },
    { icon: DollarSign, value: '€2.5M', label: 'Торговый объем' },
    { icon: TrendingUp, value: '24/7', label: 'Поддержка клиентов' },
    { icon: Award, value: '95%', label: 'Довольных клиентов' },
  ];

  const plans = [
    {
      name: 'Basic',
      price: '€250',
      features: [
        'Базовый торговый бот',
        'Основные инструменты анализа',
        'Поддержка 24/7',
        'Мобильное приложение',
      ],
      color: 'primary',
    },
    {
      name: 'Premium',
      price: '€500',
      features: [
        'Продвинутый торговый бот',
        'Все инструменты анализа',
        'Приоритетная поддержка',
        'Персональный менеджер',
        'Расширенная аналитика',
      ],
      color: 'success',
      popular: true,
    },
    {
      name: 'Specialist',
      price: '€1000',
      features: [
        'Премиум торговый бот',
        'VIP поддержка',
        'Индивидуальные стратегии',
        'Приватные сигналы',
        'Эксклюзивные инструменты',
      ],
      color: 'warning',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 -right-40 w-80 h-80 bg-success-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-medium text-primary-500">Профессиональная торговая платформа</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-dark-text-primary leading-tight">
                Торгуйте с
                <br />
                <span className="text-gradient">уверенностью</span>
              </h1>

              <p className="text-xl text-dark-text-secondary max-w-xl">
                Присоединяйтесь к Bemo Investment Firm LTD и начните зарабатывать на криптовалютном рынке уже сегодня
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary py-4 px-8 text-lg"
                >
                  Начать торговать
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary py-4 px-8 text-lg"
                >
                  Узнать больше
                </button>
              </div>

              {/* Mini Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-bold text-gradient">1000+</p>
                  <p className="text-sm text-dark-text-tertiary">Пользователей</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-bold text-gradient-success">€2.5M</p>
                  <p className="text-sm text-dark-text-tertiary">Объем</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-bold text-gradient">24/7</p>
                  <p className="text-sm text-dark-text-tertiary">Поддержка</p>
                </div>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative animate-slide-in">
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-dark-text-primary">Торговый терминал</h3>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-danger-500"></div>
                    <div className="w-3 h-3 rounded-full bg-warning-500"></div>
                    <div className="w-3 h-3 rounded-full bg-success-500"></div>
                  </div>
                </div>

                {/* Fake Chart */}
                <div className="h-64 bg-dark-bg rounded-xl p-4">
                  <div className="flex items-end justify-around h-full">
                    {[40, 65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                      <div
                        key={i}
                        className="w-8 bg-gradient-to-t from-primary-500 to-primary-600 rounded-t-lg transition-all duration-500 hover:from-success-500 hover:to-success-600"
                        style={{ height: `${height}%`, animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-bg rounded-xl p-4">
                    <p className="text-xs text-dark-text-tertiary mb-1">Прибыль сегодня</p>
                    <p className="text-xl font-bold text-success-500">+€245.50</p>
                  </div>
                  <div className="bg-dark-bg rounded-xl p-4">
                    <p className="text-xs text-dark-text-tertiary mb-1">Win Rate</p>
                    <p className="text-xl font-bold text-primary-500">89.5%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-dark-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <p className="text-3xl font-bold text-dark-text-primary mb-2">{stat.value}</p>
                <p className="text-sm text-dark-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-dark-text-primary mb-4">
              Почему выбирают <span className="text-gradient">Bemo Investment</span>
            </h2>
            <p className="text-xl text-dark-text-secondary max-w-2xl mx-auto">
              Профессиональные инструменты для успешной торговли криптовалютами
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="stat-card animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-14 h-14 bg-${feature.color}-500/10 rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-500`} />
                </div>
                <h3 className="text-xl font-bold text-dark-text-primary mb-2">{feature.title}</h3>
                <p className="text-dark-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-dark-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-dark-text-primary mb-4">
              Выберите свой <span className="text-gradient">тариф</span>
            </h2>
            <p className="text-xl text-dark-text-secondary">
              Гибкие планы для каждого уровня трейдера
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`glass-card p-8 hover:border-${plan.color}-500/50 transition-all relative ${
                  plan.popular ? 'ring-2 ring-success-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-success-500 to-success-600 rounded-full text-white text-sm font-semibold">
                    Популярный
                  </div>
                )}
                <h3 className="text-2xl font-bold text-dark-text-primary mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold text-gradient mb-6">{plan.price}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-dark-text-secondary">
                      <CheckCircle className={`w-5 h-5 text-${plan.color}-500 flex-shrink-0 mt-0.5`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  className={`w-full ${plan.popular ? 'btn-success' : 'btn-secondary'} py-3`}
                >
                  Начать сейчас
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="glass-card p-12 bg-gradient-to-br from-primary-500/10 via-transparent to-success-500/10">
            <h2 className="text-4xl lg:text-5xl font-bold text-dark-text-primary mb-6">
              Готовы начать торговать?
            </h2>
            <p className="text-xl text-dark-text-secondary mb-8 max-w-2xl mx-auto">
              Присоединяйтесь к тысячам трейдеров, которые уже зарабатывают с Bemo Investment Firm LTD
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary py-4 px-8 text-lg"
            >
              Создать аккаунт бесплатно
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
