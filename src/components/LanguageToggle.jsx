import React from 'react';
import { useLanguage } from './LanguageContext';

const LanguageToggle = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            className="lang-toggle-btn"
            onClick={toggleLanguage}
            title={language === 'en' ? "Switch to Arabic" : "Switch to English"}
        >
            <span className="lang-text">
                {language === 'en' ? 'عربي' : 'EN'}
            </span>
        </button>
    );
};

export default LanguageToggle;
