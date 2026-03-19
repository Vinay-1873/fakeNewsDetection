import { ArrowRightIcon, PlayIcon, ZapIcon, CheckIcon } from 'lucide-react';
import { PrimaryButton, GhostButton } from './Buttons';
import { motion } from 'framer-motion';
import { useTheme } from '../context/theme';

export default function Hero() {
    const { isDark } = useTheme();
    const mainImageUrl = 'https://images.unsplash.com/photo-1504711331083-9c895941bf81?q=80&w=1600&auto=format&fit=crop';

    const galleryStripImages = [
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=100',
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=100',
        'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=100',
    ];

    const trustedLogosText = [
        'Newsrooms',
        'Fact-checkers',
        'Researchers',
        'Media teams',
        'EdTech platforms'
    ];

    return (
        <>
            <section id="home" className="relative z-10">
                <div className="max-w-6xl mx-auto px-4 min-h-screen max-md:w-screen max-md:overflow-hidden pt-32 md:pt-26 flex items-center justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="text-left">
                            <motion.h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 max-w-xl"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 }}
                            >
                                Detect fake news <br />
                                <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-300 to-sky-400">
                                    before it spreads
                                </span>
                            </motion.h1>

                            <motion.p className={`max-w-lg mb-8 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.2 }}
                            >
                                Verify headlines, article links and social claims with a machine-learning
                                workflow built for speed, explainability and newsroom confidence.
                            </motion.p>

                            <motion.div className="flex flex-col sm:flex-row items-center gap-4 mb-8"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.3 }}
                            >
                                <a href="/#demo" className="w-full sm:w-auto">
                                    <PrimaryButton className="max-sm:w-full py-3 px-7">
                                        Start free analysis
                                        <ArrowRightIcon className="size-4" />
                                    </PrimaryButton>
                                </a>

                                <a href="/#demo" className="w-full sm:w-auto">
                                    <GhostButton className="max-sm:w-full max-sm:justify-center py-3 px-5">
                                        <PlayIcon className="size-4" />
                                        Watch demo
                                    </GhostButton>
                                </a>
                            </motion.div>

                            <motion.div className={`flex sm:inline-flex overflow-hidden items-center max-sm:justify-center text-sm rounded ${
                                isDark ? 'text-gray-200 bg-white/10' : 'text-slate-700 bg-white/85 border border-slate-200'
                            }`}
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 }}
                            >
                                <div className="flex items-center gap-2 p-2 px-3 sm:px-6.5 hover:bg-white/3 transition-colors">
                                    <ZapIcon className="size-4 text-sky-500" />
                                    <div>
                                        <div>ML confidence scoring</div>
                                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                            Evidence-backed verdicts
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden sm:block h-6 w-px bg-white/6" />

                                <div className="flex items-center gap-2 p-2 px-3 sm:px-6.5 hover:bg-white/3 transition-colors">
                                    <CheckIcon className="size-4 text-cyan-500" />
                                    <div>
                                        <div>Human-review workflow</div>
                                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                            Built for editorial teams
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right: modern mockup card */}
                        <motion.div className="mx-auto w-full max-w-lg"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.5 }}
                        >
                            <motion.div className={`rounded-3xl overflow-hidden border shadow-2xl bg-linear-to-b ${
                                isDark
                                    ? 'border-white/6 from-black/50 to-transparent'
                                    : 'border-slate-200 from-white/90 to-slate-100/30'
                            }`}>
                                <div className={`relative aspect-16/10 ${isDark ? 'bg-gray-900' : 'bg-slate-200'}`}>
                                    <img
                                        src={mainImageUrl}
                                        alt="agency-work-preview"
                                        className="w-full h-full object-cover object-center"
                                    />

                                    <div className={`absolute left-4 top-4 px-3 py-1 rounded-full backdrop-blur-sm text-xs ${
                                        isDark ? 'bg-black/15 text-white' : 'bg-white/85 text-slate-700 border border-slate-200'
                                    }`}>
                                        Live Signal • URL Scan • Claim Check
                                    </div>

                                    <div className="absolute right-4 bottom-4">
                                        <a href="/#demo" className={`inline-flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm transition focus:outline-none ${
                                            isDark ? 'bg-white/6 hover:bg-white/10 text-white' : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200'
                                        }`}>
                                            <PlayIcon className="size-4" />
                                            <span className="text-xs">See model output</span>
                                        </a>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="mt-4 flex gap-3 items-center justify-start">
                                {galleryStripImages.map((src, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 20, opacity: 0 }}
                                        whileInView={{ y: 0, opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 + i * 0.1 }}
                                        className={`w-14 h-10 rounded-lg overflow-hidden border ${isDark ? 'border-white/6' : 'border-slate-200'}`}
                                    >
                                        <img
                                            src={src}
                                            alt="project-thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.div>
                                ))}
                                <motion.div className={`text-sm ml-2 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}
                                    initial={{ y: 60, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.2 }}
                                >
                                    <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping duration-300" />

                                        <span className="relative inline-flex size-2 rounded-full bg-green-600" />
                                    </div>
                                    1M+ claims analyzed
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* LOGO MARQUEE */}
            <motion.section className={`border-y max-md:mt-10 ${isDark ? 'border-white/6 bg-white/1' : 'border-slate-200 bg-white/50'}`}
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="w-full overflow-hidden py-6">
                        <div className="flex gap-14 items-center justify-center animate-marquee whitespace-nowrap">
                            {trustedLogosText.concat(trustedLogosText).map((logo, i) => (
                                <span
                                    key={i}
                                    className={`mx-6 text-sm md:text-base font-semibold tracking-wide transition-colors ${
                                        isDark ? 'text-gray-400 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {logo}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.section>
        </>
    );
};