import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Title from './Title';
import { PrimaryButton } from './Buttons';
import { useTheme } from '../context/theme';

interface SessionUser {
    full_name: string;
    email: string;
    profile_image?: string | null;
}

interface SessionData {
    user?: SessionUser;
}

interface TestimonialCard {
    id: string;
    image?: string | null;
    name: string;
    handle: string;
    date: string;
    text: string;
}

interface TestimonialListResponse {
    items: TestimonialCard[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8001';

const cardsData: TestimonialCard[] = [
    {
        id: 'seed-1',
        image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200',
        name: 'Briar Martin',
        handle: '@neilstellar',
        date: 'April 20, 2025',
        text: 'Radiant made undercutting all of our competitors an absolute breeze.',
    },
    {
        id: 'seed-2',
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
        name: 'Avery Johnson',
        handle: '@averywrites',
        date: 'May 10, 2025',
        text: 'The dashboard is clean and the fake-news score is super easy to share with my team.',
    },
    {
        id: 'seed-3',
        image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60',
        name: 'Jordan Lee',
        handle: '@jordantalks',
        date: 'June 5, 2025',
        text: 'We now verify suspicious claims in minutes instead of spending hours chasing sources.',
    },
    {
        id: 'seed-4',
        image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60',
        name: 'Morgan Price',
        handle: '@morgannews',
        date: 'July 12, 2025',
        text: 'Great for editorial workflows. It helps us flag risky headlines before publishing.',
    },
];

function getSessionUser(): SessionUser | null {
    const rawSession = localStorage.getItem('verilens_session');
    if (!rawSession) {
        return null;
    }

    try {
        const parsed = JSON.parse(rawSession) as SessionData;
        return parsed.user ?? null;
    } catch {
        return null;
    }
}

export default function Testimonials() {
    const { isDark } = useTheme();
    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
    const [postText, setPostText] = useState('');
    const [apiCards, setApiCards] = useState<TestimonialCard[]>([]);
    const [posting, setPosting] = useState(false);

    const clearExpiredSession = () => {
        localStorage.removeItem('verilens_token');
        localStorage.removeItem('verilens_session');
        setSessionUser(null);
        toast.error('Session expired. Please log in again.');
    };

    useEffect(() => {
        setSessionUser(getSessionUser());

        const fetchTestimonials = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/testimonials`);
                if (!response.ok) {
                    return;
                }

                const payload = (await response.json()) as Partial<TestimonialListResponse>;
                if (Array.isArray(payload.items)) {
                    setApiCards(payload.items.slice(0, 24));
                }
            } catch {
                // Keep seed cards only if API is unavailable.
            }
        };

        void fetchTestimonials();

        const syncSession = () => {
            setSessionUser(getSessionUser());
        };

        window.addEventListener('storage', syncSession);
        return () => window.removeEventListener('storage', syncSession);
    }, []);

    const allCards = useMemo(() => [...apiCards, ...cardsData], [apiCards]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!sessionUser) {
            toast.error('Please log in to post a testimonial.');
            return;
        }

        const trimmed = postText.trim();
        if (trimmed.length < 8) {
            toast.error('Please write at least 8 characters.');
            return;
        }

        const token = localStorage.getItem('verilens_token');
        if (!token) {
            toast.error('Please log in to post.');
            return;
        }

        try {
            setPosting(true);
            const response = await fetch(`${API_BASE_URL}/testimonials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text: trimmed }),
            });

            const payload = (await response.json()) as Partial<TestimonialCard> & { detail?: string };
            if (response.status === 401 || payload.detail === 'Invalid or expired token.') {
                clearExpiredSession();
                return;
            }

            if (!response.ok || !payload.id || !payload.text) {
                toast.error(payload.detail ?? 'Could not post testimonial.');
                return;
            }

