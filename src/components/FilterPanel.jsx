import { useState, useMemo } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export default function FilterPanel({ blockedSlots, onToggleSlot, onToggleDay, onReset }) {
  const [expanded, setExpanded] = useState(false);

  const formatHour = (h) => {
    const h12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${h12} ${ampm}`;
  };

  return (
    <div className="filter-panel">
      <div className="filter-toggle" onClick={() => setExpanded(!expanded)}>
        <div style={{display:'flex', alignItems:'center', gap: '0.5rem'}}>
            <span>📅 Block Specific Times</span>
            {blockedSlots.length > 0 && (
                <button 
                    className="btn-xs-reset" 
                    onClick={(e) => { e.stopPropagation(); onReset(); }}
                    title="Clear all filters"
                >
                    Reset ({blockedSlots.length})
                </button>
            )}
        </div>
        <span style={{ fontSize: '0.8rem' }}>{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <div className="filter-content">
          <div className="time-grid-container">
            <div className="time-grid">
              {/* Header Row */}
              <div className="grid-corner"></div>
              {DAYS.map((day, idx) => (
                <div 
                  key={day} 
                  className="grid-header clickable"
                  onClick={() => onToggleDay(idx)}
                  title={`Block/Unblock all ${day}`}
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
            <p className="filter-hint" style={{textAlign: 'center', marginTop: '0.8rem'}}>
                Click cells to block/unblock that hour.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
