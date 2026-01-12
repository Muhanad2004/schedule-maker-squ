import { useLanguage } from './LanguageContext';

export default function LanguageToggle() {
    const { lang, toggleLang } = useLanguage();

    return (
        <button
            className="icon-btn lang-btn"
            onClick={toggleLang}
            title={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
        >
            {lang === 'en' ? (
                <img
                    src="https://emojicdn.elk.sh/%F0%9F%87%B4%F0%9F%87%B2?style=apple"
                    alt="Switch to Arabic"
                    className="lang-flag"
                    width="24"
                    height="24"
                />
            ) : (
                <img
                    src="https://emojicdn.elk.sh/%F0%9F%87%AC%F0%9F%87%A7?style=apple"
                    alt="Switch to English"
                    className="lang-flag"
                    width="24"
                    height="24"
                />
            )}
        </button>
    );
}
