import { useState, useMemo } from 'react';

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export default function FilterPanel({ blockedSlots, onToggleSlot, onToggleDay, onReset, t }) {
  const [expanded, setExpanded] = useState(false);

  // Days of week handling
  // If you are using Sunday as 0, match your data. 
  // Assuming 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  const days = t.days; // Use translated days array

  const formatHour = (h) => {
    const h12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${h12} ${ampm}`;
  };

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>{t.timeBlock}</h3>
        <button className="reset-btn" onClick={onReset}>{t.reset}</button>
      </div>

      <p className="filter-hint">{t.timeBlockHint}</p>

      {expanded && (
        <div className="filter-content">
          <div className="time-grid-container">
            <div className="time-grid">
              {/* Header Row */}
              <div className="grid-header-cell times-label">{t.hours}</div>
              {days.map((day, i) => (
                <div
                  key={day}
                  className="grid-header-cell day-label"
                  onClick={() => onToggleDay(i)}
                  title={`Toggle all ${day}`}
                >
                  {day}
                </div>
              ))}

              {/* Rows */}
              {HOURS.map(hour => (
                <>
                  <div key={`label-${hour}`} className="grid-time-label">
                    {formatHour(hour)}
                  </div>
                  {DAYS.map((_, dayIdx) => {
                    const key = `${dayIdx}-${hour}`;
                    const isBlocked = blockedSlots.includes(key);
                    return (
                      <div
                        key={key}
                        className={`grid-cell ${isBlocked ? 'blocked' : ''}`}
                        onClick={() => onToggleSlot(dayIdx, hour)}
                        title={`Click to block ${DAYS[dayIdx]} ${hour}:00 classes`}
                      >
                        {isBlocked ? '✕' : ''}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            <p className="filter-hint" style={{ textAlign: 'center', marginTop: '0.8rem' }}>
              Click cells to block/unblock that hour.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
