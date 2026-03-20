import { Check } from 'lucide-react';
import { PrimaryButton, GhostButton } from './Buttons';
import Title from './Title';
import { plansData } from '../assets/dummy-data';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/theme';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { clearAuthSession, getValidSession } from '../utils/session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8001';

type PlanId = 'starter' | 'pro' | 'ultra';

interface SessionUser {
    subscription_plan?: PlanId;
}

export default function Pricing() {
    const refs = useRef<(HTMLDivElement | null)[]>([]);
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [currentPlan, setCurrentPlan] = useState<PlanId>('starter');

    useEffect(() => {
        const session = getValidSession<SessionUser>();
        if (!session?.user) {
            setCurrentPlan('starter');
            return;
        }

        const plan = session.user.subscription_plan;
        if (plan === 'starter' || plan === 'pro' || plan === 'ultra') {
            setCurrentPlan(plan);
            return;
        }

        setCurrentPlan('starter');
    }, []);

    const startStripeCheckout = async (planId: string, planName: string) => {
        const token = localStorage.getItem('verilens_token');
        if (!token) {
            toast.error(`Please log in to continue with ${planName}.`, { id: 'stripe-login-required' });
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/billing/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ plan_id: planId }),
            });

            const payload = (await response.json()) as { checkout_url?: string; detail?: string };

            if (response.status === 401) {
                clearAuthSession();
                toast.error('Session expired. Please log in again.', { id: 'stripe-session-expired' });
                navigate('/login');
                return;
            }

            if (!response.ok || !payload.checkout_url) {
                throw new Error(payload.detail ?? 'Unable to start Stripe checkout.');
            }

            window.location.href = payload.checkout_url;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to start Stripe checkout.';
            toast.error(message);
        }
    };
    return (
        <section id="pricing" className={`py-20 border-t ${isDark ? 'bg-white/3 border-white/6' : 'bg-white/55 border-slate-200'}`}>
            <div className="max-w-6xl mx-auto px-4">

                <Title
                    title="Pricing"
                    heading="Simple plans for every team"
                    description="Start free, scale as your verification workload grows, and unlock enterprise-grade controls when needed."
                />

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {plansData.map((plan, i) => {
                        const isCurrentPlan = currentPlan === plan.id;
                        const ctaLabel = plan.id === 'pro' ? 'Upgrade to Pro' : plan.id === 'ultra' ? 'Get Custom Plan' : 'Starter plan';

                        return (
                        <motion.div
                            key={i}

                            ref={(el) => {
                                refs.current[i] = el;
                            }}
                            initial={{ y: 150, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 + i * 0.1 }}
                            onAnimationComplete={() => {
                                const card = refs.current[i];
                                if (card) {
                                    card.classList.add("transition", "duration-500", "hover:scale-102");
                                }
                            }}
                            className={`relative p-6 rounded-xl border backdrop-blur h-full flex flex-col ${plan.popular
                                ? isDark
                                    ? 'border-cyan-500/50 bg-cyan-900/20'
                                    : 'border-cyan-300 bg-cyan-50/90 shadow-xl shadow-cyan-900/10'
                                : isDark
                                    ? 'border-white/8 bg-slate-950/40'
                                    : 'border-slate-200 bg-white/90 shadow-xl shadow-slate-900/5'
                                }`}
                        >
                            {plan.popular && (
                                <p className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-600 rounded-md text-xs">
                                    Most popular
                                </p>
                            )}

                            <div className="mb-6">
                                <p>{plan.name}</p>
                                <div className="flex items-end gap-3">
                                    <span className="text-3xl font-extrabold">{plan.price}</span>
                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                        / {plan.credits}
                                    </span>
                                </div>
                                <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                    {plan.desc}
                                </p>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feat, i) => (
                                    <li
                                        key={i}
                                        className={`flex items-center gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}
                                    >
                                        <Check className="w-4 h-4 text-cyan-400" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto">
                                {isCurrentPlan ? (
                                    <GhostButton className="w-full justify-center" disabled>
                                        Current plan
                                    </GhostButton>
                                ) : plan.id === 'starter' ? (
                                    <GhostButton className="w-full justify-center" disabled>
                                        Starter plan
                                    </GhostButton>
                                ) : (
                                    <PrimaryButton className="w-full" onClick={() => startStripeCheckout(plan.id, plan.name)}>
                                        {ctaLabel}
                                    </PrimaryButton>
                                )}
                            </div>
                        </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};