import { useState, FormEvent, useEffect, FC, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowRight, ChevronLeft, ChevronRight, Calendar, Globe, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';

interface FormErrors { [key: string]: string[]; }
type Stage = 'personal' | 'contact' | 'security';

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
            if (p1_idx !== p2_idx) {
                activeStructures.push({
                    points: new Set([p1_idx, p2_idx]), alpha: 0, state: 'growing', lastGrowthTime: Date.now()
                });
            }
        };
        const growStructure = (structure: any) => {
            if (structure.points.size >= settings.maxStructureSize) { structure.state = 'fadingOut'; return; }
            const allPointsArray = Array.from(structure.points);
            const pointToGrowFromIdx = allPointsArray[Math.floor(Math.random() * allPointsArray.length)];
            const pointToGrowFrom = particles[pointToGrowFromIdx]; let closestPoint = null; let minDistance = Infinity;
            for (let i = 0; i < particles.length; i++) {
                if (!structure.points.has(i)) {
                    const dist = Math.hypot(pointToGrowFrom.x - particles[i].x, pointToGrowFrom.y - particles[i].y);
                    if (dist < minDistance && dist < settings.connectionDistance) { minDistance = dist; closestPoint = i; }
                }
            }
            if (closestPoint !== null) { structure.points.add(closestPoint); } else { structure.state = 'fadingOut'; }
        };
        const setup = () => {
            canvas.width = window.innerWidth; canvas.height = window.innerHeight; particles = []; activeStructures = [];
            const count = Math.floor((canvas.width * canvas.height) / 20000);
            for (let i = 0; i < count; i++) { particles.push(new Particle(i, canvas.width, canvas.height)); }
            for(let i=0; i < settings.maxStructures / 2; i++){ createNewStructure(); }
        };
        const draw = () => {
            if (!isActive || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => p.update(canvas.width, canvas.height));
            ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
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
                ctx.strokeStyle = `rgba(255, 255, 255, ${struct.alpha * 0.7})`; ctx.lineWidth = 0.8;
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
    return (<canvas id="neural-canvas" className={`absolute top-0 left-0 w-full h-full transition-opacity duration-[2000ms] bg-obsidian ${isActive ? 'opacity-100' : 'opacity-0'}`} />);
};

const CustomDatePicker: FC<{ value: string, onChange: (value: string) => void, error?: string[], disabled?: boolean }> =
({ value, onChange, error, disabled }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const pickerRef = useRef<HTMLDivElement>(null);

    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    const monthNames = [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const generateDaysForMonth = () => {
        const days = [];
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const startDay = (date.getDay() + 6) % 7;

        for (let i = 0; i < startDay; i++) {
            days.push({ day: new Date(date.getFullYear(), date.getMonth(), i - startDay + 1), isPadding: true });
        }

        while (date.getMonth() === viewDate.getMonth()) {
            days.push({ day: new Date(date), isPadding: false });
            date.setDate(date.getDate() + 1);
        }

        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: new Date(date.getFullYear(), date.getMonth(), i), isPadding: true });
        }
        return days;
    };

    const handleDateSelect = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        onChange(`${yyyy}-${mm}-${dd}`);
        setIsOpen(false);
    };

    const calendarDays = generateDaysForMonth();
    const selectedDate = value ? new Date(value) : null;
    const today = new Date();

    return (
        <div className="relative input-group" ref={pickerRef}>
             <label htmlFor="date_of_birth" className="text-[#666] text-sm block mb-1 text-left">{t('auth.register.dateOfBirth')}</label>
             <div className="relative">
                <input
                    id="date_of_birth" name="date_of_birth" type="text" readOnly
                    value={value ? new Date(value).toLocaleDateString('ru-RU') : ''}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    placeholder="ДД.ММ.ГГГГ"
                    disabled={disabled}
                    className={`w-full bg-transparent focus:outline-none border-b py-2 pr-10 transition-colors duration-300 ${error ? 'border-red-500 text-red-400' : 'border-[#27272A] text-white focus:border-white'}`}
                />
                 <Calendar onClick={() => !disabled && setIsOpen(!isOpen)} className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-[#666] cursor-pointer hover:text-white transition-colors" />
             </div>
             {error && <p className="text-xs text-red-500 pt-1 text-left">{error[0]}</p>}

            {isOpen && (
                 <div className="absolute top-full mt-2 w-full max-w-xs z-20 bg-[#101214] border border-[#27272A] backdrop-blur-md shadow-lg p-4 animate-stage-in">
                     <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1 text-white hover:bg-[#27272A] rounded"><ChevronLeft /></button>
                         <div className="font-bold text-sm tracking-widest text-white">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</div>
                        <button type="button" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1 text-white hover:bg-[#27272A] rounded"><ChevronRight /></button>
                     </div>
                     <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#666]">
                         {daysOfWeek.map(d => <div key={d}>{d}</div>)}
                     </div>
                     <div className="grid grid-cols-7 gap-1 mt-2">
                        {calendarDays.map(({ day, isPadding }) => {
                             const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                             const isToday = day.toDateString() === today.toDateString();
                             return (
                                <button type="button" key={day.toISOString()} disabled={isPadding}
                                 onClick={() => handleDateSelect(day)}
                                 className={`p-2 text-sm rounded-sm transition-colors ${ isPadding ? 'text-transparent' : 'text-white hover:bg-[#27272A]' }
                                  ${isSelected ? '!bg-white !text-black' : ''} ${isToday && !isSelected ? 'border border-[#666]' : ''}` }>
                                    {day.getDate()}
                                </button>
                             );
                         })}
                     </div>
                 </div>
            )}
        </div>
    );
};

const InputField: FC<{ name: string, label: string, type?: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, error?: string[], disabled: boolean }> =
({ name, label, type = "text", value, onChange, error, disabled }) => (
    <div className="input-group space-y-1">
        <label htmlFor={name} className="text-[#666] text-sm block text-left">{label}</label>
        <input id={name} name={name} type={type} required value={value} onChange={onChange} disabled={disabled}
            className={`w-full bg-transparent focus:outline-none border-b py-2 transition-colors duration-300 caret-white ${error ? 'border-red-500 text-red-400' : 'border-[#27272A] text-white focus:border-white'}`}/>
        {error && <p className="text-xs text-red-500 pt-1 text-left">{error[0]}</p>}
    </div>
);

const LanguageControls: FC = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false); };
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

