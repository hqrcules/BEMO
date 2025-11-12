import { Bot, Shield, Zap, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';

export default function BotInfo() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tc = useThemeClasses();

  return (
    <div className={`min-h-screen ${tc.bg} flex items-center justify-center p-8`}>
      <div className="max-w-5xl w-full space-y-12">

        {/* Hero */}
        <div className="text-center space-y-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-xl ${tc.cardBg} border ${tc.cardBorder} shadow-[0_0_20px_rgba(59,130,246,0.08)]`}>
            <Bot className="w-10 h-10 text-[#8ab4f8]" strokeWidth={1.4} />
          </div>

          <div className="space-y-2">
            <h1 className={`text-4xl font-bold ${tc.textPrimary} tracking-tight`}>
              {t('bot.info.title')}
            </h1>
            <p className={`${tc.textSecondary} text-lg max-w-2xl mx-auto leading-relaxed`}>
              {t('bot.info.subtitle')}
            </p>
          </div>

          <button
            onClick={() => navigate('/balance')}
            className={`inline-flex items-center gap-2 px-8 py-3.5 ${tc.hover} ${tc.hoverBg}
                       ${tc.textPrimary} font-medium rounded-lg border ${tc.cardBorder}
                       transition-all duration-200 hover:shadow-[0_0_12px_rgba(138,180,248,0.15)]`}
          >
            {t('bot.info.openBalance')}
            <ArrowRight className="w-5 h-5 text-[#8ab4f8]" />
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Feature
            icon={<Clock className="w-7 h-7 text-[#8ab4f8]" strokeWidth={1.4} />}
            title={t('bot.info.features.trading247.title')}
            text={t('bot.info.features.trading247.description')}
            tc={tc}
          />
          <Feature
            icon={<Shield className="w-7 h-7 text-[#9de0b5]" strokeWidth={1.4} />}
            title={t('bot.info.features.riskControl.title')}
            text={t('bot.info.features.riskControl.description')}
            tc={tc}
          />
          <Feature
            icon={<Zap className="w-7 h-7 text-[#f5d97e]" strokeWidth={1.4} />}
            title={t('bot.info.features.fastExecution.title')}
            text={t('bot.info.features.fastExecution.description')}
            tc={tc}
          />
          <Feature
            icon={<Bot className="w-7 h-7 text-[#c59cff]" strokeWidth={1.4} />}
            title={t('bot.info.features.adaptiveAI.title')}
            text={t('bot.info.features.adaptiveAI.description')}
            tc={tc}
          />
        </div>

        {/* Info */}
        <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-xl p-8 text-center shadow-[0_0_30px_rgba(0,0,0,0.35)]`}>
          <p className={`${tc.textSecondary} text-base leading-relaxed max-w-3xl mx-auto`}>
            {t('bot.info.description')}
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text, tc }: { icon: JSX.Element; title: string; text: string; tc: ReturnType<typeof useThemeClasses> }) {
  return (
    <div className={`p-6 rounded-lg border ${tc.cardBorder} ${tc.cardBg}
                    ${tc.hoverBg} hover:border-${tc.cardBorder}
                    transition-all text-center shadow-[inset_0_0_0_rgba(0,0,0,0)]
                    hover:shadow-[0_0_12px_rgba(59,130,246,0.08)]`}>
      <div className="mb-3">{icon}</div>
      <h3 className={`text-sm font-semibold ${tc.textPrimary} mb-1`}>{title}</h3>
      <p className={`text-xs ${tc.textTertiary}`}>{text}</p>
    </div>
  );
}
