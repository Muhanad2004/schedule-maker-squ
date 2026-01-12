import { useLanguage } from './LanguageContext';

export default function LanguageToggle() {
    const { lang, toggleLang } = useLanguage();

    return (
        <button
            className="icon-btn lang-btn"
            onClick={toggleLang}
            title={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
        >
            {lang === 'en' ? 'عربي' : 'انجليزي'}
        </button>
    );
}
