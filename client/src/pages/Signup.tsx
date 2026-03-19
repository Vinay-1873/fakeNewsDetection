import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SoftBackdrop from '../components/SoftBackdrop';
import Brand from '../components/Brand';
import { PrimaryButton } from '../components/Buttons';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/theme';

interface AuthResponse {
    access_token: string;
    token_type: string;
    user: {
        full_name: string;
        email: string;
        profile_image?: string | null;
    };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export default function Signup() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password.length < 6) {
            const message = 'Password must be at least 6 characters.';
            toast.error(message);
            return;
        }

        if (password !== confirmPassword) {
            const message = 'Passwords do not match.';
            toast.error(message);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    full_name: fullName.trim(),
                    email: email.trim(),
                    password,
                }),
            });

            const payload = (await response.json()) as Partial<AuthResponse> & { detail?: string };

            if (!response.ok) {
                const message = payload.detail ?? 'Signup failed. Please try again.';
                toast.error(message);
                return;
            }

            localStorage.setItem('verilens_token', payload.access_token ?? '');
            localStorage.setItem(
                'verilens_session',
                JSON.stringify({
                    tokenType: payload.token_type ?? 'bearer',
                    user: payload.user,
                    loggedInAt: new Date().toISOString(),
                })
            );

            toast.success('Account created successfully!');
            navigate('/');
        } catch {
            const message = 'Unable to reach auth server. Ensure backend is running and CORS is configured.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={`min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden ${
            isDark ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'
        }`}>
            <SoftBackdrop />
            <div className={`relative z-10 w-full max-w-md rounded-3xl border backdrop-blur-md p-8 ${
                isDark ? 'border-white/10 bg-black/35' : 'border-slate-900/10 bg-white/85 shadow-2xl shadow-slate-900/10'
            }`}>
                <Link to="/" className="inline-block mb-8" aria-label="Go to homepage">
                    <Brand />
                </Link>

                <h1 className="text-3xl font-semibold">Create your account</h1>
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Start verifying headlines and articles in minutes.</p>

                <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`} htmlFor="signup-name">Full name</label>
                        <input
                            id="signup-name"
                            type="text"
                            required
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-cyan-400/50 ${
                                isDark ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-white'
                            }`}
                            placeholder="Your full name"
                        />
                    </div>

                    <div>
                        <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`} htmlFor="signup-email">Email</label>
                        <input
                            id="signup-email"
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-cyan-400/50 ${
                                isDark ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-white'
                            }`}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`} htmlFor="signup-password">Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-cyan-400/50 ${
                                isDark ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-white'
                            }`}
                            placeholder="Create a password"
                        />
                    </div>

                    <div>
                        <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`} htmlFor="signup-confirm-password">Confirm password</label>
                        <input
                            id="signup-confirm-password"
                            type="password"
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-cyan-400/50 ${
                                isDark ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-white'
                            }`}
                            placeholder="Confirm your password"
                        />
                    </div>

                    <PrimaryButton type="submit" className="w-full justify-center py-3 disabled:opacity-60" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </PrimaryButton>
                </form>

                <p className={`text-sm mt-6 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                    Already have an account?{' '}
                    <Link to="/login" className="text-cyan-300 hover:text-cyan-200">Log in</Link>
                </p>
            </div>
        </main>
    );
}
