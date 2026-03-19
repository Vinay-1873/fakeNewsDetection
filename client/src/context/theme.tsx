import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'verilens_theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
    if (typeof window === 'undefined') {
        return 'dark';
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
    }

    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const value = useMemo<ThemeContextValue>(
        () => ({
            theme,
            isDark: theme === 'dark',
            toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
            setTheme,
        }),
        [theme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used inside ThemeProvider.');
    }
    return context;
}
