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

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                }),
            });

            const payload = (await response.json()) as Partial<AuthResponse> & { detail?: string };

            if (!response.ok) {
                const message = payload.detail ?? 'Login failed. Please check your credentials.';
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

            toast.success('Login successful. Welcome back!');
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

                <h1 className="text-3xl font-semibold">Welcome back</h1>
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Log in to continue checking content credibility.</p>

                <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`} htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
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
                        <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`} htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-cyan-400/50 ${
                                isDark ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-white'
                            }`}
                            placeholder="Enter your password"
                        />
                    </div>

                    <PrimaryButton type="submit" className="w-full justify-center py-3 disabled:opacity-60" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </PrimaryButton>
                </form>

                <p className={`text-sm mt-6 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                    Don&apos;t have an account?{' '}
                    <Link to="/signup" className="text-cyan-300 hover:text-cyan-200">Sign up</Link>
                </p>
            </div>
        </main>
    );
}
