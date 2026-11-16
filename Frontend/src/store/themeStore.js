import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyThemeToDOM = (theme) => {
    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }
};

export const useThemeStore = create(
    persist(
        (set) => ({
            theme: 'light',
            toggleTheme: () => set((state) => {
                const nextTheme = state.theme === 'light' ? 'dark' : 'light';
                applyThemeToDOM(nextTheme);
                return { theme: nextTheme };
            }),
            setTheme: (theme) => {
                applyThemeToDOM(theme);
                set({ theme });
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                if (state?.theme) {
                    applyThemeToDOM(state.theme);
                }
            }
        }
    )
);

// Apply immediately on load from localStorage if present
if (typeof window !== 'undefined') {
    try {
        const stored = localStorage.getItem('theme-storage');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.state?.theme) {
                applyThemeToDOM(parsed.state.theme);
            }
        }
    } catch (e) {
        console.error('Error reading theme from storage:', e);
    }
}
