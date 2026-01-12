import { useTheme } from './ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
            {theme === 'light' ? (
                <img src="https://emojicdn.elk.sh/🌙?style=apple" alt="Dark Mode" className="emoji-icon" />
            ) : (
                <img src="https://emojicdn.elk.sh/☀️?style=apple" alt="Light Mode" className="emoji-icon" />
            )}
        </button>
    );
}
