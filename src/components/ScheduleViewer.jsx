import { useMemo, useRef, useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import { formatTime } from '../utils/timeUtils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
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

// Format hour to "8 AM"
const formatHour = (h) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;

export default function ScheduleViewer({
  schedule,
  scheduleIndex,
  totalSchedules,
  onNext,
  onPrev,
  onJump,
  t
}) {
  const scheduleRef = useRef(null);
  const [examsExpanded, setExamsExpanded] = useState(false);
  const [inputPage, setInputPage] = useState('');

  // Define days based on translations or default
  const days = t?.days || ["Sun", "Mon", "Tue", "Wed", "Thu"];

  // Update input when index changes externally
  useMemo(() => {
    setInputPage((scheduleIndex + 1).toString());
  }, [scheduleIndex]);

  const handlePageInput = (e) => {
    setInputPage(e.target.value);
  };

  const handlePageKeyDown = (e) => {
    if (e.key === 'Enter') {
      const val = parseInt(inputPage, 10);
      if (!isNaN(val) && val >= 1 && val <= totalSchedules) {
        onJump(val - 1);
      } else {
        // Reset on invalid
        setInputPage((scheduleIndex + 1).toString());
      }
    }
  };

  const handlePageBlur = () => {
    const val = parseInt(inputPage, 10);
    if (!isNaN(val) && val >= 1 && val <= totalSchedules) {
      onJump(val - 1);
    } else {
      setInputPage((scheduleIndex + 1).toString());
    }
  };

  const handleDownload = useCallback(async () => {
    if (!scheduleRef.current) return;

    html2canvas(scheduleRef.current, { backgroundColor: null }).then(canvas => {
      const link = document.createElement('a');
      link.download = `schedule-${scheduleIndex + 1}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  }, [scheduleIndex]);

  // Process blocks
  const blocks = useMemo(() => {
    if (!schedule) return [];
    return schedule.flatMap((section, idx) =>
      (section.parsedSlots || [])
        .filter(slot => slot.day < 5)
        .map(slot => ({ ...section, ...slot, colorIndex: idx }))
    );
  }, [schedule]);

  // Position helpers
  const getTop = (mins) => ((mins - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const getHeight = (start, end) => ((end - start) / 60) * HOUR_HEIGHT;

  if (!schedule) {
    return (
      <div className="schedule-viewer empty">
        <div className="empty-message">
          <span className="icon">📅</span>
          <h3>{t.schedule}</h3>
          <p>{t.noSchedules}</p>
        </div>
      </div>
    );
  }

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="schedule-viewer">
      {/* Header */}
      <div className="schedule-header">
        <h2>{t.schedule} {scheduleIndex + 1} <span className="text-dim">{t.of} {totalSchedules}</span></h2>
        <div className="schedule-controls">
          <button onClick={onPrev} disabled={scheduleIndex === 0}>←</button>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {scheduleIndex + 1} / {totalSchedules}
          </span>
          <button onClick={onNext} disabled={scheduleIndex === totalSchedules - 1}>→</button>

          <button onClick={handleDownload} className="download-btn" title={t.saveImage}>
            📷
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="schedule-calendar">
        <div ref={scheduleRef} className="calendar-inner">
          {/* Day Headers */}
          <div className="calendar-header">
            <div className="time-label-header" />
            {days.map(d => <div key={d} className="day-header">{d}</div>)}
          </div>

          {/* Grid */}
          <div className="calendar-body">
            {/* Time Labels */}
            <div className="time-labels">
              {hours.map(h => (
                <div key={h} className="time-label" style={{ height: HOUR_HEIGHT }}>
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {days.map((_, dayIdx) => (
              <div key={dayIdx} className="day-column" style={{ height: hours.length * HOUR_HEIGHT }}>
                {/* Grid lines */}
                {hours.map(h => (
                  <div key={h} className="hour-line" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} />
                ))}

                {/* Blocks */}
                {blocks.filter(b => b.day === dayIdx).map((block, i) => {
                  const color = COLORS[block.colorIndex % COLORS.length];
                  const height = getHeight(block.start, block.end);
                  const compact = height < 50;

                  return (
                    <div
                      key={i}
                      className="course-block"
                      style={{
                        top: getTop(block.start),
                        height,
                        background: color.bg,
                        borderLeftColor: color.border,
                      }}
                      title={`${block.code} | ${block.instructor} | ${formatTime(block.start)} - ${formatTime(block.end)}`}
                    >
                      <div className="block-code">{block.code}/{block.section}</div>
                      <div className="block-time">
                        {formatTime(block.start)} - {formatTime(block.end)}
                      </div>
                      {!compact && height >= 60 && (
                        <div className="block-instructor">{block.instructor}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Exams */}
      <div className="schedule-footer">
        <div
          className="footer-header"
          onClick={() => setExamsExpanded(!examsExpanded)}
        >
          <div className="footer-title">📋 {t.examFooter}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {examsExpanded ? '▼' : '▲'}
          </div>
        </div>

        <div
          className="footer-content"
          style={{ maxHeight: examsExpanded ? '200px' : '0px', overflowY: 'auto' }}
        >
          <div className="exam-list">
            {schedule.map((section, idx) => {
              const color = COLORS[idx % COLORS.length];
              const hasExam = section.exam && section.exam.trim();
              return (
                <div key={idx} className="exam-item" style={{ borderLeftColor: color.bg }}>
                  <span className="exam-code">{section.code}</span>
                  <span className={`exam-date ${!hasExam ? 'tba' : ''}`}>
                    {hasExam ? section.exam : 'TBA'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
