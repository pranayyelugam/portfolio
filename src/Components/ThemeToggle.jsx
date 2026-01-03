import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.scss';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'futuristic' ? 'professional' : 'futuristic'} theme`}
        >
            <span className="toggle-track">
                <span className={`toggle-thumb ${theme}`}>
                    {theme === 'futuristic' ? '🚀' : '🎓'}
                </span>
            </span>
            <span className="toggle-label">
                {theme === 'futuristic' ? 'DARK' : 'LIGHT'}
            </span>
        </button>
    );
};

export default ThemeToggle;
