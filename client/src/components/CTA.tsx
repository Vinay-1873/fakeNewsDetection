import { ArrowRightIcon } from 'lucide-react';
import { GhostButton } from './Buttons';
import { motion } from 'framer-motion';
import { useTheme } from '../context/theme';

export default function CTA() {
    const { isDark } = useTheme();

    return (
        <section id="contact" className="py-20 2xl:pb-32 px-4">
            <div className="container mx-auto max-w-3xl">
                <div className={`rounded-3xl border p-12 md:p-16 text-center relative overflow-hidden ${
                    isDark
                        ? 'bg-linear-to-b from-cyan-900/25 to-sky-900/10 border-cyan-500/20'
                        : 'bg-linear-to-b from-cyan-100 to-sky-100 border-cyan-300 shadow-2xl shadow-cyan-900/10'
                }`}>
                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
                    <div className="relative z-10">
                        <motion.h2 className="text-2xl sm:text-4xl font-semibold mb-6"
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
                        >
                            Ready to stop misinformation faster?
                        </motion.h2>
                        <motion.p className={`max-sm:text-sm mb-10 max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.2 }}
                        >
                            Launch your fake-news detection workflow in minutes. Upload a headline, paste a link or connect your API pipeline.
                        </motion.p>
                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.3 }}
                        >
                            <a href="/analyze">
                                <GhostButton className="px-8 py-3 gap-2">
                                    Start free analysis <ArrowRightIcon size={20} />
                                </GhostButton>
                            </a>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};