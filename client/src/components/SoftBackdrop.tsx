import { useTheme } from '../context/theme';

export default function SoftBackdrop() {
    const { isDark } = useTheme();

    return (
        <div className="fixed inset-0 -z-1 pointer-events-none">
            <div
                className={`absolute left-1/2 top-20 -translate-x-1/2 w-[980px] h-[460px] bg-linear-to-tr rounded-full blur-3xl ${
                    isDark ? 'from-cyan-800/35 to-transparent' : 'from-cyan-400/30 to-transparent'
                }`}
            />
            <div
                className={`absolute right-12 bottom-10 w-[420px] h-[220px] bg-linear-to-bl rounded-full blur-2xl ${
                    isDark ? 'from-sky-700/35 to-transparent' : 'from-sky-500/30 to-transparent'
                }`}
            />
        </div>
    )
}