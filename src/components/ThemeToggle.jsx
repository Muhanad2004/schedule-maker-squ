import { useTheme } from './ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'theme1' ? 'Switch to Theme 2' : 'Switch to Theme 1'}
        >
            {theme === 'theme1' ? '🌲' : '🏜️'}
        </button>
    );
}
