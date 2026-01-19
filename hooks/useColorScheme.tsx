import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme as useSystemColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
    colorScheme: ColorScheme;
    setColorScheme: (scheme: ColorScheme) => void;
    toggleColorScheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
    const systemScheme = useSystemColorScheme();
    const [colorScheme, setColorSchemeState] = useState<ColorScheme>('dark');

    // Load saved preference on mount
    useEffect(() => {
        if (Platform.OS === 'web') {
            try {
                const saved = localStorage.getItem('deployguard_theme');
                if (saved === 'light' || saved === 'dark') {
                    setColorSchemeState(saved);
                }
            } catch (e) {
                // Ignore localStorage errors
            }
        }
    }, []);

    const setColorScheme = (scheme: ColorScheme) => {
        setColorSchemeState(scheme);
        if (Platform.OS === 'web') {
            try {
                localStorage.setItem('deployguard_theme', scheme);
                // Update body background for web
                document.body.style.backgroundColor = scheme === 'dark' ? '#0F172A' : '#F8FAFC';
            } catch (e) {
                // Ignore localStorage errors
            }
        }
    };

    const toggleColorScheme = () => {
        setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
    };

    const value: ThemeContextType = {
        colorScheme,
        setColorScheme,
        toggleColorScheme,
        isDark: colorScheme === 'dark',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (!context) {
        // Return default values if not in a ThemeProvider
        return {
            colorScheme: 'dark',
            setColorScheme: () => { },
            toggleColorScheme: () => { },
            isDark: true,
        };
    }
    return context;
}

// Export a hook that returns the color scheme for backwards compatibility
export function useColorScheme(): ColorScheme {
    const context = useContext(ThemeContext);
    // If not in ThemeProvider, fall back to 'dark'
    return context?.colorScheme ?? 'dark';
}
