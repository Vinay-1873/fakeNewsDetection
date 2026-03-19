import { useRef } from 'react';
import { featuresData } from '../assets/dummy-data';
import Title from './Title';
import { motion } from 'framer-motion';
import { useTheme } from '../context/theme';

export default function Features() {
    const refs = useRef<(HTMLDivElement | null)[]>([]);
    const { isDark } = useTheme();
    return (
        <section id="features" className="py-20 2xl:py-32">
            <div className="max-w-6xl mx-auto px-4">

                <Title
                    title="Core Features"
                    heading="Built for fast and reliable fact-checking"
                    description="From journalists to research teams, verify content quickly with explainable machine learning signals."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featuresData.map((feature, i) => (
                        <motion.div
                            ref={(el) => {
                                refs.current[i] = el;
                            }}
                            initial={{ y: 100, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 + i * 0.1 }}
                            key={i}
                            onAnimationComplete={() => {
                                const card = refs.current[i];
                                if (card) {
                                    card.classList.add("transition", "duration-300", "hover:-translate-y-1");
                                }
                            }}
                            className={`rounded-2xl p-6 border ${
                                isDark
                                    ? 'bg-white/3 border-white/6 hover:border-white/15'
                                    : 'bg-white/85 border-slate-200 hover:border-cyan-300 shadow-xl shadow-slate-900/5'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isDark ? 'bg-violet-900/20' : 'bg-cyan-100'}`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};