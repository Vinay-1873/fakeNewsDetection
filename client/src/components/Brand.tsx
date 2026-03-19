import { ShieldCheckIcon } from 'lucide-react';
import { useTheme } from '../context/theme';

interface BrandProps {
    compact?: boolean;
}

export default function Brand({ compact = false }: BrandProps) {
    const { isDark } = useTheme();

    return (
        <div className="inline-flex items-center gap-3">
            <span className={`inline-flex size-9 items-center justify-center rounded-xl bg-linear-to-br border ${
                isDark
                    ? 'from-cyan-500/30 to-sky-500/30 border-cyan-300/30'
                    : 'from-cyan-200 to-sky-200 border-cyan-300/70'
            }`}>
                <ShieldCheckIcon className={`size-5 ${isDark ? 'text-cyan-200' : 'text-cyan-700'}`} />
            </span>
            <div className="leading-tight">
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} ${compact ? 'text-sm' : 'text-base'}`}>
                    VeriLens
                </p>
                <p className={`${isDark ? 'text-cyan-200/80' : 'text-cyan-700/80'} ${compact ? 'text-[10px]' : 'text-xs'}`}>
                    Fake News Detection
                </p>
            </div>
        </div>
    );
}
