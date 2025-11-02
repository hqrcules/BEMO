import { Bot, Shield, Zap, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BotInfo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center p-8">
      <div className="max-w-5xl w-full space-y-12">

        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-[#121317] border border-[#1f2128] shadow-[0_0_20px_rgba(59,130,246,0.08)]">
            <Bot className="w-10 h-10 text-[#8ab4f8]" strokeWidth={1.4} />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Automated Trading Bot
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Execute strategies with precision. Trade 24/7. Secure. Adaptive. Efficient.
            </p>
          </div>

          <button
            onClick={() => navigate('/balance')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#16171b] hover:bg-[#1b1c21]
                       text-white font-medium rounded-lg border border-[#2a2b31]
                       transition-all duration-200 hover:shadow-[0_0_12px_rgba(138,180,248,0.15)]"
          >
            Open Balance
            <ArrowRight className="w-5 h-5 text-[#8ab4f8]" />
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Feature
            icon={<Clock className="w-7 h-7 text-[#8ab4f8]" strokeWidth={1.4} />}
            title="24/7 Trading"
            text="Constant market monitoring"
          />
          <Feature
            icon={<Shield className="w-7 h-7 text-[#9de0b5]" strokeWidth={1.4} />}
            title="Risk Control"
            text="Automated capital protection"
          />
          <Feature
            icon={<Zap className="w-7 h-7 text-[#f5d97e]" strokeWidth={1.4} />}
            title="Fast Execution"
            text="Latency under 100 ms"
          />
          <Feature
            icon={<Bot className="w-7 h-7 text-[#c59cff]" strokeWidth={1.4} />}
            title="Adaptive AI"
            text="Smart trade logic"
          />
        </div>

        {/* Info */}
        <div className="bg-[#121317] border border-[#1f2128] rounded-xl p-8 text-center shadow-[0_0_30px_rgba(0,0,0,0.35)]">
          <p className="text-gray-300 text-base leading-relaxed max-w-3xl mx-auto">
            This trading system eliminates emotional decisions by leveraging autonomous algorithms.
            Built for accuracy and stability — it analyzes, reacts, and executes continuously
            under any market condition, protecting your assets while maximizing opportunity.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: JSX.Element; title: string; text: string }) {
  return (
    <div className="p-6 rounded-lg border border-[#1f2128] bg-[#101114]
                    hover:bg-[#141519] hover:border-[#2a2b31]
                    transition-all text-center shadow-[inset_0_0_0_rgba(0,0,0,0)]
                    hover:shadow-[0_0_12px_rgba(59,130,246,0.08)]">
      <div className="mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{text}</p>
    </div>
  );
}