            setApiCards((prev) => [payload as TestimonialCard, ...prev].slice(0, 24));
            setPostText('');
            toast.success('Your testimonial has been posted.');
        } catch {
            toast.error('Unable to post testimonial right now.');
        } finally {
            setPosting(false);
        }
    };

    const CreateCard = ({ card }: { card: TestimonialCard }) => (
        <div
            className={`p-4 rounded-lg mx-4 shadow hover:shadow-lg transition-all duration-200 w-72 shrink-0 border ${
                isDark
                    ? 'bg-slate-900/70 border-white/10 text-gray-100'
                    : 'bg-white border-slate-200 text-slate-900'
            }`}
        >
            <div className="flex gap-2">
                {card.image ? (
                    <img className="size-11 rounded-full object-cover" src={card.image} alt="User Image" />
                ) : (
                    <div
                        className={`size-11 rounded-full flex items-center justify-center font-semibold ${
                            isDark ? 'bg-cyan-700/35 text-cyan-100' : 'bg-cyan-100 text-cyan-700'
                        }`}
                    >
                        {card.name[0]?.toUpperCase() ?? 'U'}
                    </div>
                )}
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <p>{card.name}</p>
                        <svg className="mt-0.5" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M4.555.72a4 4 0 0 1-.297.24c-.179.12-.38.202-.59.244a4 4 0 0 1-.38.041c-.48.039-.721.058-.922.129a1.63 1.63 0 0 0-.992.992c-.071.2-.09.441-.129.922a4 4 0 0 1-.041.38 1.6 1.6 0 0 1-.245.59 3 3 0 0 1-.239.297c-.313.368-.47.551-.56.743-.213.444-.213.96 0 1.404.09.192.247.375.56.743.125.146.187.219.24.297.12.179.202.38.244.59.018.093.026.189.041.38.039.48.058.721.129.922.163.464.528.829.992.992.2.071.441.09.922.129.191.015.287.023.38.041.21.042.411.125.59.245.078.052.151.114.297.239.368.313.551.47.743.56.444.213.96.213 1.404 0 .192-.09.375-.247.743-.56.146-.125.219-.187.297-.24.179-.12.38-.202.59-.244a4 4 0 0 1 .38-.041c.48-.039.721-.058.922-.129.464-.163.829-.528.992-.992.071-.2.09-.441.129-.922a4 4 0 0 1 .041-.38c.042-.21.125-.411.245-.59.052-.078.114-.151.239-.297.313-.368.47-.551.56-.743.213-.444.213-.96 0-1.404-.09-.192-.247-.375-.56-.743a4 4 0 0 1-.24-.297 1.6 1.6 0 0 1-.244-.59 3 3 0 0 1-.041-.38c-.039-.48-.058-.721-.129-.922a1.63 1.63 0 0 0-.992-.992c-.2-.071-.441-.09-.922-.129a4 4 0 0 1-.38-.041 1.6 1.6 0 0 1-.59-.245A3 3 0 0 1 7.445.72C7.077.407 6.894.25 6.702.16a1.63 1.63 0 0 0-1.404 0c-.192.09-.375.247-.743.56m4.07 3.998a.488.488 0 0 0-.691-.69l-2.91 2.91-.958-.957a.488.488 0 0 0-.69.69l1.302 1.302c.19.191.5.191.69 0z" fill="#2196F3" />
                        </svg>
                    </div>
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.handle}</span>
                </div>
            </div>
            <p className={`text-sm py-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{card.text}</p>
            <div className={`flex items-center justify-end text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <p>{card.date}</p>
            </div>
        </div>
    );

    return (
        <section id="testimonials" className={`py-20 border-t ${isDark ? 'border-white/6 bg-white/2' : 'border-slate-200 bg-white/40'}`}>
            <style>{`
                @keyframes marqueeScroll {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }

                .marquee-inner {
                    animation: marqueeScroll 25s linear infinite;
                }

                .marquee-reverse {
                    animation-direction: reverse;
                }
            `}</style>

            <div className="max-w-6xl mx-auto px-4">
                <Title
                    title="Testimonials"
                    heading="What teams are saying"
                    description="Share your experience after using VeriLens. Logged-in users can post testimonials instantly."
                />

                <form onSubmit={onSubmit} className={`mb-8 rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/90 shadow-lg shadow-slate-900/5'}`}>
                    <label htmlFor="testimonial-post" className={`text-sm font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                        Post your testimonial
                    </label>
                    <textarea
                        id="testimonial-post"
                        value={postText}
                        onChange={(event) => setPostText(event.target.value)}
                        placeholder={sessionUser ? 'Write what you liked about the platform...' : 'Log in to post your testimonial...'}
                        className={`mt-3 w-full min-h-28 rounded-xl border px-4 py-3 text-sm outline-none focus:border-cyan-400/50 ${
                            isDark
                                ? 'border-white/10 bg-black/30 text-white placeholder:text-gray-400'
                                : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400'
                        }`}
                        disabled={!sessionUser}
                    />
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <PrimaryButton type="submit" className="px-6 py-2.5" disabled={!sessionUser || posting}>
                            {posting ? 'Posting...' : 'Post testimonial'}
                        </PrimaryButton>
                        {!sessionUser && (
                            <Link to="/login" className={`text-sm font-medium ${isDark ? 'text-cyan-300 hover:text-cyan-200' : 'text-cyan-700 hover:text-cyan-600'}`}>
                                Log in to post
                            </Link>
                        )}
                    </div>
                </form>

                <div className="marquee-row w-full mx-auto overflow-hidden relative">
                    <div className={`absolute left-0 top-0 h-full w-16 md:w-24 z-10 pointer-events-none ${isDark ? 'bg-gradient-to-r from-[#0b1220] to-transparent' : 'bg-gradient-to-r from-[#f1f5f9] to-transparent'}`}></div>
                    <div className="marquee-inner flex transform-gpu min-w-[200%] pt-4 pb-3">
                        {[...allCards, ...allCards].map((card, index) => (
                            <CreateCard key={`${card.id}-a-${index}`} card={card} />
                        ))}
                    </div>
                    <div className={`absolute right-0 top-0 h-full w-16 md:w-24 z-10 pointer-events-none ${isDark ? 'bg-gradient-to-l from-[#0b1220] to-transparent' : 'bg-gradient-to-l from-[#f1f5f9] to-transparent'}`}></div>
                </div>

                <div className="marquee-row w-full mx-auto overflow-hidden relative">
                    <div className={`absolute left-0 top-0 h-full w-16 md:w-24 z-10 pointer-events-none ${isDark ? 'bg-gradient-to-r from-[#0b1220] to-transparent' : 'bg-gradient-to-r from-[#f1f5f9] to-transparent'}`}></div>
                    <div className="marquee-inner marquee-reverse flex transform-gpu min-w-[200%] pt-4 pb-3">
                        {[...allCards, ...allCards].map((card, index) => (
                            <CreateCard key={`${card.id}-b-${index}`} card={card} />
                        ))}
                    </div>
                    <div className={`absolute right-0 top-0 h-full w-16 md:w-24 z-10 pointer-events-none ${isDark ? 'bg-gradient-to-l from-[#0b1220] to-transparent' : 'bg-gradient-to-l from-[#f1f5f9] to-transparent'}`}></div>
                </div>
            </div>
        </section>
    );
}
