import React, { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const translations = {
    en: {
        appTitle: "Schedule Maker",
        university: "Muhanad @ Sultan Qaboos University",
        generate: "Generate",
        processing: "Processing...",

        // Course Selector
        searchPlaceholder: "Type course code or name (e.g., ENGL3220, MATH)...",
        tabs: {
            all: "All Courses",
            selected: "Selected",
        },
        emptySearch: "No courses found matching",
        emptySelection: "No courses selected yet. Search above and click '+' to add courses!",
        emptySearchPrompt: "Start typing to search for courses...",
        noMatchesFound: "No courses match your search. Try a different term.",
        noCoursesSelected: "No courses selected. Use the search tab to add courses.",
        instructorTimesLabel: "Instructors & Times",
        remove: "Remove",

        // Filter Panel
        filters: "Filters",
        reset: "Reset Filters",
        timeBlock: "Block Times",
        timeBlockHint: "Click grid cells to block specific times",
        days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"], // Used in grid header
        hours: "Hours",

        // Schedule Viewer
        schedule: "Schedule",
        of: "of",
        crn: "CRN",
        time: "Time",
        instructor: "Instructor",
        examDate: "Exam Date",
        noSchedules: "No valid schedules found. Try removing some filters or selecting different instructors.",
        examFooter: "Final Exams",
        saveImage: "Save as Image",
        loadingCourses: "Loading course data...",
        confirmClearCourses: "Clear all selected courses?",
        confirmResetFilters: "Reset all time blocks?",

        // Instructors
        instructorFilter: "Filter Instructors",
        include: "Include",
        exclude: "Exclude",

        // Footer/Misc
        share: "Share"
    },
    ar: {
        appTitle: "صانع الجداول",
        university: "مهند @ جامعة السلطان قابوس",
        generate: "إنشاء الجداول",
        processing: "جارٍ المعالجة...",

        // Course Selector
        searchPlaceholder: "اكتب رمز أو اسم المادة (مثال: ENGL3220)...",
        tabs: {
            all: "كل المواد",
            selected: "المواد المختارة",
        },
        emptySearch: "لا توجد مواد مطابقة لـ",
        emptySelection: "لم يتم اختيار أي مواد بعد. ابحث أعلاه واضغط '+' لإضافة المواد!",
        emptySearchPrompt: "ابدأ الكتابة للبحث عن المواد...",
        noMatchesFound: "لا توجد مواد مطابقة لبحثك. جرب كلمة أخرى.",
        noCoursesSelected: "لم يتم اختيار مواد. استخدم تبويب البحث لإضافة مواد.",
        instructorTimesLabel: "المحاضرون والأوقات",
        remove: "إزالة",

        // Filter Panel
        filters: "تصفية",
        reset: "إعادة تعيين",
        timeBlock: "حظر الأوقات",
        timeBlockHint: "اضغط على الجدول لحظر أوقات محددة",
        days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"],
        hours: "الساعات",

        // Schedule Viewer
        schedule: "جدول",
        of: "من",
        crn: "رمز",
        time: "الوقت",
        instructor: "المحاضر",
        examDate: "تاريخ الاختبار",
        noSchedules: "لم يتم العثور على جداول صالحة. حاول إزالة بعض القيود أو اختيار محاضرين مختلفين.",
        examFooter: "الاختبارات النهائية",
        saveImage: "حفظ كصورة",
        loadingCourses: "جارٍ تحميل بيانات المواد...",
        confirmClearCourses: "مسح جميع المواد المختارة؟",
        confirmResetFilters: "إعادة تعيين جميع حظر الأوقات؟",

        // Instructors
        instructorFilter: "تصفية المحاضرين",
        include: "تضمين",
        exclude: "استبعاد",

        // Footer/Misc
        share: "مشاركة"
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('app-language') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('app-language', language);

        // Set Direction
        const dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', language);

        // Add font class for Arabic
        if (language === 'ar') {
            document.body.classList.add('font-arabic');
        } else {
            document.body.classList.remove('font-arabic');
        }

    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ar' : 'en');
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t: translations[language] }}>
            {children}
        </LanguageContext.Provider>
    );
};