export default function RegisterPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const [stage, setStage] = useState<Stage>('personal');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', date_of_birth: '',
        email: '', phone: '', password: '', confirm_password: '',
    });
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => { setIsVisible(true); }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) { const newErrors = { ...errors }; delete newErrors[name]; setErrors(newErrors); }
    };

    const handleDateChange = (dateValue: string) => {
        setFormData(prev => ({...prev, date_of_birth: dateValue}));
        if(errors.date_of_birth){ const newErrors = { ...errors }; delete newErrors.date_of_birth; setErrors(newErrors); }
    }

    const handleNextStage = () => {
        if (stage === 'personal') {
            const personalErrors: FormErrors = {};
            if (!formData.first_name) personalErrors.first_name = [t('auth.validation.firstNameRequired')];
            if (!formData.last_name) personalErrors.last_name = [t('auth.validation.lastNameRequired')];
            if (!formData.date_of_birth) personalErrors.date_of_birth = [t('auth.validation.dateOfBirthRequired')];
            if (Object.keys(personalErrors).length === 0) { setErrors({}); setStage('contact'); } else { setErrors(personalErrors); }
        } else if (stage === 'contact') {
             const contactErrors: FormErrors = {};
             if (!formData.email) contactErrors.email = [t('auth.validation.emailRequired')];
             if (!formData.phone) contactErrors.phone = [t('auth.validation.phoneRequired')];
            if (Object.keys(contactErrors).length === 0) { setErrors({}); setStage('security'); } else { setErrors(contactErrors); }
        }
    };
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault(); setErrors({});
        if (formData.password.length < 6 || formData.password !== formData.confirm_password) {
            setErrors({
                password: formData.password.length < 6 ? [t('auth.validation.passwordMinLength')] : [],
                confirm_password: formData.password !== formData.confirm_password ? [t('auth.validation.passwordsNotMatch')] : []
            });
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.post('/api/auth/register/', formData);
            if (response.data.success && response.data.user) { dispatch(setUser(response.data.user)); navigate('/dashboard'); }
        } catch (error: any) {
            if (error.response?.data?.error && typeof error.response.data.error === 'object') { setErrors(error.response.data.error); }
            else { setErrors({ "generic": [t('auth.validation.registrationFailed')] }) }
        } finally { setIsLoading(false); }
    };

    const renderStage = () => {
        switch (stage) {
            case 'personal':
                return (
                    <div key="personal" className="animate-stage-in space-y-6">
                        <InputField name="first_name" label={t('auth.register.firstName')} value={formData.first_name} onChange={handleChange} error={errors.first_name} disabled={isLoading}/>
                        <InputField name="last_name" label={t('auth.register.lastName')} value={formData.last_name} onChange={handleChange} error={errors.last_name} disabled={isLoading}/>
                        <CustomDatePicker
                            value={formData.date_of_birth}
                            onChange={handleDateChange}
                            error={errors.date_of_birth}
                            disabled={isLoading}
                        />
                    </div>
                );
            case 'contact':
                return ( <div key="contact" className="animate-stage-in space-y-6"> <InputField name="email" label={t('auth.email')} type="email" value={formData.email} onChange={handleChange} error={errors.email} disabled={isLoading}/> <InputField name="phone" label={t('auth.register.phone')} type="tel" value={formData.phone} onChange={handleChange} error={errors.phone} disabled={isLoading}/> </div> );
            case 'security':
                return ( <div key="security" className="animate-stage-in space-y-6"> <InputField name="password" label={t('auth.password')} type="password" value={formData.password} onChange={handleChange} error={errors.password} disabled={isLoading}/> <InputField name="confirm_password" label={t('auth.register.confirmPassword')} type="password" value={formData.confirm_password} onChange={handleChange} error={errors.confirm_password} disabled={isLoading}/> </div> );
            default: return null;
        }
    }

    return (
        <div className={`bg-obsidian text-[#E0E0E0] font-mono min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
             <style>
                {`:root { --border-color: #27272A; }
                @keyframes stage-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-stage-in { animation: stage-in 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

                /* Pulsing Border Animation - WHITE GLOW */
                @keyframes pulse-border {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
                    50% { box-shadow: 0 0 20px 0 rgba(255,255,255,0.08); }
                }
                .animate-pulse-border { animation: pulse-border 5s infinite; }`}
            </style>

            <NeuralBackground isActive={isVisible} />

            <div className="absolute top-6 right-6 z-20">
                <LanguageControls />
            </div>

            <div className="w-full max-w-xl z-10">
                 <h1 className="text-xl text-center mb-4 text-white tracking-[0.3em] font-bold">{t('auth.register.title')}</h1>
                <div className="flex justify-between items-center mb-8">
                    { (['personal', 'contact', 'security'] as Stage[]).map((s, index) => {
                         const stageIndex = s === 'personal' ? 0 : s === 'contact' ? 1 : 2; const currentStageIndex = stage === 'personal' ? 0 : stage === 'contact' ? 1 : 2; const isActive = stageIndex <= currentStageIndex;
                         return (
                            <div key={s} className="flex-1 flex items-center">
                                <div className="flex flex-col items-center z-10 w-24">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isActive ? 'border-white bg-white text-black' : 'border-[#333]'}`}>{index + 1}</div>
                                    <p className={`text-xs mt-2 uppercase transition-colors text-center ${isActive ? 'text-white' : 'text-[#666]'}`}>{s}</p>
                                </div>
                                {index < 2 && <div className={`flex-grow h-px transition-colors duration-500 ${isActive ? 'bg-white' : 'bg-[#333]'}`}></div>}
                            </div>
                         )
                    })}
                </div>
                <div className="glass-panel p-8 sm:p-10 shadow-lg relative min-h-[380px] flex flex-col justify-between animate-pulse-border">
                    <form onSubmit={handleSubmit} className="flex flex-col justify-between h-full">
                        <div>{renderStage()}</div>
                        <div className="pt-8 flex justify-between items-center">
                            {stage !== 'personal' && <button type="button" onClick={() => setStage(stage === 'security' ? 'contact' : 'personal')} className="text-[#666] hover:text-white transition-colors">&lt; {t('modals.back')}</button>}
                            <div className="flex-grow"></div>
                            {stage !== 'security' ? (
                                <button type="button" onClick={handleNextStage} className="group flex items-center gap-3 text-lg text-white font-medium">{t('common.confirm')} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2 text-[#666] group-hover:text-white"/></button>
                            ) : (
                                <button type="submit" disabled={isLoading} className="group relative overflow-hidden flex items-center justify-center w-full sm:w-auto gap-3 text-lg border border-[#333] px-4 py-3 hover:border-white focus:outline-none transition-colors duration-300">
                                     {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : ( <> <span className="text-white font-medium">{t('auth.register.createButton')}</span> </> )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                <p className="text-center text-xs text-[#666] mt-6">{t('auth.hasAccount')} <Link to="/login" className="text-white hover:underline font-medium">{t('auth.loginHere')}</Link></p>
            </div>
        </div>
    );
}