import { useState, FormEvent, useEffect, FC, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, clearError } from '@/store/slices/authSlice';
import { Loader2, ArrowRight, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ar', name: 'العربية' },
  { code: 'cs', name: 'Čeština' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'kk', name: 'Қазақша' },
  { code: 'nl', name: 'Nederlands' },
];

const NeuralBackground: FC<{ isActive: boolean }> = ({ isActive }) => {
    useEffect(() => {
        if (!isActive) return;
        const canvas = document.getElementById('neural-canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        const settings = {
            maxStructures: 5, structureGrowthInterval: 800, maxStructureSize: 12,
            fadeDuration: 2, baseSpeed: 0.1, connectionDistance: 120
        };
        let particles: any[] = []; let activeStructures: any[] = [];

        const particleColor = '150, 150, 150';
        const lineColor = '255, 255, 255';

        class Particle {
            id: number; x: number; y: number; vx: number; vy: number; size: number;
            constructor(id: number, w: number, h: number) {
                this.id = id; this.x = Math.random() * w; this.y = Math.random() * h;
                this.vx = (Math.random() - 0.5) * settings.baseSpeed; this.vy = (Math.random() - 0.5) * settings.baseSpeed;
                this.size = Math.random() * 1.2 + 0.8;
            }
            update(w: number, h: number) {
                this.x += this.vx; this.y += this.vy;
                if (this.x > w || this.x < 0) this.vx *= -1; if (this.y > h || this.y < 0) this.vy *= -1;
            }
        }

        const createNewStructure = () => {
            if (particles.length < 2 || activeStructures.length >= settings.maxStructures) return;
            const p1_idx = Math.floor(Math.random() * particles.length);
            const p2_idx = Math.floor(Math.random() * particles.length);
            if (p1_idx !== p2_idx) { activeStructures.push({ points: new Set([p1_idx, p2_idx]), alpha: 0, state: 'growing', lastGrowthTime: Date.now() }); }
        };

        const growStructure = (structure: any) => {
            if (structure.points.size >= settings.maxStructureSize) { structure.state = 'fadingOut'; return; }
            const allPointsArray = Array.from(structure.points);
            const pointToGrowFromIdx = allPointsArray[Math.floor(Math.random() * allPointsArray.length)];
            const pointToGrowFrom = particles[pointToGrowFromIdx];
            let closestPoint = null; let minDistance = Infinity;
            for (let i = 0; i < particles.length; i++) {
                if (!structure.points.has(i)) {
                    const dist = Math.hypot(pointToGrowFrom.x - particles[i].x, pointToGrowFrom.y - particles[i].y);
                    if (dist < minDistance && dist < settings.connectionDistance) { minDistance = dist; closestPoint = i; }
                }
            }
            if (closestPoint !== null) structure.points.add(closestPoint); else structure.state = 'fadingOut';
        };

        const setup = () => {
            canvas.width = window.innerWidth; canvas.height = window.innerHeight; particles = []; activeStructures = [];
            const count = Math.floor((canvas.width * canvas.height) / 20000);
            for (let i = 0; i < count; i++) particles.push(new Particle(i, canvas.width, canvas.height));
            for(let i=0; i < settings.maxStructures / 2; i++) createNewStructure();
        };

        const draw = () => {
            if (!isActive || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => p.update(canvas.width, canvas.height));
            ctx.fillStyle = `rgba(${particleColor}, 0.3)`;
            particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); });
            const fadeAmount = 1 / (settings.fadeDuration * 60);
            for (let i = activeStructures.length - 1; i >= 0; i--) {
                const struct = activeStructures[i];
                if(struct.state === 'growing'){
                    struct.alpha = Math.min(1, struct.alpha + fadeAmount);
                    if (Date.now() - struct.lastGrowthTime > settings.structureGrowthInterval) { growStructure(struct); struct.lastGrowthTime = Date.now(); }
                } else {
                    struct.alpha = Math.max(0, struct.alpha - fadeAmount);
                    if(struct.alpha === 0) { activeStructures.splice(i, 1); createNewStructure(); continue; }
                }
                ctx.strokeStyle = `rgba(${lineColor}, ${struct.alpha * 0.6})`;
                ctx.lineWidth = 0.8;
                const pointsArray = Array.from(struct.points);
                for (let j = 0; j < pointsArray.length; j++) {
                    for (let k = j + 1; k < pointsArray.length; k++) {
                        const p1 = particles[pointsArray[j] as number]; const p2 = particles[pointsArray[k] as number];
                         if(p1 && p2 && Math.hypot(p1.x - p2.x, p1.y - p2.y) < settings.connectionDistance * 1.5){
                            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(draw);
        };
        setup(); draw();
        window.addEventListener('resize', setup);
        return () => { window.removeEventListener('resize', setup); cancelAnimationFrame(animationFrameId); };
    }, [isActive]);

    return <canvas id="neural-canvas" className={`absolute top-0 left-0 w-full h-full transition-opacity duration-[2000ms] ${isActive ? 'opacity-100' : 'opacity-0'} pointer-events-none`} />;
};

const useTypingEffect = (text: string, speed = 30, start = true) => {
    const [displayedText, setDisplayedText] = useState('');
    useEffect(() => {
        if (!start) return;
        setDisplayedText('');
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) { setDisplayedText((prev) => prev + text.charAt(i)); i++; }
            else { clearInterval(interval); }
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed, start]);
    return displayedText;
};

