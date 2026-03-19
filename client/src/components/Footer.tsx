import { footerLinks } from '../assets/dummy-data';
import { motion } from 'framer-motion';
import Brand from './Brand';
import { useTheme } from '../context/theme';

export default function Footer() {
    const { isDark } = useTheme();

    return (
        <motion.footer className={`pt-10 ${isDark ? 'bg-white/6 border-t border-white/6 text-gray-300' : 'bg-white/70 border-t border-slate-200 text-slate-600'}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.5 }}
        >
            <div className="max-w-6xl mx-auto px-6">
                <div className={`flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <div>
                        <a href="/#" aria-label="Go to homepage">
                            <Brand />
                        </a>
                        <p className="max-w-[410px] mt-6 text-sm leading-relaxed">
                            We build machine-learning tools that help people identify misinformation quickly, explain verdicts clearly and publish with confidence.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-between w-full md:w-[45%] gap-5">
                        {footerLinks.map((section, index) => (
                            <div key={index}>
                                <h3 className={`font-semibold text-base md:mb-5 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {section.title}
                                </h3>
                                <ul className="text-sm space-y-1">
                                    {section.links.map(
                                        (link: { name: string; url: string }, i) => (
                                            <li key={i}>
                                                <a
                                                    href={link.url}
                                                    className={`transition ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
                                                >
                                                    {link.name}
                                                </a>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <p className={`py-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    © {new Date().getFullYear()} {' '}
                    <a href="/#">
                        VeriLens
                    </a>
                    . All rights reserved.
                </p>
            </div>
        </motion.footer>
    );
};