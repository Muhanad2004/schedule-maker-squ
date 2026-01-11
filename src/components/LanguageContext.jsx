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
        searchPlaceholder: "Search for courses...",
        tabs: {
            all: "All Courses",
            selected: "Selected",
        },
        emptySearch: "No courses found matching",
        emptySelection: "No courses selected yet. Search and add courses to build your schedule!",
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
        noSchedules: "No schedules found. Try relaxing your filters.",
        examFooter: "Exam Schedule",
        saveImage: "Save as Image",

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
        searchPlaceholder: "ابحث عن المواد...",
        tabs: {
            all: "كل المواد",
            selected: "المواد المختارة",
        },
        emptySearch: "لا توجد مواد مطابقة لـ",
        emptySelection: "لم يتم اختيار أي مواد بعد. ابحث وأضف المواد لإنشاء جدولك!",
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
        noSchedules: "لم يتم العثور على جداول. حاول تقليل القيود.",
        examFooter: "جدول الاختبارات",
        saveImage: "حفظ كصورة",

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
