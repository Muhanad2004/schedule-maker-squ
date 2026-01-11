import { useState, useMemo } from 'react';
import { getInstructorScheduleSummary } from '../utils/timeUtils';

export default function CourseSelector({ 
  courses, 
  selectedCourses, 
  onToggleCourse, 
  instructorFilters, 
  onToggleInstructor,
  onClearAll
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    return courses.filter(c => {
      const code = c.code.toLowerCase();
      const name = c.name.toLowerCase();
      return terms.every(t => code.includes(t) || name.includes(t));
    });
  }, [courses, searchTerm]);

  const isSelected = (courseId) => selectedCourses.some(c => c.id === courseId);

  return (
    <div className="course-selector">
      {/* Search Input */}
      <div className="selector-header">
        <div style={{display:'flex', gap:'0.5rem'}}>
             <input
                type="text"
                placeholder="Search courses..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value) setActiveTab('search');
                }}
             />
             {selectedCourses.length > 0 && (
                 <button className="btn-icon-only" onClick={onClearAll} title="Clear All Courses">
                    🗑️
                 </button>
             )}
        </div>
      </div>

      {/* Tabs */}
      <div className="selector-tabs">
        <button 
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Search
        </button>
        <button 
          className={`tab ${activeTab === 'selected' ? 'selected-tab-active active' : ''}`}
          onClick={() => setActiveTab('selected')}
        >
          Selected ({selectedCourses.length})
        </button>
      </div>

      {/* Content */}
      <div className="selector-content">
        {activeTab === 'search' ? (
          <SearchResults 
            searchTerm={searchTerm}
            courses={filteredCourses}
            isSelected={isSelected}
            onToggle={onToggleCourse}
          />
        ) : (
          <SelectedCourses
            courses={selectedCourses}
            instructorFilters={instructorFilters}
            onToggle={onToggleCourse}
            onToggleInstructor={onToggleInstructor}
          />
        )}
      </div>
    </div>
  );
}

function SearchResults({ searchTerm, courses, isSelected, onToggle }) {
  if (!searchTerm.trim()) {
    return <div className="empty-state">Start typing to find courses...</div>;
  }
  if (courses.length === 0) {
    return <div className="empty-state">No matches found.</div>;
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

function SelectedCourses({ courses, instructorFilters, onToggle, onToggleInstructor }) {
  if (courses.length === 0) {
    return <div className="empty-state">No courses selected yet.</div>;
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
              <span className="filter-label">Instructors & Times:</span>
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
