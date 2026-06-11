import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';

interface WorldCupStatus {
    enabled: boolean;
    opponent: string;
    status: 'countdown' | 'live' | 'finished';
    mexico_score: number;
    opponent_score: number;
    last_goal_time: number;
    match_datetime?: string;
}

// ── Country name → ISO 3166-1 alpha-2 code ──────────────────────────────────
const COUNTRY_FLAGS: Record<string, string> = {
    // México
    'México': 'mx', 'Mexico': 'mx', 'Mex': 'mx',
    // Americas
    'Argentina': 'ar', 'Brasil': 'br', 'Brazil': 'br',
    'Chile': 'cl', 'Colombia': 'co', 'Ecuador': 'ec',
    'Uruguay': 'uy', 'Paraguay': 'py', 'Bolivia': 'bo',
    'Perú': 'pe', 'Peru': 'pe', 'Venezuela': 've',
    'Honduras': 'hn', 'Guatemala': 'gt', 'Costa Rica': 'cr',
    'El Salvador': 'sv', 'Panamá': 'pa', 'Panama': 'pa',
    'Jamaica': 'jm', 'Cuba': 'cu', 'Trinidad y Tobago': 'tt',
    'Estados Unidos': 'us', 'USA': 'us', 'EUA': 'us',
    'Canadá': 'ca', 'Canada': 'ca',
    // Europa
    'Alemania': 'de', 'Germany': 'de',
    'España': 'es', 'Spain': 'es',
    'Francia': 'fr', 'France': 'fr',
    'Italia': 'it', 'Italy': 'it',
    'Portugal': 'pt', 'Inglaterra': 'gb-eng', 'England': 'gb-eng',
    'Holanda': 'nl', 'Netherlands': 'nl', 'Países Bajos': 'nl',
    'Bélgica': 'be', 'Belgium': 'be',
    'Polonia': 'pl', 'Poland': 'pl',
    'Croacia': 'hr', 'Croatia': 'hr',
    'Dinamarca': 'dk', 'Denmark': 'dk',
    'Suecia': 'se', 'Sweden': 'se',
    'Noruega': 'no', 'Norway': 'no',
    'Suiza': 'ch', 'Switzerland': 'ch',
    'Austria': 'at', 'Hungría': 'hu', 'Hungary': 'hu',
    'Escocia': 'gb-sct', 'Scotland': 'gb-sct',
    'Gales': 'gb-wls', 'Wales': 'gb-wls',
    'Turquía': 'tr', 'Turkey': 'tr',
    'Ucrania': 'ua', 'Ukraine': 'ua',
    'Rusia': 'ru', 'Russia': 'ru',
    'Serbia': 'rs', 'Eslovenia': 'si',
    'República Checa': 'cz', 'Rumania': 'ro', 'Romania': 'ro',
    'Eslovaquia': 'sk', 'Slovakia': 'sk',
    'Albania': 'al', 'Kosovo': 'xk',
    // África
    'Marruecos': 'ma', 'Morocco': 'ma',
    'Senegal': 'sn', 'Nigeria': 'ng',
    'Ghana': 'gh', 'Egipto': 'eg', 'Egypt': 'eg',
    'Camerún': 'cm', 'Cameroon': 'cm',
    'Túnez': 'tn', 'Tunisia': 'tn',
    'Costa de Marfil': 'ci', 'Argelia': 'dz', 'Algeria': 'dz',
    'Sudáfrica': 'za', 'South Africa': 'za',
    'Mali': 'ml', 'Burkina Faso': 'bf',
    // Asia / Oceanía
    'Japón': 'jp', 'Japan': 'jp',
    'Corea del Sur': 'kr', 'South Korea': 'kr',
    'Arabia Saudita': 'sa', 'Saudi Arabia': 'sa',
    'Irán': 'ir', 'Iran': 'ir',
    'Qatar': 'qa', 'Australia': 'au',
    'China': 'cn', 'India': 'in',
    'Indonesia': 'id', 'Irak': 'iq', 'Iraq': 'iq',
    'Emiratos Árabes': 'ae', 'UAE': 'ae',
};

