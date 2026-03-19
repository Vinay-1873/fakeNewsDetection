import { motion } from 'framer-motion';
import { useTheme } from '../context/theme';

interface TitleProps {
    title?: string;
    heading?: string;
    description?: string;
}

export default function Title({ title, heading, description }: TitleProps) {
    const { isDark } = useTheme();

    return (
        <div className="text-center mb-16">
            {title && (
                <motion.p
                    initial={{ y: 60, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
                    className="text-sm font-medium text-cyan-400 uppercase tracking-wide mb-3"
                >
                    {title}
                </motion.p>
            )}
            {heading && (
                <motion.h2 className={`text-2xl md:text-4xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    initial={{ y: 60, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 }}
                >
                    {heading}
                </motion.h2>
            )}
            {description && (
                <motion.p className={`max-w-md mx-auto text-sm my-3 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}
                    initial={{ y: 60, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.2 }}
                >
                    {description}
                </motion.p>
            )}
        </div>
    )
}