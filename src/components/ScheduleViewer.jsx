import { useMemo, useRef, useCallback, useState } from 'react';
import { formatTime } from '../utils/timeUtils';

const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 60;

const COLORS = [
  { bg: '#3b82f6', border: '#2563eb' },
  { bg: '#10b981', border: '#059669' },
  { bg: '#f59e0b', border: '#d97706' },
  { bg: '#ef4444', border: '#dc2626' },
  { bg: '#8b5cf6', border: '#7c3aed' },
  { bg: '#ec4899', border: '#db2777' },
  { bg: '#06b6d4', border: '#0891b2' },
  { bg: '#84cc16', border: '#65a30d' },
];

const formatHour = (h) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;

export default function ScheduleViewer({
  schedule,
  scheduleIndex,
  totalSchedules,
  onNext,
  onPrev,
  t
}) {
  const scheduleRef = useRef(null);
  const [examsExpanded, setExamsExpanded] = useState(false);
  const days = t?.days || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const handleDownload = useCallback(async () => {
    if (!scheduleRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(scheduleRef.current, { backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = `schedule-${scheduleIndex + 1}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [scheduleIndex]);

  const blocks = useMemo(() => {
    if (!schedule) return [];
    return schedule.flatMap((section, idx) =>
      (section.parsedSlots || [])
        .filter(slot => slot.day < 5)
        .map(slot => ({ ...section, ...slot, colorIndex: idx }))
    );
  }, [schedule]);

  const getTop = (mins) => ((mins - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const getHeight = (start, end) => ((end - start) / 60) * HOUR_HEIGHT;

  if (!schedule) {
    return (
      <div className="schedule-viewer empty">
        <div className="empty-message">
          <span className="empty-icon">📅</span>
          <h3>{t.schedule}</h3>
          <p>{t.noSchedules}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-viewer">
      <div className="schedule-header">
        <h2>
          {t.schedule} {scheduleIndex + 1}
          <span className="text-dim"> {t.of} {totalSchedules}</span>
        </h2>
        <div className="schedule-controls">
          <button className="nav-btn" onClick={onPrev} disabled={scheduleIndex === 0}>
            ←
          </button>
          <span className="schedule-counter">{scheduleIndex + 1} / {totalSchedules}</span>
          <button className="nav-btn" onClick={onNext} disabled={scheduleIndex === totalSchedules - 1}>
            →
          </button>
          <button className="icon-btn" onClick={handleDownload} title={t.saveImage}>
            📷
          </button>
        </div>
      </div>

      <div className="schedule-calendar">
        <div ref={scheduleRef} className="calendar-grid-wrapper">
          {/* Header Row */}
          <div className="calendar-row header-row">
            <div className="time-cell"></div>
            {days.map(day => (
              <div key={day} className="day-cell header-cell">{day}</div>
            ))}
          </div>

          {/* Hour Rows */}
          {hours.map(hour => (
            <div key={hour} className="calendar-row">
              <div className="time-cell">
                {formatHour(hour)}
              </div>
              {days.map((_, dayIdx) => {
                // Find blocks for this cell
                const cellBlocks = blocks.filter(b => {
                  const startHour = Math.floor(b.start / 60);
                  return b.day === dayIdx && startHour === hour;
                });

                return (
                  <div key={dayIdx} className="day-cell" style={{ height: HOUR_HEIGHT }}>
                    {cellBlocks.map((block, i) => {
                      const color = COLORS[block.colorIndex % COLORS.length];
                      const height = getHeight(block.start, block.end);
                      const offsetInHour = (block.start % 60) / 60 * HOUR_HEIGHT;

                      return (
                        <div
                          key={i}
                          className="course-block"
                          style={{
                            top: offsetInHour,
                            height,
                            backgroundColor: color.bg,
                            borderLeftColor: color.border,
                          }}
                          title={`${block.code} | ${block.instructor}`}
                        >
                          <div className="block-code">{block.code}/{block.section}</div>
                          <div className="block-time">
                            {formatTime(block.start)} - {formatTime(block.end)}
                          </div>
                          {height >= 55 && (
                            <div className="block-instructor">{block.instructor}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="schedule-footer">
        <div className="footer-header" onClick={() => setExamsExpanded(!examsExpanded)}>
          <span>📋 {t.examFooter}</span>
          <span>{examsExpanded ? '▼' : '▲'}</span>
        </div>

        {examsExpanded && (
          <div className="footer-content">
            <div className="exam-list">
              {schedule.map((section, idx) => {
                const color = COLORS[idx % COLORS.length];
                return (
                  <div key={idx} className="exam-item" style={{ borderLeftColor: color.bg }}>
                    <span className="exam-code">{section.code}</span>
                    <span className="exam-date">{section.exam || 'TBA'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
