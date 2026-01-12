import { useLanguage } from './LanguageContext';

export default function LanguageToggle() {
    const { lang, toggleLang } = useLanguage();

    // Using regional indicator symbols for flags
    const omanFlag = String.fromCodePoint(0x1F1F4, 0x1F1F2); // 🇴🇲
    const ukFlag = String.fromCodePoint(0x1F1EC, 0x1F1E7);   // 🇬🇧

    return (
        <button
            className="icon-btn"
            onClick={toggleLang}
            title={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
        >
            {lang === 'en' ? omanFlag : ukFlag}
        </button>
    );
}
