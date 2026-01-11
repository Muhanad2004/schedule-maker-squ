import { useState, useMemo, useEffect } from 'react';
import { getInstructorScheduleSummary } from '../utils/timeUtils';

export default function CourseSelector({
  courses,
  selectedCourses,
  onToggleCourse,
  instructorFilters,
  onToggleInstructor,
  onClearAll,
  t
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Debounce search input
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setDebouncedTerm(searchTerm);
  //   }, 300); // 300ms delay
  //   return () => clearTimeout(timer);
  // }, [searchTerm]);
  // Actually, for simplicity and immediate feedback on small datasets, 
  // we might keep it instant but let's stick to "fits like a glove".
  // On second thought, React 18 automatic batching handles this well often.
  // But let's add it for strict performance "glove fit".

  // Actually, I can't easily insert hooks without changing the function body structure significantly 
  // if I try to be too clever. Let's just do the useEffect.

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredCourses = useMemo(() => {
    if (!debouncedTerm.trim()) return [];
    const terms = debouncedTerm.toLowerCase().split(/\s+/).filter(Boolean);
    return courses.filter(c => {
      const code = c.code.toLowerCase();
      const name = c.name.toLowerCase();
      return terms.every(t => code.includes(t) || name.includes(t));
    });
  }, [courses, debouncedTerm]);

  const isSelected = (courseId) => selectedCourses.some(c => c.id === courseId);

  return (
    <div className="course-selector">
      {/* Search Input */}
      <div className="selector-header">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Only show Clear All in "Selected" tab if we have selected courses */}
          {activeTab === 'selected' && selectedCourses.length > 0 && (
            <button className="clear-all-btn" onClick={onClearAll} title={t.remove}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="selector-tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          {t.tabs.all}
        </button>
        <button
          className={`tab-btn ${activeTab === 'selected' ? 'active' : ''}`}
          onClick={() => setActiveTab('selected')}
        >
          {t.tabs.selected} ({selectedCourses.length})
        </button>
      </div>

      {/* Content */}
      <div className="selector-content">
        {activeTab === 'all' ? (
          <SearchResults
            searchTerm={searchTerm}
            courses={filteredCourses}
            isSelected={isSelected}
            onToggle={onToggleCourse}
            t={t}
          />
        ) : (
          <SelectedCourses
            courses={selectedCourses}
            instructorFilters={instructorFilters}
            onToggle={onToggleCourse}
            onToggleInstructor={onToggleInstructor}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

function SearchResults({ searchTerm, courses, isSelected, onToggle, t }) {
  if (!searchTerm.trim()) {
    return <div className="empty-state">{t.emptySearchPrompt}</div>;
  }
  if (courses.length === 0) {
    return <div className="empty-state">{t.noMatchesFound}</div>;
  }
  return (
    <div className="course-list">
      {courses.map(course => (
        <div
          key={course.id}
          className={`course-item ${isSelected(course.id) ? 'selected' : ''}`}
          onClick={() => onToggle(course)}
        >
          <div className="course-info">
            <div className="course-code">{course.code}</div>
            <div className="course-name">{course.name}</div>
          </div>
          <span className="course-action">{isSelected(course.id) ? '✓' : '+'}</span>
        </div>
      ))}
    </div>
  );
}

function SelectedCourses({ courses, instructorFilters, onToggle, onToggleInstructor, t }) {
  if (courses.length === 0) {
    return <div className="empty-state">{t.noCoursesSelected}</div>;
  }
  return (
    <div className="course-list selected-list">
      {courses.map(course => {
        // Group sections by instructor
        const instructorMap = {};
        course.sections.forEach(s => {
          if (!instructorMap[s.instructor]) instructorMap[s.instructor] = [];
          instructorMap[s.instructor].push(s);
        });
        const instructors = Object.keys(instructorMap);
        const allowed = instructorFilters[course.id];

        return (
          <div key={course.id} className="selected-course-card">
            <div className="card-header">
              <div>
                <div className="course-code">{course.code}</div>
                <div className="course-name">{course.name}</div>
              </div>
              <button className="remove-btn" onClick={() => onToggle(course)}>✕</button>
            </div>

            <div className="instructor-filters">
              <span className="filter-label">{t.instructorTimesLabel}:</span>
              <div className="instructor-chips">
                {instructors.map(inst => {
                  const isIncluded = !allowed || allowed.includes(inst);
                  const timeSummary = getInstructorScheduleSummary(instructorMap[inst]);

                  return (
                    <button
                      key={inst}
                      className={`instructor-chip ${isIncluded ? 'included' : 'excluded'}`}
                      onClick={() => onToggleInstructor(course.id, inst)}
                      title={`Click to toggle.\nTeaches at: ${timeSummary}`}
                    >
                      <span className="inst-name">{inst}</span>
                      <span className="inst-time">{timeSummary}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
