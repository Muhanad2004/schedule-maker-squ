import { useState, useEffect, useCallback } from 'react';
import { loadCourses } from './utils/dataLoader';
import { generateSchedules } from './utils/scheduler';
import { parseTimeSlots } from './utils/timeUtils';
import CourseSelector from './components/CourseSelector';
import ScheduleViewer from './components/ScheduleViewer';
import FilterPanel from './components/FilterPanel';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import LanguageToggle from './components/LanguageToggle';
import LoadingScreen from './components/LoadingScreen';
import DataSourceBadge from './components/DataSourceBadge';
import './index.css';
import { ThemeProvider } from './components/ThemeContext';
import ThemeToggle from './components/ThemeToggle';

// LocalStorage helpers
const load = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export default function App() {
  // Wrapper for inner content to use context
  const AppContent = () => {
    const { t } = useLanguage();

    // Core state
    const [allCourses, setAllCourses] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState(() => load('selectedCourses', []));
    const [instructorFilters, setInstructorFilters] = useState(() => load('instructorFilters', {}));

    // ... rest of component

    // Schedule filters: Array of strings "dayIndex-hour" (e.g., "0-8" for Sun 8am)
    const [blockedSlots, setBlockedSlots] = useState(() => load('blockedSlots', []));

    // Generated schedules
    const [schedules, setSchedules] = useState([]);
    const [scheduleIndex, setScheduleIndex] = useState(0);

    // UI state
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Load courses on mount
    useEffect(() => {
      loadCourses().then(data => {
        setAllCourses(data);
        setLoading(false);
      });
    }, []);

    // Persist state
    useEffect(() => { save('selectedCourses', selectedCourses); }, [selectedCourses]);
    useEffect(() => { save('instructorFilters', instructorFilters); }, [instructorFilters]);
    useEffect(() => { save('blockedSlots', blockedSlots); }, [blockedSlots]);

    // Handlers
    const handleToggleCourse = useCallback((course) => {
      setSelectedCourses(prev => {
        const exists = prev.find(c => c.id === course.id);
        return exists ? prev.filter(c => c.id !== course.id) : [...prev, course];
      });
      setSchedules([]);
      setScheduleIndex(0);
    }, []);

    const handleToggleInstructor = useCallback((courseId, instructor) => {
      setInstructorFilters(prev => {
        const course = selectedCourses.find(c => c.id === courseId);
        if (!course) return prev;

        const allInstructors = [...new Set(course.sections.map(s => s.instructor))];
        const currentAllowed = prev[courseId];

        let newAllowed;
        if (!currentAllowed) {
          newAllowed = allInstructors.filter(i => i !== instructor);
        } else {
          newAllowed = currentAllowed.includes(instructor)
            ? currentAllowed.filter(i => i !== instructor)
            : [...currentAllowed, instructor];
        }

        if (newAllowed.length === allInstructors.length) {
          const copy = { ...prev };
          delete copy[courseId];
          return copy;
        }
        return { ...prev, [courseId]: newAllowed };
      });
    }, [selectedCourses]);

    const handleToggleDay = useCallback((day) => {
      // Hours 8 to 17 (matches FilterPanel logic)
      const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

      setBlockedSlots(prev => {
        // Check if all hours in this day are already blocked
        const allBlocked = hours.every(h => prev.includes(`${day}-${h}`));

        if (allBlocked) {
          // Unblock all
          return prev.filter(key => !key.startsWith(`${day}-`));
        } else {
          // Block all (add missing ones)
          const newSlots = [...prev];
          hours.forEach(h => {
            const key = `${day}-${h}`;
            if (!newSlots.includes(key)) newSlots.push(key);
          });
          return newSlots;
        }
      });
    }, []);

    const handleToggleSlot = useCallback((day, hour) => {
      const key = `${day}-${hour}`;
      setBlockedSlots(prev =>
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
    }, []);

    const handleGenerate = useCallback(() => {
      if (selectedCourses.length === 0) return;

      setGenerating(true);

      // Use setTimeout to allow UI to update
      setTimeout(() => {
        // Filter sections based on all criteria
        const coursesToSchedule = selectedCourses.map(course => {
          const allowedInstructors = instructorFilters[course.id];

          const filteredSections = course.sections.filter(section => {
            // Instructor filter
            if (allowedInstructors && !allowedInstructors.includes(section.instructor)) {
              return false;
            }

            // Parse time slots
            const timeSlots = parseTimeSlots(section.time);

            // Block filter: Check if section OVERLAPS with any blocked hourly slot
            // A slot "0-8" means Sunday 8:00-8:59 is blocked
            const hasConflict = timeSlots.some(slot => {
              // Convert section time to set of touched hours
              const startH = Math.floor(slot.start / 60);
              const endH = Math.floor((slot.end - 1) / 60); // -1 because 9:00 end doesn't overlap 9-10 slot

              for (let h = startH; h <= endH; h++) {
                if (blockedSlots.includes(`${slot.day}-${h}`)) return true;
              }
              return false;
            });

            if (hasConflict) return false;

            return true;
          });

          return { ...course, sections: filteredSections };
        });

        const results = generateSchedules(coursesToSchedule);
        setSchedules(results);
        setScheduleIndex(0);
        setGenerating(false);

        if (results.length === 0) {
          alert(t.noSchedulesFound);
        }
      }, 50);
    }, [selectedCourses, instructorFilters, blockedSlots, t]);

    const handlePrev = useCallback(() => {
      setScheduleIndex(i => Math.max(0, i - 1));
    }, []);

    const handleNext = useCallback(() => {
      setScheduleIndex(i => Math.min(schedules.length - 1, i + 1));
    }, [schedules.length]);

    const handleClearCourses = useCallback(() => {
      if (window.confirm(t.confirmClearCourses)) {
        setSelectedCourses([]);
        setSchedules([]);
        setScheduleIndex(0);
        setInstructorFilters({});
      }
    }, [t]);

    const handleResetFilters = useCallback(() => {
      if (window.confirm(t.confirmResetFilters)) {
        setBlockedSlots([]);
        // setBlockedDays([]); // Clear legacy if exists - removed as per instruction
        // setBlockedHours([]); // Clear legacy if exists - removed as per instruction
      }
    }, [t]);

    // Jump to specific schedule
    const handleJumpToSchedule = useCallback((index) => {
      if (index >= 0 && index < schedules.length) {
        setScheduleIndex(index);
      }
    }, [schedules.length]);

    if (loading) {
      return <LoadingScreen message={t.loadingCourses} />;
    }

    return (
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="header-title">
            <h1>Schedule Maker</h1>
            <span className="divider" />
            <span className="subtitle">Muhanad @ Sultan Qaboos University</span>
            <DataSourceBadge sourceDate="2026-01-11" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <LanguageToggle />
            <ThemeToggle />
            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={selectedCourses.length === 0 || generating}
            >
              {generating ? t.processing : `${t.generate} (${selectedCourses.length})`}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="app-main">
          {/* Left Panel */}
          <aside className="left-panel">
            <CourseSelector
              courses={allCourses}
              selectedCourses={selectedCourses}
              onToggleCourse={handleToggleCourse}
              instructorFilters={instructorFilters}
              onToggleInstructor={handleToggleInstructor}
              onClearAll={handleClearCourses}
              t={t}
            />
            <FilterPanel
              blockedSlots={blockedSlots}
              onToggleSlot={handleToggleSlot}
              onToggleDay={handleToggleDay}
              onReset={handleResetFilters}
              t={t}
            />
          </aside>

          {/* Right Panel */}
          <section className="right-panel">
            <ScheduleViewer
              schedule={schedules[scheduleIndex]}
              scheduleIndex={scheduleIndex}
              totalSchedules={schedules.length}
              onNext={handleNext}
              onPrev={handlePrev}
              onJump={handleJumpToSchedule}
              t={t}
            />
          </section>
        </main>
      </div>
    );
  };

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </LanguageProvider>
  );
}
