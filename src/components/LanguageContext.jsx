import { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const translations = {
    en: {
        searchPlaceholder: 'Search courses (e.g., COMP3000)...',
        tabs: { all: 'All Courses', selected: 'Selected' },
        emptySearchPrompt: 'Start typing to search for courses...',
        noMatchesFound: 'No courses found.',
        noCoursesSelected: 'No courses selected yet.',
        instructorTimesLabel: 'Instructors',
        remove: 'Remove',
        filterTitle: 'Time Filters',
        resetFilters: 'Reset',
        generate: 'Generate',
        processing: 'Processing...',
        schedule: 'Schedule',
        of: 'of',
        noSchedules: 'No valid schedules found. Try removing some filters or selecting different instructors.',
        saveImage: 'Save as Image',
        examFooter: 'Exam Dates',
        loadingCourses: 'Loading courses...',
        noSchedulesFound: 'No valid schedules found with current filters.',
        confirmClearCourses: 'Clear all selected courses?',
        confirmResetFilters: 'Reset all time filters?',
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu']
    },
    ar: {
        searchPlaceholder: 'ابحث عن المقررات...',
        tabs: { all: 'جميع المقررات', selected: 'المحددة' },
        emptySearchPrompt: 'ابدأ الكتابة للبحث...',
        noMatchesFound: 'لا توجد نتائج.',
        noCoursesSelected: 'لم يتم تحديد أي مقررات.',
        instructorTimesLabel: 'المدرسون',
        remove: 'إزالة',
        filterTitle: 'فلاتر الوقت',
        resetFilters: 'إعادة تعيين',
        generate: 'إنشاء',
        processing: 'جاري المعالجة...',
        schedule: 'الجدول',
        of: 'من',
        noSchedules: 'لا توجد جداول متاحة. حاول تغيير الفلاتر.',
        saveImage: 'حفظ كصورة',
        examFooter: 'مواعيد الاختبارات',
        loadingCourses: 'جاري تحميل المقررات...',
        noSchedulesFound: 'لا توجد جداول متاحة.',
        confirmClearCourses: 'مسح جميع المقررات المحددة؟',
        confirmResetFilters: 'إعادة تعيين جميع الفلاتر؟',
        days: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس']
    }
};

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        try {
            return localStorage.getItem('lang') || 'en';
        } catch {
            return 'en';
        }
    });

    useEffect(() => {
        document.body.classList.toggle('rtl', lang === 'ar');
        try {
            localStorage.setItem('lang', lang);
        } catch {
            // Ignore
        }
    }, [lang]);

    const toggleLang = () => {
        setLang(prev => prev === 'en' ? 'ar' : 'en');
    };

    const t = translations[lang];

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}