/** Renders a real flag image. Falls back to text if country not mapped. */
function FlagImg({ country, height = 14 }: { country: string; height?: number }) {
    if (!country) return null;
    const clean = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalized = clean(country);
    
    const foundKey = Object.keys(COUNTRY_FLAGS).find(
        key => clean(key) === normalized
    );
    const code = foundKey ? COUNTRY_FLAGS[foundKey] : null;

    if (!code) return <span className="font-bold">{country}</span>;
    return (
        <img
            src={`https://flagcdn.com/w40/${code}.png`}
            alt={country}
            title={country}
            style={{ height, display: 'inline-block', verticalAlign: 'middle', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        />
    );
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    type: 'confetti' | 'ball';
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    gravity: number;
    bounce: number;
    life: number;
    isExplosion: boolean;
}

const MX_COLORS = ['#006847', '#ffffff', '#CE1126', '#ffd700'];

function makeParticle(
    isExplosion: boolean,
    canvasW: number,
    canvasH: number,
    srcX?: number,
    srcY?: number,
    vxBase?: number,
    vyBase?: number
): Particle {
    const type: 'confetti' | 'ball' = Math.random() > 0.82 ? 'ball' : 'confetti';
    return {
        x: srcX ?? Math.random() * canvasW,
        y: srcY ?? -30,
        vx: vxBase ?? (Math.random() - 0.5) * 2,
        vy: vyBase ?? (1 + Math.random() * 2),
        size: type === 'ball'
            ? (isExplosion ? 26 + Math.random() * 10 : 18 + Math.random() * 10)
            : (isExplosion ? 7 + Math.random() * 8 : 4 + Math.random() * 6),
        color: MX_COLORS[Math.floor(Math.random() * MX_COLORS.length)],
        type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        opacity: 1,
        gravity: isExplosion ? 0.18 + Math.random() * 0.1 : 0.05 + Math.random() * 0.04,
        bounce: 0.35 + Math.random() * 0.25,
        life: 1,
        isExplosion,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium Soccer Ball Cursor (React-rendered, butter-smooth)
// ─────────────────────────────────────────────────────────────────────────────
function SoccerCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const posRef    = useRef({ x: -200, y: -200 });
    const targetRef = useRef({ x: -200, y: -200 });
    const rotRef    = useRef(0);
    const prevXRef  = useRef(-200);
    const scaleRef  = useRef(1);
    const visRef    = useRef(false);
    const animRef   = useRef<number | null>(null);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            targetRef.current = { x: e.clientX, y: e.clientY };
            visRef.current = true;

            const el = document.elementFromPoint(e.clientX, e.clientY);
            const clickable = el?.closest('a, button, [role="button"], input, select, textarea, label');
            scaleRef.current = clickable ? 1.35 : 1;
        };
        const onLeave = () => { visRef.current = false; };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseleave', onLeave);
        document.addEventListener('mouseleave', onLeave);

        const animate = () => {
            const cursor = cursorRef.current;
            if (cursor) {
                // Smooth lerp — feels like a real ball rolling
                posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.14;
                posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.14;

                // Rotate proportionally to horizontal speed
                const dx = posRef.current.x - prevXRef.current;
                rotRef.current += dx * 2.2;
                prevXRef.current = posRef.current.x;

                const size = 32;
                cursor.style.opacity   = visRef.current ? '1' : '0';
                cursor.style.transform =
                    `translate3d(${posRef.current.x - size / 2}px, ${posRef.current.y - size / 2}px, 0)` +
                    ` rotate(${rotRef.current}deg)` +
                    ` scale(${scaleRef.current})`;
            }
            animRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseleave', onLeave);
            document.removeEventListener('mouseleave', onLeave);
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: 32,
                height: 32,
                pointerEvents: 'none',
                zIndex: 999999,
                opacity: 0,
                willChange: 'transform, opacity',
                filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))',
                transition: 'opacity 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                lineHeight: 1,
            }}
        >
            ⚽
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main WorldCupTheme component
// ─────────────────────────────────────────────────────────────────────────────
export default function WorldCupTheme() {
    const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const [status, setStatus]           = useState<WorldCupStatus | null>(null);
    const [isGoalActive, setIsGoalActive] = useState(false);
    const [timeLeft, setTimeLeft]       = useState({ hours: 0, minutes: 0, seconds: 0 });

    // ── Listen for custom trigger event (from Admin simulation) ──────────────
    useEffect(() => {
        const handleTrigger = () => {
            triggerGoalCelebration();
        };
        window.addEventListener('world-cup:trigger-goal', handleTrigger);
        return () => window.removeEventListener('world-cup:trigger-goal', handleTrigger);
    }, []);

    const prevScoreRef   = useRef<number | null>(null);
    const prevLastGoalTimeRef = useRef<number | null>(null);
    const canvasRef      = useRef<HTMLCanvasElement | null>(null);
    const mouseRef       = useRef({ x: -9999, y: -9999 });
    const particlesRef   = useRef<Particle[]>([]);
    const animFrameRef   = useRef<number | null>(null);
    const isGoalActiveRef = useRef(false);

    // ── Polling ──────────────────────────────────────────────────────────────
    const fetchStatus = () => {
        axios.get(route('world-cup.status'))
            .then(res => {
                const data: WorldCupStatus = res.data;
                setStatus(data);

                if (data.enabled) {
                    const timeDiff = Math.abs(Math.floor(Date.now() / 1000) - data.last_goal_time);

                    if (prevLastGoalTimeRef.current !== null && data.last_goal_time > prevLastGoalTimeRef.current) {
                        triggerGoalCelebration();
                    } else if (prevLastGoalTimeRef.current === null && data.last_goal_time > 0 && timeDiff < 30) {
                        triggerGoalCelebration();
                    }
                    prevScoreRef.current = data.mexico_score;
                    prevLastGoalTimeRef.current = data.last_goal_time;
                } else {
                    prevScoreRef.current = null;
                    prevLastGoalTimeRef.current = null;
                }
            })
            .catch(() => {});
    };

    useEffect(() => {
        fetchStatus();
        const id = setInterval(fetchStatus, 10000);
        return () => clearInterval(id);
    }, []);

    // ── Body class ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (status?.enabled && !isAdminPage) {
            document.body.classList.add('world-cup-theme-active');
        } else {
            document.body.classList.remove('world-cup-theme-active');
        }
        return () => { document.body.classList.remove('world-cup-theme-active'); };
    }, [status, isAdminPage]);

    // ── Countdown ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!status || status.status !== 'countdown') return;
        const update = () => {
            const now    = new Date();
            let targetStr = status.match_datetime;
            let targetDate: Date | null = null;
            
            if (targetStr) {
                // Ensure datetime is interpreted in Mexico City (UTC-6) if no timezone is specified
                if (!targetStr.includes('Z') && !targetStr.includes('+') && !/[-+]\d{2}:?\d{2}$/.test(targetStr)) {
                    targetStr = targetStr + '-06:00';
                }
                targetDate = new Date(targetStr);
            }
            
            // If target is invalid or not provided, fallback to today's match kickoff in Mexico City timezone (UTC-6)
            if (!targetDate || isNaN(targetDate.getTime())) {
                targetDate = new Date('2026-06-11T13:00:00-06:00');
            }
            
            const diff = Math.max(0, targetDate.getTime() - now.getTime());
            setTimeLeft({
                hours:   Math.floor(diff / 3600000),
                minutes: Math.floor((diff % 3600000) / 60000),
                seconds: Math.floor((diff % 60000) / 1000),
            });
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [status]);

    // ── Goal celebration ─────────────────────────────────────────────────────
    const triggerGoalCelebration = () => {
        isGoalActiveRef.current = true;
        setIsGoalActive(true);
        document.body.classList.add('animate-shake');

        const canvas = canvasRef.current;
        const w = canvas?.width  ?? window.innerWidth;
        const h = canvas?.height ?? window.innerHeight;

        const bursts: Particle[] = [];
        for (let i = 0; i < 220; i++) {
            // Left corner
            const aL  = Math.random() * (Math.PI * 0.55) + Math.PI * 0.06;
            const spL = 10 + Math.random() * 16;
            bursts.push(makeParticle(true, w, h, 0, h, Math.cos(aL) * spL, -Math.abs(Math.sin(aL) * spL)));
            // Right corner
            const aR  = Math.PI - Math.random() * (Math.PI * 0.55) - Math.PI * 0.06;
            const spR = 10 + Math.random() * 16;
            bursts.push(makeParticle(true, w, h, w, h, Math.cos(aR) * spR, -Math.abs(Math.sin(aR) * spR)));
        }
        particlesRef.current.push(...bursts);

        setTimeout(() => {
            isGoalActiveRef.current = false;
            setIsGoalActive(false);
            document.body.classList.remove('animate-shake');
            particlesRef.current = particlesRef.current.filter(p => !p.isExplosion);
        }, 6000);
    };

    // ── Canvas particle engine ───────────────────────────────────────────────
    useEffect(() => {
        if (!status?.enabled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        // Seed 5 background balls scattered across the screen
        for (let i = 0; i < 5; i++) {
            const p = makeParticle(false, canvas.width, canvas.height);
            p.type = 'ball';
            p.size = 20 + Math.random() * 14;
            p.y    = Math.random() * canvas.height * 0.6;
            particlesRef.current.push(p);
        }

        // Occasionally drop a new ball from the top
        const spawnId = setInterval(() => {
            if (isGoalActiveRef.current) return;
            if (Math.random() < 0.4) {
                const p = makeParticle(false, canvas.width, canvas.height);
                p.type = 'ball';
                p.size = 18 + Math.random() * 16;
                p.x    = Math.random() * canvas.width;
                particlesRef.current.push(p);
            }
        }, 2800);

        // Stop spawning new balls after 25 seconds
        const stopSpawningTimeout = setTimeout(() => {
            clearInterval(spawnId);
        }, 25000);

        const mouse = mouseRef.current;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const pts = particlesRef.current;

            for (let i = pts.length - 1; i >= 0; i--) {
                const p = pts[i];

                p.vy += p.gravity;
                p.x  += p.vx;
                p.y  += p.vy;
                p.vx *= 0.993;
                p.rotation += p.rotationSpeed;

                // Mouse repulsion
                const dx   = p.x - mouse.x;
                const dy   = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110 && dist > 0) {
                    const force = (110 - dist) / 110;
                    p.vx += (dx / dist) * force * 3.2;
                    p.vy += (dy / dist) * force * 3.2;
                }

                // Bounce off floor
                if (p.y > canvas.height - 12) {
                    p.y  = canvas.height - 12;
                    p.vy = -Math.abs(p.vy) * p.bounce;
                    p.vx += (Math.random() - 0.5) * 1.2;
                }

                // Fade explosion particles
                if (p.isExplosion) {
                    p.life    = Math.max(0, p.life - 0.0035);
                    p.opacity = p.life;
                }

                // Draw
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.globalAlpha = p.opacity;

                if (p.type === 'ball') {
                    ctx.font         = `${p.size}px Arial`;
                    ctx.textAlign    = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('⚽', 0, 0);
                } else {
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.rect(-p.size / 2, -p.size, p.size, p.size * 2);
                    ctx.fill();
                }
                ctx.restore();

                // Cleanup
                if ((p.isExplosion && p.life <= 0) || (!p.isExplosion && p.y > canvas.height + 60)) {
                    pts.splice(i, 1);
                }
            }

            animFrameRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            clearInterval(spawnId);
            clearTimeout(stopSpawningTimeout);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            particlesRef.current = [];
        };
    }, [status?.enabled]);

    // ── Mouse tracking for canvas repulsion ──────────────────────────────────
    useEffect(() => {
        const onMove  = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
        const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
        window.addEventListener('mousemove',  onMove);
        window.addEventListener('mouseleave', onLeave);
        return () => {
            window.removeEventListener('mousemove',  onMove);
            window.removeEventListener('mouseleave', onLeave);
        };
    }, []);

    if (!status?.enabled) return null;

    return (
        <>
            {/* Particle canvas — always mounted while theme is active */}
            <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[40] w-full h-full"/>

            {/* Premium soccer ball cursor */}
            {!isAdminPage && <SoccerCursor />}

            {/* Top banner */}
            {!isAdminPage && (
                <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#006847] via-[#f7f7f7] to-[#CE1126] border-b border-black/10 shadow-md h-9 text-[11px] sm:text-xs flex items-center justify-center font-bold overflow-hidden select-none">
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-yellow-400 opacity-80"/>

                    {status.status === 'countdown' && (
                        <div className="flex items-center gap-1 sm:gap-1.5 text-gray-900 animate-pulse">
                            <FlagImg country="México" height={12} />
                            <span className="font-black hidden sm:inline">México</span>
                            <span className="font-black sm:hidden">MEX</span>
                            <span className="text-gray-600 font-bold">vs</span>
                            <FlagImg country={status.opponent} height={12} />
                            <span className="font-black hidden sm:inline">{status.opponent}</span>
                            <span className="font-black sm:hidden">{(status.opponent || 'Rival').substring(0, 3).toUpperCase()}</span>
                            <span className="text-gray-500 font-normal hidden sm:inline">|</span>
                            <span className="hidden sm:inline">¡El Mundial comienza en:</span>
                            <span className="inline sm:hidden">Comienza en:</span>
                            <span className="bg-black text-white px-1.5 py-0.5 rounded font-mono text-[10px] sm:text-[11px] shadow-sm">
                                {String(timeLeft.hours).padStart(2,'0')}h : {String(timeLeft.minutes).padStart(2,'0')}m : {String(timeLeft.seconds).padStart(2,'0')}s
                            </span>
                            <span className="hidden sm:inline">⚽🏆</span>
                        </div>
                    )}

                    {status.status === 'live' && (
                        <div className="flex items-center gap-1 sm:gap-1.5 text-gray-900">
                            <span className="inline-flex items-center px-1 py-0.5 rounded bg-red-600 text-white text-[8px] sm:text-[9px] uppercase tracking-wider animate-pulse font-black shadow-sm shrink-0">
                                🔴 EN VIVO
                            </span>
                            <FlagImg country="México" height={13} />
                            <span className="font-black hidden sm:inline">México</span>
                            <span className="font-black sm:hidden">MEX</span>
                            <span className="bg-black text-white px-2 py-0.5 rounded-full font-black text-xs sm:text-sm shadow-inner">{status.mexico_score}</span>
                            <span className="font-bold">-</span>
                            <span className="bg-black/80 text-white px-2 py-0.5 rounded-full font-black text-xs sm:text-sm shadow-inner">{status.opponent_score}</span>
                            <FlagImg country={status.opponent} height={13} />
                            <span className="font-black hidden sm:inline">{status.opponent}</span>
                            <span className="font-black sm:hidden">{(status.opponent || 'Rival').substring(0, 3).toUpperCase()}</span>
                            <span className="text-gray-500 font-normal hidden md:inline">|</span>
                            <span className="text-[#006847] animate-bounce font-black hidden md:inline">¡VAMOS MÉXICO! ⚽🔥</span>
                        </div>
                    )}

                    {status.status === 'finished' && (
                        <div className="flex items-center gap-1 sm:gap-1.5 text-gray-900">
                            <span className="inline-flex items-center px-1 py-0.5 rounded bg-gray-600 text-white text-[8px] sm:text-[9px] uppercase tracking-wider font-black shadow-sm shrink-0">FINALIZADO</span>
                            <span className="hidden sm:inline">Marcador Final:</span>
                            <FlagImg country="México" height={13} />
                            <span className="font-black hidden sm:inline">México</span>
                            <span className="font-black sm:hidden">MEX</span>
                            <span className="font-extrabold text-xs sm:text-sm">{status.mexico_score} - {status.opponent_score}</span>
                            <FlagImg country={status.opponent} height={13} />
                            <span className="font-black hidden sm:inline">{status.opponent}</span>
                            <span className="font-black sm:hidden">{(status.opponent || 'Rival').substring(0, 3).toUpperCase()}</span>
                            <span className="text-gray-500 font-normal hidden md:inline">|</span>
                            <span className="text-[#006847] hidden md:inline">¡Gracias por vivir el fútbol en Boletea! 🎉</span>
                        </div>
                    )}
                </div>
            )}

            {/* GOL overlay */}
            {isGoalActive && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-center items-center bg-black/75 backdrop-blur-[4px] pointer-events-none select-none overflow-hidden" style={{ animation: 'wcFadeIn 0.3s ease-out forwards' }}>
                    <div className="w-full bg-gradient-to-r from-[#006847] via-[#CE1126] to-[#006847] border-y-2 sm:border-y-4 border-yellow-400 py-3 sm:py-4 shadow-2xl relative overflow-hidden flex items-center" style={{ transform: 'rotate(-3deg) scaleX(1.08)' }}>
                        <div className="absolute inset-x-0 top-0.5 h-[1px] bg-yellow-300 opacity-60"/>
                        <div className="absolute inset-x-0 bottom-0.5 h-[1px] bg-yellow-300 opacity-60"/>
                        <div className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-wider flex items-center gap-8 sm:gap-12 whitespace-nowrap" style={{ animation: 'wcScrollGol 8s linear infinite' }}>
                            <span>¡GOOOOOOOOOOOOOOOOOOOL DE MÉXICO! ⚽</span>
                            <span>¡GOOOOOOOOOOOOOOOOOOOL DE MÉXICO! ⚽</span>
                            <span>¡GOOOOOOOOOOOOOOOOOOOL DE MÉXICO! ⚽</span>
                        </div>
                    </div>
                    <div className="mt-4 sm:mt-6 flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-2 sm:gap-3 text-white text-base sm:text-2xl font-black bg-black/60 py-1.5 px-5 sm:py-2 sm:px-6 rounded-full border border-yellow-400 sm:border-2 shadow-lg">
                            <span>MÉXICO ⚽</span>
                            <span className="text-yellow-400 text-lg sm:text-3xl font-black">{status.mexico_score}</span>
                        </div>
                        <div className="text-white/80 font-mono text-[8px] sm:text-[9px] tracking-widest uppercase mt-0.5 sm:mt-1 animate-pulse">
                            ⚽ TRANSMISIÓN EN VIVO ⚽
                        </div>
                    </div>
                </div>
            )}

            {/* Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                /* Hide native cursor everywhere while theme is active */
                body.world-cup-theme-active,
                body.world-cup-theme-active * {
                    cursor: none !important;
                }

                /* Avoid horizontal scrollbars due to rotations or screen shake */
                body.world-cup-theme-active {
                    overflow-x: hidden !important;
                }

                /* Header / main offset for top banner */
                body.world-cup-theme-active header {
                    top: 36px !important;
                    transition: top 0.3s ease-in-out;
                }
                body.world-cup-theme-active main {
                    margin-top: 36px !important;
                    transition: margin-top 0.3s ease-in-out;
                }

                /* GOL marquee scroll */
                @keyframes wcScrollGol {
                    from { transform: translate3d(0, 0, 0); }
                    to   { transform: translate3d(-33.3333%, 0, 0); }
                }

                /* Screen shake */
                @keyframes wcShake {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    15%  { transform: translate(-3px, -2px) rotate(-0.4deg); }
                    30%  { transform: translate(3px, -1px) rotate(0.4deg); }
                    50%  { transform: translate(-2px, 3px) rotate(0deg); }
                    70%  { transform: translate(3px, -2px) rotate(0.4deg); }
                    85%  { transform: translate(-2px, 2px) rotate(-0.4deg); }
                }
                .animate-shake { animation: wcShake 0.32s ease-in-out infinite; }

                @keyframes wcFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes wcPulse {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0.4; }
                }
            `}}/>
        </>
    );
}