const SystemResponse: FC<{ text: string; startCondition: boolean }> = ({ text, startCondition }) => {
    const displayText = useTypingEffect(text, 20, startCondition);
    return (
        <p className="text-sm text-[#888] whitespace-nowrap font-mono">
            {displayText}
            <span className="animate-blink text-white">_</span>
        </p>
    );
};

const LanguageControls: FC = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-[#888] hover:text-white transition-colors border border-[#333] hover:border-white flex items-center gap-2 bg-transparent rounded">
                <Globe className="w-4 h-4" />
                <span className="text-xs uppercase">{currentLang.code}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#101214] border border-[#27272A] backdrop-blur-md shadow-xl z-50 animate-stage-in max-h-60 overflow-y-auto rounded">
                    {languages.map((lang) => (
                        <button key={lang.code} onClick={() => { i18n.changeLanguage(lang.code); setIsOpen(false); }}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors ${i18n.language === lang.code ? 'bg-[#1A1D1F] text-white' : 'text-[#888] hover:text-white hover:bg-[#1A1D1F]'}`}>
                            {lang.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function LoginPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isLoading, error } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();

    const bootHasPlayed = sessionStorage.getItem('login_boot_played') === '1';
    const [bootStage, setBootStage] = useState(bootHasPlayed ? 4 : 0);
    const [hasBootPlayed, setHasBootPlayed] = useState(bootHasPlayed);
    const [formData, setFormData] = useState({ email: '', password: '' });

    useEffect(() => {
        dispatch(clearError());
        const alreadyPlayed = sessionStorage.getItem('login_boot_played');
        if (alreadyPlayed) { setHasBootPlayed(true); setBootStage(4); return; }
        sessionStorage.setItem('login_boot_played', '1');
        setHasBootPlayed(false);
        const seq = [
            setTimeout(() => setBootStage(1), 500),
            setTimeout(() => setBootStage(2), 1000),
            setTimeout(() => setBootStage(3), 2800),
            setTimeout(() => setBootStage(4), 4500),
        ];
        return () => seq.forEach(clearTimeout);
    }, [dispatch]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        dispatch(clearError());
        const result = await dispatch(loginUser({ ...formData, remember_me: true }));
        if (loginUser.fulfilled.match(result)) navigate('/dashboard');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) dispatch(clearError());
    };

    return (
        <div className="bg-[#050505] text-[#E0E0E0] font-mono min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <style>
                {`
                    :root { --border-color: #27272A; }
                    .input-group:focus-within { --border-color: #FFF; color: #FFF; }

                    @keyframes fade-in-grow { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                    @keyframes delayed-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes stage-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-fade-in { animation: fade-in-grow 1s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
                    .animate-delayed-fade-in { animation: delayed-fade-in 1s cubic-bezier(0.25, 1, 0.5, 1) forwards; opacity: 0; animation-delay: 800ms; }
                    .animate-stage-in { animation: stage-in 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
                    @keyframes blink { 50% { opacity: 0; } }
                    .animate-blink { animation: blink 1.2s step-end infinite; }

                    /* PULSING BORDER ANIMATION - WHITE GLOW */
                    @keyframes pulse-border {
                        0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
                        50% { box-shadow: 0 0 20px 0 rgba(255,255,255,0.08); }
                    }
                    .animate-pulse-border { animation: pulse-border 5s infinite; }

                    .button-glimmer::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.6s; }
                    .button-glimmer:hover::after { left: 150%; }
                `}
            </style>

            <NeuralBackground isActive={bootStage >= 4} />

            <div className="absolute top-6 right-6 z-20">
                <LanguageControls />
            </div>

            <div className={`w-full max-w-lg transition-opacity duration-0 ${bootStage >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-[rgba(16,18,20,0.7)] border border-[#27272A] backdrop-blur-md p-8 sm:p-10 shadow-2xl relative animate-pulse-border h-[450px] flex flex-col justify-center">

                    {!hasBootPlayed && (
                        <div className={`absolute top-0 left-0 w-full h-full p-8 sm:p-10 flex flex-col justify-center transition-opacity duration-700 ${bootStage >= 4 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <div className="space-y-2">
                                <SystemResponse text="[0.0000] Initializing BEMO System Core..." startCondition={bootStage >= 2 && !hasBootPlayed} />
                                <SystemResponse text="[2.8134] Establishing quantum-link handshake..." startCondition={bootStage >= 3 && !hasBootPlayed} />
                            </div>
                        </div>
                    )}

                    <div className={`absolute top-0 left-0 w-full h-full flex flex-col justify-center transition-opacity duration-1000 ${bootStage >= 4 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                         <div className={`p-8 sm:p-10 ${!bootHasPlayed ? 'animate-fade-in' : ''}`} style={{ animationDelay: '200ms' }}>
                            <h1 className="text-xl text-center mb-10 text-white tracking-[0.3em] font-bold">
                                B E M O <span className="text-[#666] font-normal"> // INVESTMENT</span>
                            </h1>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="input-group flex flex-col gap-1">
                                    <label htmlFor="email" className="text-[#666] text-xs uppercase tracking-widest mb-1 text-left font-semibold">
                                        {t('auth.emailLabel')}
                                    </label>
                                    <input id="email" name="email" type="email" required autoFocus value={formData.email} onChange={handleChange} disabled={isLoading}
                                        className="w-full bg-transparent focus:outline-none border-b border-[#333] focus:border-white py-2 transition-colors duration-300 caret-white text-white" />
                                </div>
                                <div className="input-group flex flex-col gap-1">
                                    <label htmlFor="password" className="text-[#666] text-xs uppercase tracking-widest mb-1 text-left font-semibold">
                                        {t('auth.passwordLabel')}
                                    </label>
                                    <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} disabled={isLoading}
                                        className="w-full bg-transparent focus:outline-none border-b border-[#333] focus:border-white py-2 transition-colors duration-300 caret-white text-white" />
                                </div>

                                {error && <p className="!mt-3 text-sm text-red-500 text-left">[ERROR]: {t('auth.errorTitle')}</p>}

                                <div className="pt-4">
                                    <button type="submit" disabled={isLoading}
                                        className="button-glimmer group relative overflow-hidden flex items-center justify-center w-full gap-3 text-lg border border-[#333] px-4 py-3 hover:border-white focus:outline-none transition-colors duration-300">
                                        {isLoading ? <Loader2 className="animate-spin h-5 w-5 text-white" /> : (
                                            <>
                                                <span className="text-white font-medium">{t('auth.loginButton')}</span>
                                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2 text-[#666] group-hover:text-white" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className={`absolute bottom-6 text-center w-full left-0 ${!bootHasPlayed ? 'animate-delayed-fade-in' : ''}`}>
                            <p className="text-[#666] text-xs">
                                {t('auth.noAccount')}{' '}
                                <Link to="/register" className="text-white hover:underline focus:underline focus:outline-none transition-all font-medium">
                                    &gt; {t('auth.signUp')}
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}