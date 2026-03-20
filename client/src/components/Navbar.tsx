import { ChevronDownIcon, LogOutIcon, MenuIcon, MoonIcon, SunIcon, UserCircle2Icon, XIcon } from 'lucide-react';
import { PrimaryButton } from './Buttons';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Brand from './Brand';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/theme';
import { clearAuthSession, getValidSession } from '../utils/session';

interface SessionUser {
    full_name: string;
    email: string;
    profile_image?: string | null;
}

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { isDark, toggleTheme } = useTheme();

    const navLinks = [
        { name: 'Home', href: '/#' },
        { name: 'Analyze', href: '/analyze' },
        { name: 'Demo', href: '/#demo' },
        { name: 'Testimonials', href: '/#testimonials' },
        { name: 'FAQ', href: '/#faq' },
    ];
    const visibleNavLinks = pathname === '/analyze'
        ? navLinks.filter((link) => link.name !== 'Demo')
        : navLinks;

    useEffect(() => {
        const session = getValidSession<SessionUser>();
        if (!session?.user) {
            setSessionUser(null);
            return;
        }

        setSessionUser(session.user);
    }, [pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!dropdownRef.current) {
                return;
            }

            if (!dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const logout = () => {
        clearAuthSession();
        setSessionUser(null);
        setIsProfileOpen(false);
        setIsOpen(false);
        toast.success('Logged out successfully.');
        navigate('/');
    };

    const firstName = sessionUser?.full_name.split(' ')[0] ?? '';

    return (
        <motion.nav className='fixed top-5 left-0 right-0 z-50 px-4'
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
        >
            <div className={`max-w-6xl mx-auto flex items-center justify-between backdrop-blur-md rounded-2xl p-3 ${
                isDark
                    ? 'bg-black/50 border border-white/4'
                    : 'bg-white/80 border border-slate-900/10 shadow-xl shadow-slate-900/5'
            }`}>
                <a href='/#' aria-label='Go to homepage'>
                    <Brand compact />
                </a>

                <div className={`hidden md:flex items-center gap-8 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    {visibleNavLinks.map((link) => (
                        <a href={link.href} key={link.name} className={`transition ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>
                            {link.name}
                        </a>
                    ))}
                </div>

                <div className='hidden md:flex items-center gap-3'>
                    <button
                        onClick={toggleTheme}
                        className={`inline-flex items-center justify-center size-10 rounded-full border transition ${
                            isDark
                                ? 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                                : 'border-slate-900/10 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    >
                        {isDark ? <SunIcon className='size-4' /> : <MoonIcon className='size-4' />}
                    </button>

                    {sessionUser ? (
                        <div className='relative' ref={dropdownRef}>
                            <button
                                onClick={() => setIsProfileOpen((prev) => !prev)}
                                className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-sm transition ${
                                    isDark
                                        ? 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                                        : 'border-slate-900/10 bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                {sessionUser.profile_image ? (
                                    <img src={sessionUser.profile_image} alt='profile' className={`size-8 rounded-full object-cover border ${isDark ? 'border-white/10' : 'border-slate-900/10'}`} />
                                ) : (
                                    <span className={`inline-flex size-8 items-center justify-center rounded-full border ${isDark ? 'bg-cyan-700/40 border-cyan-500/40' : 'bg-cyan-100 border-cyan-300'}`}>
                                        {firstName ? firstName[0].toUpperCase() : <UserCircle2Icon className='size-4' />}
                                    </span>
                                )}
                                <ChevronDownIcon className={`size-4 ${isDark ? 'text-gray-300' : 'text-slate-500'}`} />
                            </button>

                            {isProfileOpen && (
                                <div className={`absolute right-0 mt-2 w-64 rounded-2xl border p-2 shadow-2xl backdrop-blur-md ${
                                    isDark
                                        ? 'border-white/10 bg-slate-950/95'
                                        : 'border-slate-900/10 bg-white/95'
                                }`}>
                                    <button
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            navigate('/profile');
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition text-sm inline-flex items-center gap-2 ${
                                            isDark
                                                ? 'hover:bg-white/10 text-gray-200'
                                                : 'hover:bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        <UserCircle2Icon className='size-4' />
                                        Profile
                                    </button>

                                    <button
                                        onClick={logout}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition text-sm inline-flex items-center gap-2 ${
                                            isDark
                                                ? 'hover:bg-white/10 text-gray-200'
                                                : 'hover:bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        <LogOutIcon className='size-4' />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link to='/login' className={`text-sm font-medium transition max-sm:hidden ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>
                                Log in
                            </Link>
                            <Link to='/signup'>
                                <PrimaryButton className='max-sm:text-xs hidden sm:inline-block'>Sign Up</PrimaryButton>
                            </Link>
                        </>
                    )}
                </div>

                <button onClick={() => setIsOpen(!isOpen)} className={`md:hidden ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <MenuIcon className='size-6' />
                </button>
            </div>
            <div className={`flex flex-col items-center justify-center gap-6 text-lg font-medium fixed inset-0 backdrop-blur-md z-50 transition-all duration-300 ${
                isDark ? 'bg-black/40 text-gray-100' : 'bg-white/70 text-slate-800'
            } ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                {visibleNavLinks.map((link) => (
                    <a key={link.name} href={link.href} onClick={() => setIsOpen(false)}>
                        {link.name}
                    </a>
                ))}

                <button
                    onClick={toggleTheme}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                        isDark
                            ? 'border-white/10 bg-white/5 text-gray-100 hover:bg-white/10'
                            : 'border-slate-900/10 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    {isDark ? <SunIcon className='size-4' /> : <MoonIcon className='size-4' />}
                    {isDark ? 'Light mode' : 'Dark mode'}
                </button>

                {sessionUser ? (
                    <>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/profile');
                            }}
                            className={`font-medium transition ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}
                        >
                            Profile
                        </button>
                        <button onClick={logout} className={`font-medium transition ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to='/login' onClick={() => setIsOpen(false)} className={`font-medium transition ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>
                            Log in
                        </Link>
                        <Link to='/signup' onClick={() => setIsOpen(false)}>
                            <PrimaryButton>Sign Up</PrimaryButton>
                        </Link>
                    </>
                )}

                <button
                    onClick={() => setIsOpen(false)}
                    className={`rounded-md p-2 active:ring-2 ${isDark ? 'bg-white text-gray-800 ring-white' : 'bg-slate-900 text-white ring-slate-900/30'}`}
                >
                    <XIcon />
                </button>
            </div>
        </motion.nav>
    );
};