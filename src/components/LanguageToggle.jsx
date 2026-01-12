import { useLanguage } from './LanguageContext';

export default function LanguageToggle() {
    const { lang, toggleLang } = useLanguage();

    return (
        <button
            className="icon-btn"
            onClick={toggleLang}
            title={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
        >
            {lang === 'en' ? 'عربي' : 'EN'}
        </button>
    );
}
