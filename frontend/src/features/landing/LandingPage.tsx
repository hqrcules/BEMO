import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Award, BarChart3, ArrowRight, CheckCircle, Terminal } from 'lucide-react';
import NeuralBackground from '@/components/ui/NeuralBackground';
import BemoButton from '@/components/ui/BemoButton';

export default function LandingPage() {
    const navigate = useNavigate();

    const features = [
        { icon: Shield, title: 'Security Protocol', description: 'AES-256 encryption for all data transmission.' },
        { icon: Zap, title: 'Low Latency', description: 'Direct market access with <10ms execution time.' },
        { icon: Award, title: 'Verified System', description: 'Audited by independent security firms.' },
        { icon: BarChart3, title: 'Advanced Analytics', description: 'Real-time pattern recognition algorithms.' },
    ];

    const plans = [
        { name: 'NODE.BASIC', price: '€250', features: ['Standard Bot Access', 'Basic Metrics', '24/7 Support'] },
        { name: 'NODE.PRO', price: '€500', features: ['Advanced Algorithms', 'Priority Routing', 'Personal Manager', 'Deep Analytics'], popular: true },
        { name: 'NODE.CORP', price: '€1000', features: ['Custom Strategies', 'Direct API Access', 'Institutional Data', 'Zero Latency'] },
    ];

    return (
        <div className="bg-bemo-bg text-bemo-text font-mono min-h-screen flex flex-col relative overflow-x-hidden selection:bg-white selection:text-black">
            <NeuralBackground isActive={true} />

            <nav className="relative z-20 border-b border-bemo-border backdrop-blur-md bg-bemo-bg/80">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-white animate-pulse" />
                        <span className="tracking-[0.3em] font-bold text-lg">B E M O <span className="text-bemo-muted font-normal">// SYS</span></span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => navigate('/login')} className="text-sm text-bemo-muted hover:text-white transition-colors uppercase tracking-widest">Login</button>
                        <button onClick={() => navigate('/register')} className="text-sm text-white border border-bemo-border px-4 py-1 hover:bg-white hover:text-black transition-all uppercase tracking-widest">Register</button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 flex-grow">
                <section className="min-h-[80vh] flex items-center justify-center px-4">
                    <div className="max-w-5xl w-full">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8 animate-fade-in">
                                <div className="inline-flex items-center gap-2 px-3 py-1 border border-bemo-border rounded bg-bemo-card text-xs text-bemo-muted uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    System Operational
                                </div>
                                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                                    ALGORITHMIC <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">TRADING</span>
                                </h1>
                                <p className="text-lg text-bemo-muted max-w-xl border-l-2 border-bemo-border pl-6">
                                    Execute high-frequency strategies with institutional-grade infrastructure.
                                    Bemo provides the edge needed in volatile markets.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <BemoButton onClick={() => navigate('/register')}>
                                        INITIALIZE SYSTEM <ArrowRight className="w-5 h-5" />
                                    </BemoButton>
                                    <BemoButton variant="secondary" onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>
                                        VIEW PROTOCOLS
                                    </BemoButton>
                                </div>
                            </div>

                            <div className="relative hidden lg:block animate-delayed-fade-in">
                                <div className="absolute -inset-1 bg-gradient-to-r from-white to-gray-600 rounded-lg blur opacity-20"></div>
                                <div className="relative bg-bemo-bg border border-bemo-border p-6 rounded-lg shadow-2xl">
                                    <div className="flex items-center justify-between mb-6 border-b border-bemo-border pb-4">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                        </div>
                                        <div className="text-xs text-bemo-muted font-mono">root@bemo-node:~/trading</div>
                                    </div>
                                    <div className="space-y-3 font-mono text-sm">
                                        <div className="flex justify-between text-bemo-muted"><span>STATUS</span><span className="text-green-500">ACTIVE</span></div>
                                        <div className="flex justify-between text-bemo-muted"><span>UPTIME</span><span>99.99%</span></div>
                                        <div className="h-px bg-bemo-border my-4" />
                                        <div className="space-y-2">
                                            <p className="text-white">$ ./init_bot.sh --strategy=aggressive</p>
                                            <p className="text-bemo-muted text-xs">[INFO] Connecting to exchange...</p>
                                            <p className="text-bemo-muted text-xs">[INFO] Stream established.</p>
                                            <p className="text-green-500 text-xs">[SUCCESS] Profit target reached (+4.2%)</p>
                                        </div>
                                        <div className="mt-4 h-32 flex items-end gap-1">
                                            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((h, i) => (
                                                <div key={i} className="flex-1 bg-white/10 hover:bg-white/30 transition-all duration-300" style={{ height: `${h}%` }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-32 border-t border-bemo-border bg-bemo-bg/50 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((f, i) => (
                                <div key={i} className="group p-6 border border-bemo-border hover:border-white transition-all duration-300 bg-bemo-card hover:-translate-y-1">
                                    <f.icon className="w-8 h-8 text-white mb-4 group-hover:scale-110 transition-transform" />
                                    <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                                    <p className="text-sm text-bemo-muted">{f.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="plans" className="py-32 relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl font-bold mb-4">ACCESS LEVELS</h2>
                            <p className="text-bemo-muted">Select your interface tier</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {plans.map((plan, i) => (
                                <div key={i} className={`relative p-8 border bg-bemo-card backdrop-blur-md flex flex-col ${plan.popular ? 'border-white animate-pulse-border' : 'border-bemo-border hover:border-gray-600'} transition-colors`}>
                                    {plan.popular && <div className="absolute top-0 right-0 bg-white text-black text-xs font-bold px-3 py-1">RECOMMENDED</div>}
                                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                    <div className="text-4xl font-bold mb-8">{plan.price}</div>
                                    <ul className="space-y-4 mb-8 flex-grow">
                                        {plan.features.map((f, j) => (
                                            <li key={j} className="flex items-center gap-3 text-sm text-bemo-muted">
                                                <Terminal className="w-4 h-4 text-white" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <BemoButton variant={plan.popular ? 'primary' : 'secondary'} onClick={() => navigate('/register')}>
                                        SELECT TIER
                                    </BemoButton>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-bemo-border py-12 relative z-10 bg-bemo-bg text-center">
                <p className="text-xs text-bemo-muted uppercase tracking-widest">
                    © 2025 Bemo Investment Firm LTD // System Build v2.4.0
                </p>
            </footer>
        </div>
    );
}