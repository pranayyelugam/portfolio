import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage for saved theme preference
        const saved = localStorage.getItem('portfolio-theme');
        return saved || 'professional';
    });

    useEffect(() => {
        // Save theme preference to localStorage
        localStorage.setItem('portfolio-theme', theme);
        
        // Apply theme class to document body
        document.body.classList.remove('theme-futuristic', 'theme-professional');
        document.body.classList.add(`theme-${theme}`);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'futuristic' ? 'professional' : 'futuristic');
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
